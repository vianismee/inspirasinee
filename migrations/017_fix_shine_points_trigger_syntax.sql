-- =====================================================
-- MIGRATION: FIX SHINE POINTS TRIGGER SYNTAX ERROR
-- =====================================================
-- Description: Fix syntax error in award_shine_points_after_order function
-- Bug: Missing || concatenation operator in line 136
-- Error: type "v_level_name" does not exist (code: 42704)
-- =====================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS award_shine_points_trigger ON public.orders;
DROP FUNCTION IF EXISTS public.award_shine_points_after_order();

-- Recreate the function with correct syntax
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

-- Recreate the trigger
CREATE TRIGGER award_shine_points_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.award_shine_points_after_order();

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check that the function was created correctly
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'award_shine_points_after_order';

-- Check that the trigger was created correctly
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'award_shine_points_trigger'
  AND event_object_schema = 'public'
  AND event_object_table = 'orders';
