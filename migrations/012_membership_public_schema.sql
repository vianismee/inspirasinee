-- =====================================================
-- MEMBERSHIP SETUP - PUBLIC SCHEMA ONLY
-- =====================================================
-- Run this in Supabase SQL Editor to set up membership

-- 1. Add membership discount fields to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS membership_discount_amount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS membership_level_id bigint;

-- 2. Create the trigger function for auto-updating membership
CREATE OR REPLACE FUNCTION public.create_or_update_customer_membership()
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
  -- Only proceed for finished orders (skip if already was finished)
  IF NEW.status <> 'finished' OR (OLD.status IS NOT NULL AND OLD.status = 'finished') THEN
    RETURN NEW;
  END IF;

  -- Get the IDs for levels
  SELECT id INTO v_level_id_for_bronze FROM public.customer_membership_levels WHERE level_index = 1;
  SELECT id INTO v_level_id_for_silver FROM public.customer_membership_levels WHERE level_index = 2;
  SELECT id INTO v_level_id_for_gold FROM public.customer_membership_levels WHERE level_index = 3;

  -- Get thresholds (with defaults)
  SELECT COALESCE(transaction_threshold, 3)
    INTO v_silver_threshold
    FROM public.customer_membership_levels
    WHERE level_index = 2;

  SELECT COALESCE(transaction_threshold, 10)
    INTO v_gold_threshold
    FROM public.customer_membership_levels
    WHERE level_index = 3;

  -- Count total finished transactions for this customer
  SELECT COUNT(*) INTO v_total_transactions
  FROM public.orders
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
  FROM public.customer_memberships
  WHERE customer_id = NEW.customer_id;

  IF v_current_level_id IS NULL THEN
    -- Create new membership record
    INSERT INTO public.customer_memberships (customer_id, membership_level_id, total_transactions, progress_percent)
    VALUES (NEW.customer_id, v_new_level_id, v_total_transactions, 0);
  ELSE
    -- Update existing membership if level changed
    IF v_current_level_id != v_new_level_id THEN
      -- Record in history
      INSERT INTO public.membership_level_history (customer_id, from_level_id, to_level_id, trigger_reason)
      VALUES (NEW.customer_id, v_current_level_id, v_new_level_id, 'transaction_count');

      -- Update membership
      UPDATE public.customer_memberships
      SET membership_level_id = v_new_level_id,
          total_transactions = v_total_transactions,
          updated_at = NOW()
      WHERE customer_id = NEW.customer_id;
    ELSE
      -- Just update transaction count
      UPDATE public.customer_memberships
      SET total_transactions = v_total_transactions,
          updated_at = NOW()
      WHERE customer_id = NEW.customer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_membership_on_order_completion ON public.orders;

-- 4. Create the trigger
CREATE TRIGGER update_membership_on_order_completion
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'finished')
  EXECUTE FUNCTION public.create_or_update_customer_membership();

-- 5. Backfill memberships for all existing customers based on FINISHED orders
TRUNCATE TABLE public.customer_memberships CASCADE;

INSERT INTO public.customer_memberships (customer_id, membership_level_id, total_transactions, progress_percent)
SELECT
  o.customer_id,
  CASE
    WHEN COUNT(*) >= 10 THEN (SELECT id FROM public.customer_membership_levels WHERE level_index = 3)
    WHEN COUNT(*) >= 3 THEN (SELECT id FROM public.customer_membership_levels WHERE level_index = 2)
    ELSE (SELECT id FROM public.customer_membership_levels WHERE level_index = 1)
  END as membership_level_id,
  COUNT(*) as total_transactions,
  CASE
    WHEN COUNT(*) >= 10 THEN 100
    WHEN COUNT(*) >= 3 THEN LEAST(100, FLOOR(((COUNT(*) - 3)::NUMERIC / 7) * 100))
    ELSE LEAST(100, FLOOR((COUNT(*)::NUMERIC / 3) * 100))
  END as progress_percent
FROM public.orders o
WHERE o.status = 'finished'
GROUP BY o.customer_id;

-- Create Bronze membership for customers with no finished orders
INSERT INTO public.customer_memberships (customer_id, membership_level_id, total_transactions, progress_percent)
SELECT
  c.customer_id,
  (SELECT id FROM public.customer_membership_levels WHERE level_index = 1),
  0,
  0
FROM public.customers c
WHERE NOT EXISTS (
  SELECT 1 FROM public.customer_memberships cm WHERE cm.customer_id = c.customer_id
);

-- 6. Verification - Check your customers and their levels
SELECT
  cm.customer_id,
  c.username,
  c.whatsapp,
  ml.name AS membership_level,
  cm.total_transactions AS finished_orders,
  ml.discount_percent,
  ml.discount_max_amount
FROM public.customer_memberships cm
JOIN public.customer_membership_levels ml ON cm.membership_level_id = ml.id
LEFT JOIN public.customers c ON cm.customer_id = c.customer_id
ORDER BY cm.total_transactions DESC;
