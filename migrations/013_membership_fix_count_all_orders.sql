-- =====================================================
-- MEMBERSHIP FIX - COUNT ALL ORDERS (not just finished)
-- =====================================================
-- This fixes membership to match the order count shown on customer page

-- 1. Add membership discount fields to orders table (if not exists)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS membership_discount_amount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS membership_level_id bigint;

-- 2. Recreate trigger function - NOW COUNTS ALL ORDERS
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
  -- Count ALL orders (not just finished) to match customer page
  SELECT COUNT(*) INTO v_total_transactions
  FROM public.orders
  WHERE customer_id = NEW.customer_id;

  -- Get the IDs for levels
  SELECT id INTO v_level_id_for_bronze FROM public.customer_membership_levels WHERE level_index = 1;
  SELECT id INTO v_level_id_for_silver FROM public.customer_membership_levels WHERE level_index = 2;
  SELECT id INTO v_level_id_for_gold FROM public.customer_membership_levels WHERE level_index = 3;

  -- Get thresholds
  SELECT COALESCE(transaction_threshold, 3) INTO v_silver_threshold FROM public.customer_membership_levels WHERE level_index = 2;
  SELECT COALESCE(transaction_threshold, 10) INTO v_gold_threshold FROM public.customer_membership_levels WHERE level_index = 3;

  -- Calculate new membership level
  IF v_total_transactions >= v_gold_threshold THEN
    v_new_level_id := v_level_id_for_gold;
  ELSIF v_total_transactions >= v_silver_threshold THEN
    v_new_level_id := v_level_id_for_silver;
  ELSE
    v_new_level_id := v_level_id_for_bronze;
  END IF;

  -- Check if customer already has a membership record
  SELECT membership_level_id INTO v_current_level_id FROM public.customer_memberships WHERE customer_id = NEW.customer_id;

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

-- 3. Drop existing trigger
DROP TRIGGER IF EXISTS update_membership_on_order_completion ON public.orders;

-- 4. Create trigger - fires on INSERT of new order
CREATE TRIGGER update_membership_on_order_completion
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_or_update_customer_membership();

-- 5. Backfill memberships - NOW COUNTS ALL ORDERS
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
GROUP BY o.customer_id;

-- Bronze for customers with no orders
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

-- 6. Verification - Shows comparison
SELECT
  cm.customer_id,
  c.username,
  c.whatsapp,
  -- All orders count (what customer page shows)
  (SELECT COUNT(*) FROM public.orders WHERE customer_id = c.customer_id) as all_orders_count,
  -- Membership record
  cm.total_transactions as membership_record_count,
  ml.name AS membership_level,
  ml.discount_percent,
  ml.discount_max_amount,
  -- Match check
  CASE
    WHEN (SELECT COUNT(*) FROM public.orders WHERE customer_id = c.customer_id) = cm.total_transactions
    THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as status
FROM public.customer_memberships cm
JOIN public.customer_membership_levels ml ON cm.membership_level_id = ml.id
LEFT JOIN public.customers c ON cm.customer_id = c.customer_id
ORDER BY cm.total_transactions DESC;
