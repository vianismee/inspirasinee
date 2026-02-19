-- =====================================================
-- FIX MEMBERSHIP POINTS SYSTEM
-- =====================================================
-- This migration fixes the following bugs:
-- 1. Adds shine_points_discount_amount column to separate from membership_discount_amount
-- 2. Adds foreign key constraint for orders.membership_level_id
-- 3. Enables the membership update trigger

-- =====================================================
-- 1. ADD SHINE POINTS DISCOUNT COLUMN TO ORDERS
-- =====================================================
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shine_points_discount_amount numeric DEFAULT 0;

-- =====================================================
-- 2. ADD FOREIGN KEY CONSTRAINT FOR MEMBERSHIP LEVEL
-- =====================================================
-- First check if constraint exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'orders_membership_level_id_fkey'
    ) THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT orders_membership_level_id_fkey
        FOREIGN KEY (membership_level_id) REFERENCES public.customer_membership_levels(id);
    END IF;
END $$;

-- =====================================================
-- 3. ENABLE MEMBERSHIP UPDATE TRIGGER
-- =====================================================
-- Drop trigger if exists (to avoid errors)
DROP TRIGGER IF EXISTS update_membership_on_order_completion ON public.orders;

-- Create the trigger to automatically update membership progress
CREATE TRIGGER update_membership_on_order_completion
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_or_update_customer_membership();

-- =====================================================
-- 4. FUNCTION TO AWARD SHINE POINTS AFTER TRANSACTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.award_shine_points_after_order()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id TEXT;
  v_subtotal NUMERIC;
  v_membership_level_id BIGINT;
  v_points_multiplier NUMERIC;
  v_shine_points_to_award INTEGER;
  v_current_shine_points INTEGER;
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
  v_subtotal := NEW.subtotal;

  -- Get customer's membership level and points multiplier
  SELECT
    cm.membership_level_id,
    cml.points_multiplier,
    cm.shine_points
  INTO v_membership_level_id, v_points_multiplier, v_current_shine_points
  FROM public.customer_memberships cm
  INNER JOIN public.customer_membership_levels cml ON cm.membership_level_id = cml.id
  WHERE cm.customer_id = v_customer_id;

  -- If no membership record, create one with Bronze level
  IF v_membership_level_id IS NULL THEN
    INSERT INTO public.customer_memberships (customer_id, membership_level_id, shine_points, total_transactions)
    VALUES (v_customer_id, (SELECT id FROM public.customer_membership_levels WHERE level_index = 1), 0, 0)
    RETURNING membership_level_id INTO v_membership_level_id;

    SELECT points_multiplier INTO v_points_multiplier
    FROM public.customer_membership_levels
    WHERE id = v_membership_level_id;

    v_current_shine_points := 0;
  END IF;

  -- Calculate shine points: 1 point per Rp 1.000, multiplied by tier multiplier
  -- Formula: FLOOR(subtotal / 1000 * points_multiplier)
  v_shine_points_to_award := FLOOR(v_subtotal / 1000.0 * v_points_multiplier);

  -- Only award if points > 0
  IF v_shine_points_to_award > 0 THEN
    -- Update customer's shine points balance
    UPDATE public.customer_memberships
    SET shine_points = shine_points + v_shine_points_to_award,
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
      v_shine_points_to_award,
      shine_points,
      'order',
      NEW.invoice_id,
      'Shine points earned from order ' || NEW.invoice_id
    FROM public.customer_memberships
    WHERE customer_id = v_customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for awarding shine points
DROP TRIGGER IF EXISTS award_shine_points_trigger ON public.orders;
CREATE TRIGGER award_shine_points_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.award_shine_points_after_order();

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================
-- Check if the column was added
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('membership_discount_amount', 'shine_points_discount_amount')
ORDER BY column_name;

-- Check if foreign key exists
SELECT
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conname = 'orders_membership_level_id_fkey';

-- Check if triggers are enabled
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('update_membership_on_order_completion', 'award_shine_points_trigger')
  AND event_object_schema = 'public'
  AND event_object_table = 'orders';
