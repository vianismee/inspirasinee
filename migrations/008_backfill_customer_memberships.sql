-- Migration: Backfill Customer Memberships from Transaction History
-- Description: Populate customer_memberships table based on existing order history
-- Run this once to calculate membership levels for all existing customers

-- =====================================================
-- 1. CREATE OR REPLACE FUNCTION TO BACKFILL MEMBERSHIPS
-- =====================================================
CREATE OR REPLACE FUNCTION public.backfill_customer_memberships()
RETURNS VOID AS $$
DECLARE
  customer_record RECORD;
  v_total_transactions INTEGER;
  v_level_id BIGINT;
  v_progress_percent INTEGER;
  v_current_level_id BIGINT;
  v_next_level_threshold INTEGER;
  v_bronze_threshold INTEGER := 0;
  v_silver_threshold INTEGER := 3;
  v_gold_threshold INTEGER := 10;
BEGIN
  -- Get thresholds from database (in case they've been customized)
  SELECT
    COALESCE(MAX(CASE WHEN level_index = 1 THEN transaction_threshold END), 0),
    COALESCE(MAX(CASE WHEN level_index = 2 THEN transaction_threshold END), 3),
    COALESCE(MAX(CASE WHEN level_index = 3 THEN transaction_threshold END), 10)
  INTO v_bronze_threshold, v_silver_threshold, v_gold_threshold
  FROM public.customer_membership_levels;

  -- Loop through all customers who have orders
  FOR customer_record IN
    SELECT DISTINCT customer_id
    FROM public.orders
    WHERE status = 'finished'
  LOOP
    -- Count total finished transactions for this customer
    SELECT COUNT(*) INTO v_total_transactions
    FROM public.orders
    WHERE customer_id = customer_record.customer_id AND status = 'finished';

    -- Determine membership level based on transaction count
    IF v_total_transactions >= v_gold_threshold THEN
      -- Gold level
      SELECT id INTO v_level_id FROM public.customer_membership_levels WHERE level_index = 3;
      v_progress_percent := 100; -- Max level
    ELSIF v_total_transactions >= v_silver_threshold THEN
      -- Silver level
      SELECT id INTO v_level_id FROM public.customer_membership_levels WHERE level_index = 2;
      -- Calculate progress to Gold
      v_progress_percent := LEAST(
        100,
        FLOOR(((v_total_transactions - v_silver_threshold)::NUMERIC / (v_gold_threshold - v_silver_threshold)::NUMERIC) * 100)
      );
    ELSE
      -- Bronze level (default)
      SELECT id INTO v_level_id FROM public.customer_membership_levels WHERE level_index = 1;
      -- Calculate progress to Silver
      IF v_silver_threshold > 0 THEN
        v_progress_percent := LEAST(
          100,
          FLOOR((v_total_transactions::NUMERIC / v_silver_threshold::NUMERIC) * 100)
        );
      ELSE
        v_progress_percent := 0;
      END IF;
    END IF;

    -- Check if customer already has a membership record
    SELECT membership_level_id INTO v_current_level_id
    FROM public.customer_memberships
    WHERE customer_id = customer_record.customer_id;

    IF v_current_level_id IS NULL THEN
      -- Insert new membership record
      INSERT INTO public.customer_memberships (
        customer_id,
        membership_level_id,
        total_transactions,
        progress_percent
      ) VALUES (
        customer_record.customer_id,
        v_level_id,
        v_total_transactions,
        v_progress_percent
      );

      RAISE NOTICE 'Created membership for customer %: Level %, Transactions: %, Progress: %',
        customer_record.customer_id, v_level_id, v_total_transactions, v_progress_percent;
    ELSE
      -- Update existing membership if different
      IF v_current_level_id != v_level_id THEN
        -- Record in history before updating
        INSERT INTO public.membership_level_history (customer_id, from_level_id, to_level_id, trigger_reason)
        VALUES (customer_record.customer_id, v_current_level_id, v_level_id, 'backfill');

        -- Update membership
        UPDATE public.customer_memberships
        SET
          membership_level_id = v_level_id,
          total_transactions = v_total_transactions,
          progress_percent = v_progress_percent,
          updated_at = NOW()
        WHERE customer_id = customer_record.customer_id;

        RAISE NOTICE 'Updated membership for customer %: Level % -> %, Transactions: %, Progress: %',
          customer_record.customer_id, v_current_level_id, v_level_id, v_total_transactions, v_progress_percent;
      ELSE
        -- Just update transaction count and progress
        UPDATE public.customer_memberships
        SET
          total_transactions = v_total_transactions,
          progress_percent = v_progress_percent,
          updated_at = NOW()
        WHERE customer_id = customer_record.customer_id;

        RAISE NOTICE 'Updated counts for customer %: Transactions: %, Progress: %',
          customer_record.customer_id, v_total_transactions, v_progress_percent;
      END IF;
    END IF;
  END LOOP;

  -- Create Bronze membership for customers without any finished orders
  FOR customer_record IN
    SELECT c.customer_id
    FROM public.customers c
    WHERE NOT EXISTS (
      SELECT 1 FROM public.customer_memberships cm WHERE cm.customer_id = c.customer_id
    )
  LOOP
    INSERT INTO public.customer_memberships (
      customer_id,
      membership_level_id,
      total_transactions,
      progress_percent
    ) VALUES (
      customer_record.customer_id,
      (SELECT id FROM public.customer_membership_levels WHERE level_index = 1),
      0,
      0
    );

    RAISE NOTICE 'Created Bronze membership for new customer %', customer_record.customer_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. RUN THE BACKFILL
-- =====================================================
SELECT public.backfill_customer_memberships();

-- =====================================================
-- 3. VERIFY RESULTS
-- =====================================================
-- Show summary of membership levels after backfill
SELECT
  ml.name AS membership_level,
  COUNT(cm.customer_id) AS customer_count,
  AVG(cm.total_transactions) AS avg_transactions
FROM public.customer_memberships cm
JOIN public.customer_membership_levels ml ON cm.membership_level_id = ml.id
GROUP BY ml.name, ml.level_index
ORDER BY ml.level_index;

-- =====================================================
-- 4. OPTIONAL: CLEAN UP FUNCTION AFTER USE
-- =====================================================
-- DROP FUNCTION IF EXISTS public.backfill_customer_memberships();
