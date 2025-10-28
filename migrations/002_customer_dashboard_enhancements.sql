-- Migration: Customer Dashboard Enhancements
-- This migration adds views and functions to support the customer dashboard functionality
-- Run this after the main schema migration

-- =====================================================
-- STEP 1: Create Customer Dashboard Views
-- =====================================================

-- Customer summary view for dashboard
CREATE OR REPLACE VIEW public.customer_dashboard_summary AS
SELECT
  c.customer_id,
  c.username,
  c.email,
  c.whatsapp,
  c.alamat,
  c.created_at as customer_since,
  COALESCE(cp.current_balance, 0) as points_balance,
  COALESCE(cp.total_earned, 0) as total_points_earned,
  COALESCE(cp.total_redeemed, 0) as total_points_redeemed,
  COALESCE(o.order_count, 0) as total_orders,
  COALESCE(o.total_spent, 0) as total_spent,
  COALESCE(r.referrals_count, 0) as successful_referrals,
  COALESCE(r.total_referral_discounts, 0) as total_referral_discounts,
  COALESCE(o.last_order_date, c.created_at) as last_activity_date
FROM public.customers c
LEFT JOIN public.customer_points cp ON c.customer_id = cp.customer_id
LEFT JOIN (
  SELECT
    customer_id,
    COUNT(*) as order_count,
    SUM(total_price) as total_spent,
    MAX(created_at) as last_order_date
  FROM public.orders
  GROUP BY customer_id
) o ON c.customer_id = o.customer_id
LEFT JOIN (
  SELECT
    ru.referrer_customer_id,
    COUNT(*) as referrals_count,
    SUM(ru.discount_applied) as total_referral_discounts
  FROM public.referral_usage ru
  GROUP BY ru.referrer_customer_id
) r ON c.customer_id = r.referrer_customer_id;

-- Customer order history view
CREATE OR REPLACE VIEW public.customer_order_history AS
SELECT
  c.customer_id,
  c.username,
  o.invoice_id,
  o.status,
  o.total_price,
  o.subtotal,
  o.payment,
  o.created_at as order_date,
  o.referral_code,
  o.referral_discount_amount,
  o.points_used,
  o.points_discount_amount,
  -- Calculate total discounts
  COALESCE(o.referral_discount_amount, 0) + COALESCE(o.points_discount_amount, 0) +
  COALESCE(od.total_order_discounts, 0) as total_discounts,
  -- Get order items as JSON array
  (
    SELECT json_agg(
      json_build_object(
        'shoe_name', oi.shoe_name,
        'amount', oi.amount,
        'service', oi.service
      )
    )
    FROM public.order_item oi
    WHERE oi.invoice_id = o.invoice_id
  ) as order_items,
  -- Get applied discounts as JSON array
  (
    SELECT json_agg(
      json_build_object(
        'discount_code', od2.discount_code,
        'discounted_amount', od2.discounted_amount
      )
    )
    FROM public.order_discounts od2
    WHERE od2.order_invoice_id = o.invoice_id
  ) as applied_discounts
FROM public.customers c
INNER JOIN public.orders o ON c.customer_id = o.customer_id
LEFT JOIN (
  SELECT
    order_invoice_id,
    SUM(discounted_amount) as total_order_discounts
  FROM public.order_discounts
  GROUP BY order_invoice_id
) od ON o.invoice_id = od.order_invoice_id;

-- Customer points transaction history view
CREATE OR REPLACE VIEW public.customer_points_history AS
SELECT
  c.customer_id,
  c.username,
  pt.transaction_type,
  pt.points_change,
  pt.balance_after,
  pt.reference_type,
  pt.reference_id,
  pt.description,
  pt.created_at as transaction_date,
  -- Additional context based on reference type
  CASE
    WHEN pt.reference_type = 'referral' THEN
      (SELECT ru.order_invoice_id FROM public.referral_usage ru WHERE ru.id::text = pt.reference_id)
    WHEN pt.reference_type = 'redemption' THEN
      pt.reference_id
    ELSE pt.reference_id
  END as context_reference
FROM public.customers c
INNER JOIN public.points_transactions pt ON c.customer_id = pt.customer_id;

-- Customer referral activity view
CREATE OR REPLACE VIEW public.customer_referral_activity AS
SELECT
  c.customer_id as referrer_id,
  c.username as referrer_name,
  ru.referral_code,
  ru.referred_customer_id,
  (SELECT rc.username FROM public.customers rc WHERE rc.customer_id = ru.referred_customer_id) as referred_name,
  ru.order_invoice_id,
  ru.discount_applied,
  ru.points_awarded,
  ru.used_at as referral_date,
  o.status as referred_order_status,
  o.total_price as referred_order_amount
FROM public.customers c
INNER JOIN public.referral_usage ru ON c.customer_id = ru.referrer_customer_id
LEFT JOIN public.orders o ON ru.order_invoice_id = o.invoice_id;

-- =====================================================
-- STEP 2: Create Helper Functions
-- =====================================================

-- Function to get customer dashboard data
CREATE OR REPLACE FUNCTION public.get_customer_dashboard(p_customer_id text)
RETURNS TABLE (
  customer_id text,
  username text,
  email text,
  whatsapp text,
  alamat text,
  customer_since timestamptz,
  points_balance bigint,
  total_points_earned bigint,
  total_points_redeemed bigint,
  total_orders bigint,
  total_spent bigint,
  successful_referrals bigint,
  total_referral_discounts bigint,
  last_activity_date timestamptz,
  order_history json,
  points_history json,
  referral_activity json
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cds.customer_id,
    cds.username,
    cds.email,
    cds.whatsapp,
    cds.alamat,
    cds.customer_since,
    cds.points_balance,
    cds.total_points_earned,
    cds.total_points_redeemed,
    cds.total_orders,
    cds.total_spent,
    cds.successful_referrals,
    cds.total_referral_discounts,
    cds.last_activity_date,
    -- Get recent orders (last 10)
    (
      SELECT json_agg(
        json_build_object(
          'invoice_id', oh.invoice_id,
          'status', oh.status,
          'total_price', oh.total_price,
          'order_date', oh.order_date,
          'order_items', oh.order_items,
          'total_discounts', oh.total_discounts
        )
      )
      FROM (
        SELECT * FROM public.customer_order_history
        WHERE customer_id = p_customer_id
        ORDER BY order_date DESC
        LIMIT 10
      ) oh
    ) as order_history,
    -- Get recent points transactions (last 10)
    (
      SELECT json_agg(
        json_build_object(
          'transaction_type', ph.transaction_type,
          'points_change', ph.points_change,
          'balance_after', ph.balance_after,
          'description', ph.description,
          'transaction_date', ph.transaction_date,
          'context_reference', ph.context_reference
        )
      )
      FROM (
        SELECT * FROM public.customer_points_history
        WHERE customer_id = p_customer_id
        ORDER BY transaction_date DESC
        LIMIT 10
      ) ph
    ) as points_history,
    -- Get recent referral activity (last 10)
    (
      SELECT json_agg(
        json_build_object(
          'referral_code', ra.referral_code,
          'referred_name', ra.referred_name,
          'discount_applied', ra.discount_applied,
          'points_awarded', ra.points_awarded,
          'referral_date', ra.referral_date,
          'referred_order_status', ra.referred_order_status
        )
      )
      FROM (
        SELECT * FROM public.customer_referral_activity
        WHERE referrer_id = p_customer_id
        ORDER BY referral_date DESC
        LIMIT 10
      ) ra
    ) as referral_activity
  FROM public.customer_dashboard_summary cds
  WHERE cds.customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get customer statistics
CREATE OR REPLACE FUNCTION public.get_customer_statistics(p_customer_id text)
RETURNS TABLE (
  total_orders bigint,
  total_spent bigint,
  points_balance bigint,
  successful_referrals bigint,
  last_order_date timestamptz,
  average_order_value numeric,
  points_to_next_redemption bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(cds.total_orders, 0) as total_orders,
    COALESCE(cds.total_spent, 0) as total_spent,
    COALESCE(cds.points_balance, 0) as points_balance,
    COALESCE(cds.successful_referrals, 0) as successful_referrals,
    cds.last_activity_date as last_order_date,
    CASE
      WHEN cds.total_orders > 0 THEN
        ROUND(cds.total_spent::numeric / cds.total_orders::numeric, 2)
      ELSE 0
    END as average_order_value,
    CASE
      WHEN cp.current_balance >= rs.points_redemption_minimum THEN
        0
      ELSE
        rs.points_redemption_minimum - COALESCE(cp.current_balance, 0)
    END as points_to_next_redemption
  FROM public.customer_dashboard_summary cds
  LEFT JOIN public.customer_points cp ON cds.customer_id = cp.customer_id
  CROSS JOIN (SELECT * FROM public.referral_settings LIMIT 1) rs
  WHERE cds.customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate customer referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_customer_id text)
RETURNS text AS $$
DECLARE
  v_referral_code text;
  v_username text;
BEGIN
  -- Get customer username
  SELECT username INTO v_username FROM public.customers WHERE customer_id = p_customer_id;

  IF v_username IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  -- Generate referral code: first 3 letters of username + random 4 digits
  v_referral_code := upper(substring(v_username, 1, 3)) || lpad(floor(random() * 10000)::text, 4, '0');

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.orders WHERE referral_code = v_referral_code LIMIT 1) LOOP
    v_referral_code := upper(substring(v_username, 1, 3)) || lpad(floor(random() * 10000)::text, 4, '0');
  END LOOP;

  RETURN v_referral_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 3: Create Performance Indexes for Views
-- =====================================================

-- Indexes to support dashboard queries
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON public.customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id_status ON public.orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_customer_id_date ON public.points_transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_usage_referrer_date ON public.referral_usage(referrer_customer_id, used_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_item_invoice_id_name ON public.order_item(invoice_id, shoe_name);
CREATE INDEX IF NOT EXISTS idx_order_discounts_order_invoice ON public.order_discounts(order_invoice_id);

-- =====================================================
-- STEP 4: Grant Permissions
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant permissions on tables
GRANT SELECT ON public.customers TO authenticated, anon;
GRANT SELECT ON public.orders TO authenticated, anon;
GRANT SELECT ON public.order_item TO authenticated, anon;
GRANT SELECT ON public.order_discounts TO authenticated, anon;
GRANT SELECT ON public.service_catalog TO authenticated, anon;
GRANT SELECT ON public.service_category TO authenticated, anon;
GRANT SELECT ON public.discount TO authenticated, anon;
GRANT SELECT ON public.referral_settings TO authenticated, anon;
GRANT SELECT ON public.customer_points TO authenticated, anon;
GRANT SELECT ON public.referral_usage TO authenticated, anon;
GRANT SELECT ON public.points_transactions TO authenticated, anon;

-- Grant permissions on views
GRANT SELECT ON public.customer_dashboard_summary TO authenticated, anon;
GRANT SELECT ON public.customer_order_history TO authenticated, anon;
GRANT SELECT ON public.customer_points_history TO authenticated, anon;
GRANT SELECT ON public.customer_referral_activity TO authenticated, anon;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_customer_dashboard(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_customer_statistics(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.generate_referral_code(text) TO authenticated, anon;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Notes:
-- 1. These views provide pre-calculated dashboard data for better performance
-- 2. Functions encapsulate complex business logic for reuse
-- 3. Indexes are optimized for common dashboard queries
-- 4. Permissions are set for both authenticated and anonymous users
-- 5. Consider adding RLS policies based on your security requirements