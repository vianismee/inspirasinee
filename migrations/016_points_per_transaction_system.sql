-- =====================================================
-- MIGRATION: POINTS PER TRANSACTION SYSTEM
-- =====================================================
-- Description: Change from amount-based points to transaction-based points
--
-- OLD SYSTEM: Points based on transaction amount (subtotal / 1000 * multiplier)
-- NEW SYSTEM: Fixed points per transaction based on membership level
--
-- Bronze: 1 point per transaction
-- Silver: 2 points per transaction
-- Gold: 3 points per transaction
-- =====================================================

-- =====================================================
-- 1. ADD NEW COLUMN FOR POINTS PER TRANSACTION
-- =====================================================
ALTER TABLE public.customer_membership_levels
ADD COLUMN IF NOT EXISTS points_per_transaction INTEGER NOT NULL DEFAULT 1;

-- =====================================================
-- 2. SET DEFAULT VALUES FOR EACH LEVEL
-- =====================================================
UPDATE public.customer_membership_levels
SET points_per_transaction = CASE
  WHEN level_index = 1 THEN 1  -- Bronze: 1 point per transaction
  WHEN level_index = 2 THEN 2  -- Silver: 2 points per transaction
  WHEN level_index = 3 THEN 3  -- Gold: 3 points per transaction
  ELSE 1  -- Default fallback
END;

-- =====================================================
-- 3. (OPTIONAL) MIGRATE EXISTING DATA FROM OLD SYSTEM
-- =====================================================
-- This section is commented out - keeping for reference if needed
-- Uncomment and run ONLY if you want to migrate existing balances
/*
-- Calculate what the balances would be under new system for reference
DO $$
DECLARE
  v_total_transactions INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- For each customer membership, show the old vs new calculation
  FOR rec IN SELECT customer_id, membership_level_id, total_transactions, shine_points
              FROM public.customer_memberships
  LOOP
    -- New balance: total_transactions * points_per_transaction
    SELECT total_transactions * points_per_transaction INTO v_new_balance
    FROM public.customer_membership_levels
    WHERE id = rec.membership_level_id;

    RAISE NOTICE 'Customer % (Level %): Old balance = %, New calculated balance = %',
      rec.customer_id, rec.membership_level_id, rec.shine_points, v_new_balance;
  END LOOP;
END $$;
*/

-- =====================================================
-- 4. UPDATE THE AWARD FUNCTION TO USE NEW SYSTEM
-- =====================================================
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS award_shine_points_trigger ON public.orders;
DROP FUNCTION IF EXISTS public.award_shine_points_after_order();

-- Create new function with transaction-based points
CREATE OR REPLACE FUNCTION public.award_shine_points_after_order()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id TEXT;
  v_membership_level_id BIGINT;
  v_points_per_transaction INTEGER;
  v_current_shine_points INTEGER;
  v_level_name TEXT;
BEGIN
  -- Only proceed for NEW orders that are NOT 'pending' or 'cancelled'
  IF NEW.status IN ('pending', 'cancelled') THEN
    RETURN NEW;
  END IF;

  -- Don't award points twice on UPDATE
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT NULL AND OLD.status NOT IN ('pending', 'cancelled') THEN
    RETURN NEW;
  END IF;

  v_customer_id := NEW.customer_id;

  -- Get customer's membership level and points per transaction
  SELECT
    cm.membership_level_id,
    cml.points_per_transaction,
    cm.shine_points,
    cml.name
  INTO v_membership_level_id, v_points_per_transaction, v_current_shine_points, v_level_name
  FROM public.customer_memberships cm
  INNER JOIN public.customer_membership_levels cml ON cm.membership_level_id = cml.id
  WHERE cm.customer_id = v_customer_id;

  -- If no membership record, create one with Bronze level
  IF v_membership_level_id IS NULL THEN
    INSERT INTO public.customer_memberships (customer_id, membership_level_id, shine_points, total_transactions)
    VALUES (v_customer_id, (SELECT id FROM public.customer_membership_levels WHERE level_index = 1), 0, 0)
    RETURNING membership_level_id INTO v_membership_level_id;

    SELECT points_per_transaction, name INTO v_points_per_transaction, v_level_name
    FROM public.customer_membership_levels
    WHERE id = v_membership_level_id;

    v_current_shine_points := 0;
  END IF;

  -- Award points per transaction (fixed amount based on membership level)
  IF v_points_per_transaction > 0 THEN
    -- Update customer's shine points balance
    UPDATE public.customer_memberships
    SET shine_points = shine_points + v_points_per_transaction,
        updated_at = NOW()
    WHERE customer_id = v_customer_id;

    -- Record the transaction in points_transactions
    INSERT INTO public.points_transactions (
      customer_id,
      transaction_type,
      points_change,
      balance_after,
      reference_type,
      reference_id,
      description
    )
    SELECT
      v_customer_id,
      'shine_points_earned',
      v_points_per_transaction,
      shine_points,
      'order',
      NEW.invoice_id,
      'Shine points earned from order ' || NEW.invoice_id || ' (' || v_level_name || ' member: ' || v_points_per_transaction || ' point per transaction)'
    FROM public.customer_memberships
    WHERE customer_id = v_customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for awarding shine points
CREATE TRIGGER award_shine_points_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.award_shine_points_after_order();

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================
-- Check the new column
SELECT
  name,
  level_index,
  points_per_transaction,
  points_multiplier, -- Old column, can be dropped later
  discount_percent,
  discount_max_amount,
  is_active
FROM public.customer_membership_levels
ORDER BY level_index;

-- Check if trigger is created correctly
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'award_shine_points_trigger'
  AND event_object_schema = 'public'
  AND event_object_table = 'orders';

-- =====================================================
-- NOTES FOR ADMIN
-- =====================================================
-- After migration, you can optionally drop the old points_multiplier column:
-- ALTER TABLE public.customer_membership_levels DROP COLUMN points_multiplier;
--
-- Benefits display should be updated to say:
-- "Earn X point(s) for every transaction"
-- instead of "Earn 1 point for every Rp 1.000 spent"
