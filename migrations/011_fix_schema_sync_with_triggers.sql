-- =====================================================
-- FIX SCHEMA SYNC WITH AUTOMATIC TRIGGERS
-- =====================================================
-- This migration sets up automatic syncing between public and dev schemas
-- Run this to fix the foreign key constraint errors

-- =====================================================
-- 1. CREATE SYNC FUNCTION FOR CUSTOMERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_customer_to_dev()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into dev.customers when new customer is created in public
  INSERT INTO dev.customers (id, customer_id, username, email, whatsapp, alamat, created_at)
  VALUES (NEW.id, NEW.customer_id, NEW.username, NEW.email, NEW.whatsapp, NEW.alamat, NEW.created_at)
  ON CONFLICT (customer_id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    whatsapp = EXCLUDED.whatsapp,
    alamat = EXCLUDED.alamat;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_customer_update_to_dev()
RETURNS TRIGGER AS $$
BEGIN
  -- Update dev.customers when public.customers is updated
  UPDATE dev.customers SET
    username = NEW.username,
    email = NEW.email,
    whatsapp = NEW.whatsapp,
    alamat = NEW.alamat
  WHERE customer_id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS on_customer_create_sync ON public.customers;
DROP TRIGGER IF EXISTS on_customer_update_sync ON public.customers;

CREATE TRIGGER on_customer_create_sync
  AFTER INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_customer_to_dev();

CREATE TRIGGER on_customer_update_sync
  AFTER UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_customer_update_to_dev();

-- =====================================================
-- 2. CREATE SYNC FUNCTION FOR ORDERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_order_to_dev()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into dev.orders when new order is created in public
  INSERT INTO dev.orders (
    id, invoice_id, customer_id, subtotal, payment, created_at, status,
    referral_code, referral_discount_amount, points_awarded, points_used,
    total_price, points_discount_amount, fulfillment_type, drop_point_id,
    customer_marking, drop_point_capacity_used, membership_discount_amount,
    membership_level_id
  )
  VALUES (
    NEW.id, NEW.invoice_id, NEW.customer_id, NEW.subtotal, NEW.payment, NEW.created_at, NEW.status,
    NEW.referral_code, NEW.referral_discount_amount, NEW.points_awarded, NEW.points_used,
    NEW.total_price, NEW.points_discount_amount, NEW.fulfillment_type, NEW.drop_point_id,
    NEW.customer_marking, NEW.drop_point_capacity_used, NEW.membership_discount_amount,
    NEW.membership_level_id
  )
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    total_price = EXCLUDED.total_price,
    payment = EXCLUDED.payment,
    membership_discount_amount = EXCLUDED.membership_discount_amount,
    membership_level_id = EXCLUDED.membership_level_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_order_update_to_dev()
RETURNS TRIGGER AS $$
BEGIN
  -- Update dev.orders when public.orders is updated
  UPDATE dev.orders SET
    status = NEW.status,
    total_price = NEW.total_price,
    payment = NEW.payment,
    membership_discount_amount = NEW.membership_discount_amount,
    membership_level_id = NEW.membership_level_id
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS on_order_create_sync ON public.orders;
DROP TRIGGER IF EXISTS on_order_update_sync ON public.orders;

CREATE TRIGGER on_order_create_sync
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_to_dev();

CREATE TRIGGER on_order_update_sync
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.total_price IS DISTINCT FROM NEW.total_price)
  EXECUTE FUNCTION public.sync_order_update_to_dev();

-- =====================================================
-- 3. BACKFILL ALL EXISTING DATA FROM PUBLIC TO DEV
-- =====================================================

-- Sync customers
INSERT INTO dev.customers (id, customer_id, username, email, whatsapp, alamat, created_at)
SELECT id, customer_id, username, email, whatsapp, alamat, created_at
FROM public.customers
ON CONFLICT (customer_id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  whatsapp = EXCLUDED.whatsapp,
  alamat = EXCLUDED.alamat;

-- Sync orders
INSERT INTO dev.orders (
  id, invoice_id, customer_id, subtotal, payment, created_at, status,
  referral_code, referral_discount_amount, points_awarded, points_used,
  total_price, points_discount_amount, fulfillment_type, drop_point_id,
  customer_marking, drop_point_capacity_used
)
SELECT
  id, invoice_id, customer_id, subtotal, payment, created_at, status,
  referral_code, referral_discount_amount, points_awarded, points_used,
  total_price, points_discount_amount, fulfillment_type, drop_point_id,
  customer_marking, drop_point_capacity_used
FROM public.orders
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  total_price = EXCLUDED.total_price,
  payment = EXCLUDED.payment;

-- Add membership_discount_amount column if it doesn't exist in dev.orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'membership_discount_amount' AND table_schema = 'dev'
  ) THEN
    ALTER TABLE dev.orders ADD COLUMN membership_discount_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'membership_level_id' AND table_schema = 'dev'
  ) THEN
    ALTER TABLE dev.orders ADD COLUMN membership_level_id bigint;
  END IF;
END $$;

-- Sync membership tables
TRUNCATE TABLE dev.customer_membership_levels CASCADE;
INSERT INTO dev.customer_membership_levels SELECT * FROM public.customer_membership_levels;

TRUNCATE TABLE dev.membership_benefits CASCADE;
INSERT INTO dev.membership_benefits SELECT * FROM public.membership_benefits;

TRUNCATE TABLE dev.customer_memberships CASCADE;
INSERT INTO dev.customer_memberships SELECT * FROM public.customer_memberships;

TRUNCATE TABLE dev.membership_level_history CASCADE;
INSERT INTO dev.membership_level_history SELECT * FROM public.membership_level_history;

-- =====================================================
-- 4. BACKFILL MEMBERSHIPS BASED ON ACTUAL FINISHED ORDERS
-- =====================================================

-- Clear and recalculate memberships
TRUNCATE TABLE dev.customer_memberships CASCADE;

INSERT INTO dev.customer_memberships (customer_id, membership_level_id, total_transactions, progress_percent)
SELECT
  o.customer_id,
  CASE
    WHEN COUNT(*) >= 10 THEN (SELECT id FROM dev.customer_membership_levels WHERE level_index = 3)
    WHEN COUNT(*) >= 3 THEN (SELECT id FROM dev.customer_membership_levels WHERE level_index = 2)
    ELSE (SELECT id FROM dev.customer_membership_levels WHERE level_index = 1)
  END as membership_level_id,
  COUNT(*) as total_transactions,
  CASE
    WHEN COUNT(*) >= 10 THEN 100
    WHEN COUNT(*) >= 3 THEN LEAST(100, FLOOR(((COUNT(*) - 3)::NUMERIC / 7) * 100))
    ELSE LEAST(100, FLOOR((COUNT(*)::NUMERIC / 3) * 100))
  END as progress_percent
FROM dev.orders o
WHERE o.status = 'finished'
GROUP BY o.customer_id
ON CONFLICT (customer_id) DO UPDATE SET
  membership_level_id = EXCLUDED.membership_level_id,
  total_transactions = EXCLUDED.total_transactions,
  progress_percent = EXCLUDED.progress_percent,
  updated_at = NOW();

-- Create Bronze membership for customers without any finished orders
INSERT INTO dev.customer_memberships (customer_id, membership_level_id, total_transactions, progress_percent)
SELECT
  c.customer_id,
  (SELECT id FROM dev.customer_membership_levels WHERE level_index = 1),
  0,
  0
FROM dev.customers c
WHERE NOT EXISTS (
  SELECT 1 FROM dev.customer_memberships cm WHERE cm.customer_id = c.customer_id
);

-- Sync back to public
TRUNCATE TABLE public.customer_memberships CASCADE;
INSERT INTO public.customer_memberships SELECT * FROM dev.customer_memberships;

-- =====================================================
-- 5. ENSURE TRIGGER EXISTS FOR AUTO MEMBERSHIP UPDATE
-- =====================================================

-- Recreate the function to be sure
CREATE OR REPLACE FUNCTION dev.create_or_update_customer_membership()
RETURNS TRIGGER AS $$
DECLARE
  v_current_level_id BIGINT;
  v_new_level_id BIGINT;
  v_total_transactions INTEGER;
  v_silver_threshold INTEGER;
  v_gold_threshold INTEGER;
  v_level_id_for_bronze BIGINT;
  v_level_id_for_silver BIGINT;
  v_level_id_for_gold BIGINT;
BEGIN
  -- Only proceed for finished orders
  IF NEW.status <> 'finished' OR OLD.status = 'finished' THEN
    RETURN NEW;
  END IF;

  -- Get the IDs for levels
  SELECT id INTO v_level_id_for_bronze FROM dev.customer_membership_levels WHERE level_index = 1;
  SELECT id INTO v_level_id_for_silver FROM dev.customer_membership_levels WHERE level_index = 2;
  SELECT id INTO v_level_id_for_gold FROM dev.customer_membership_levels WHERE level_index = 3;

  -- Get thresholds (use COALESCE to handle NULL values)
  SELECT COALESCE(MAX(transaction_threshold), 3)
    INTO v_silver_threshold
    FROM dev.customer_membership_levels
    WHERE level_index = 2;

  SELECT COALESCE(MAX(transaction_threshold), 10)
    INTO v_gold_threshold
    FROM dev.customer_membership_levels
    WHERE level_index = 3;

  -- Count total finished transactions for this customer
  SELECT COUNT(*) INTO v_total_transactions
  FROM dev.orders
  WHERE customer_id = NEW.customer_id AND status = 'finished';

  -- Calculate new membership level
  IF v_total_transactions >= v_gold_threshold THEN
    v_new_level_id := v_level_id_for_gold;
  ELSIF v_total_transactions >= v_silver_threshold THEN
    v_new_level_id := v_level_id_for_silver;
  ELSE
    v_new_level_id := v_level_id_for_bronze;
  END IF;

  -- Check if customer already has a membership record
  SELECT membership_level_id INTO v_current_level_id
  FROM dev.customer_memberships
  WHERE customer_id = NEW.customer_id;

  IF v_current_level_id IS NULL THEN
    -- Create new membership record
    INSERT INTO dev.customer_memberships (customer_id, membership_level_id, total_transactions, progress_percent)
    VALUES (NEW.customer_id, v_new_level_id, v_total_transactions, 0);
  ELSE
    -- Update existing membership if level changed
    IF v_current_level_id != v_new_level_id THEN
      -- Record in history
      INSERT INTO dev.membership_level_history (customer_id, from_level_id, to_level_id, trigger_reason)
      VALUES (NEW.customer_id, v_current_level_id, v_new_level_id, 'transaction_count');

      -- Update membership
      UPDATE dev.customer_memberships
      SET membership_level_id = v_new_level_id,
          total_transactions = v_total_transactions,
          updated_at = NOW()
      WHERE customer_id = NEW.customer_id;
    ELSE
      -- Just update transaction count
      UPDATE dev.customer_memberships
      SET total_transactions = v_total_transactions,
          updated_at = NOW()
      WHERE customer_id = NEW.customer_id;
    END IF;
  END IF;

  -- Also sync to public schema
  INSERT INTO public.customer_memberships (customer_id, membership_level_id, total_transactions, progress_percent, created_at, updated_at)
  VALUES (NEW.customer_id, v_new_level_id, v_total_transactions, 0, NOW(), NOW())
  ON CONFLICT (customer_id) DO UPDATE SET
    membership_level_id = EXCLUDED.membership_level_id,
    total_transactions = EXCLUDED.total_transactions,
    progress_percent = EXCLUDED.progress_percent,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_membership_on_order_completion ON dev.orders;
CREATE TRIGGER update_membership_on_order_completion
  AFTER UPDATE ON dev.orders
  FOR EACH ROW
  WHEN (NEW.status = 'finished' AND (OLD.status IS NULL OR OLD.status != 'finished'))
  EXECUTE FUNCTION dev.create_or_update_customer_membership();

-- =====================================================
-- 6. VERIFICATION
-- =====================================================

-- Check customer sync
SELECT
  'Customers in public:' as info,
  COUNT(*) as count
FROM public.customers
UNION ALL
SELECT
  'Customers in dev:',
  COUNT(*)
FROM dev.customers;

-- Check order sync
SELECT
  'Orders in public:' as info,
  COUNT(*) as count
FROM public.orders
UNION ALL
SELECT
  'Orders in dev:',
  COUNT(*)
FROM dev.orders;

-- Check membership status
SELECT
  cm.customer_id,
  c.username,
  c.whatsapp,
  ml.name AS membership_level,
  cm.total_transactions,
  ml.discount_percent,
  ml.discount_max_amount
FROM dev.customer_memberships cm
JOIN dev.customer_membership_levels ml ON cm.membership_level_id = ml.id
LEFT JOIN dev.customers c ON cm.customer_id = c.customer_id
ORDER BY cm.total_transactions DESC;
