-- Migration: Fix Membership Trigger and Schema Issues
-- Description: Enable auto-update trigger and create tables in dev schema

-- =====================================================
-- 0. ADD MEMBERSHIP DISCOUNT FIELD TO ORDERS TABLE
-- =====================================================

-- Add membership_discount_amount to public.orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'membership_discount_amount' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN membership_discount_amount numeric DEFAULT 0;
  END IF;
END $$;

-- Add membership_level_id to public.orders (to track which level was used)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'membership_level_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN membership_level_id bigint;
  END IF;
END $$;

-- Add membership_discount_amount to dev.orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'membership_discount_amount' AND table_schema = 'dev'
  ) THEN
    ALTER TABLE dev.orders ADD COLUMN membership_discount_amount numeric DEFAULT 0;
  END IF;
END $$;

-- Add membership_level_id to dev.orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'membership_level_id' AND table_schema = 'dev'
  ) THEN
    ALTER TABLE dev.orders ADD COLUMN membership_level_id bigint;
  END IF;
END $$;

-- =====================================================
-- 1. CREATE MEMBERSHIP TABLES IN DEV SCHEMA (for development)
-- =====================================================

-- Check if dev schema exists, if not create it
CREATE SCHEMA IF NOT EXISTS dev;

-- Copy customer_membership_levels to dev schema
-- We use CREATE OR REPLACE to avoid errors if it exists
DROP TABLE IF EXISTS dev.customer_membership_levels CASCADE;
CREATE TABLE dev.customer_membership_levels AS SELECT * FROM public.customer_membership_levels;

-- Copy membership_benefits to dev schema
DROP TABLE IF EXISTS dev.membership_benefits CASCADE;
CREATE TABLE dev.membership_benefits AS SELECT * FROM public.membership_benefits;

-- Copy customer_memberships to dev schema
DROP TABLE IF EXISTS dev.customer_memberships CASCADE;
CREATE TABLE dev.customer_memberships AS SELECT * FROM public.customer_memberships;

-- Copy membership_level_history to dev schema
DROP TABLE IF EXISTS dev.membership_level_history CASCADE;
CREATE TABLE dev.membership_level_history AS SELECT * FROM public.membership_level_history;

-- Recreate indexes on dev tables
CREATE INDEX IF NOT EXISTS idx_dev_customer_membership_levels_level_index ON dev.customer_membership_levels(level_index);
CREATE INDEX IF NOT EXISTS idx_dev_customer_membership_levels_is_active ON dev.customer_membership_levels(is_active);
CREATE INDEX IF NOT EXISTS idx_dev_membership_benefits_membership_level_id ON dev.membership_benefits(membership_level_id);
CREATE INDEX IF NOT EXISTS idx_dev_membership_benefits_display_order ON dev.membership_benefits(display_order);
CREATE INDEX IF NOT EXISTS idx_dev_customer_memberships_customer_id ON dev.customer_memberships(customer_id);
CREATE INDEX IF NOT EXISTS idx_dev_customer_memberships_membership_level_id ON dev.customer_memberships(membership_level_id);
CREATE INDEX IF NOT EXISTS idx_dev_membership_level_history_customer_id ON dev.membership_level_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_dev_membership_level_history_changed_at ON dev.membership_level_history(changed_at);

-- Enable RLS on dev tables
ALTER TABLE dev.customer_membership_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.membership_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.customer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.membership_level_history ENABLE ROW LEVEL SECURITY;

-- Grant permissions (you may need to adjust based on your auth setup)
-- These are the same policies as public schema
DROP POLICY IF EXISTS "Allow public read access to membership levels" ON dev.customer_membership_levels;
CREATE POLICY "Allow public read access to membership levels"
  ON dev.customer_membership_levels
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage membership levels" ON dev.customer_membership_levels;
CREATE POLICY "Allow authenticated users to manage membership levels"
  ON dev.customer_membership_levels
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to membership benefits" ON dev.membership_benefits;
CREATE POLICY "Allow public read access to membership benefits"
  ON dev.membership_benefits
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage membership benefits" ON dev.membership_benefits;
CREATE POLICY "Allow authenticated users to manage membership benefits"
  ON dev.membership_benefits
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow customers to read own membership" ON dev.customer_memberships;
CREATE POLICY "Allow customers to read own membership"
  ON dev.customer_memberships
  FOR SELECT
  TO authenticated
  USING (true); -- Simplified for dev

DROP POLICY IF EXISTS "Allow authenticated users to manage customer memberships" ON dev.customer_memberships;
CREATE POLICY "Allow authenticated users to manage customer memberships"
  ON dev.customer_memberships
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow customers to read own membership history" ON dev.membership_level_history;
CREATE POLICY "Allow customers to read own membership history"
  ON dev.membership_level_history
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage membership history" ON dev.membership_level_history;
CREATE POLICY "Allow authenticated users to manage membership history"
  ON dev.membership_level_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. ENABLE THE TRIGGER FOR AUTOMATIC MEMBERSHIP UPDATES
-- =====================================================

-- First, drop the trigger if it exists (in both schemas)
DROP TRIGGER IF EXISTS update_membership_on_order_completion ON public.orders;
DROP TRIGGER IF EXISTS update_membership_on_order_completion ON dev.orders;

-- Drop the old function and recreate it in both schemas
DROP FUNCTION IF EXISTS public.create_or_update_customer_membership();
DROP FUNCTION IF EXISTS dev.create_or_update_customer_membership();

-- Create the function in PUBLIC schema
CREATE OR REPLACE FUNCTION public.create_or_update_customer_membership()
RETURNS TRIGGER AS $$
DECLARE
  v_current_level_id BIGINT;
  v_new_level_id BIGINT;
  v_total_transactions INTEGER;
  v_bronze_threshold INTEGER;
  v_silver_threshold INTEGER;
  v_gold_threshold INTEGER;
  v_progress INTEGER;
  v_next_level_threshold INTEGER;
  v_level_id_for_silver BIGINT;
  v_level_id_for_gold BIGINT;
BEGIN
  -- Only proceed for finished orders
  IF NEW.status <> 'finished' THEN
    RETURN NEW;
  END IF;

  -- Get thresholds from membership levels
  SELECT
    COALESCE(MAX(CASE WHEN level_index = 1 THEN id END), 0),
    COALESCE(MAX(CASE WHEN level_index = 2 THEN transaction_threshold END), 3),
    COALESCE(MAX(CASE WHEN level_index = 3 THEN transaction_threshold END), 10)
  INTO v_level_id_for_silver, v_silver_threshold, v_gold_threshold
  FROM public.customer_membership_levels;

  -- Get the IDs for levels
  SELECT id INTO v_level_id_for_silver FROM public.customer_membership_levels WHERE level_index = 2;
  SELECT id INTO v_level_id_for_gold FROM public.customer_membership_levels WHERE level_index = 3;

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
    SELECT id INTO v_new_level_id FROM public.customer_membership_levels WHERE level_index = 1;
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

-- Create the function in DEV schema (for development)
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
  IF NEW.status <> 'finished' THEN
    RETURN NEW;
  END IF;

  -- Get thresholds from membership levels
  SELECT
    COALESCE(MAX(CASE WHEN level_index = 1 THEN id END), 0),
    COALESCE(MAX(CASE WHEN level_index = 2 THEN id END), 0),
    COALESCE(MAX(CASE WHEN level_index = 2 THEN transaction_threshold END), 3),
    COALESCE(MAX(CASE WHEN level_index = 3 THEN transaction_threshold END), 10)
  INTO v_level_id_for_bronze, v_level_id_for_silver, v_silver_threshold, v_gold_threshold
  FROM dev.customer_membership_levels;

  -- Get the IDs for levels (fallback query)
  IF v_level_id_for_bronze IS NULL THEN
    SELECT id INTO v_level_id_for_bronze FROM dev.customer_membership_levels WHERE level_index = 1;
  END IF;
  IF v_level_id_for_silver IS NULL THEN
    SELECT id INTO v_level_id_for_silver FROM dev.customer_membership_levels WHERE level_index = 2;
  END IF;
  SELECT id INTO v_level_id_for_gold FROM dev.customer_membership_levels WHERE level_index = 3;

  -- Count total finished transactions for this customer (from dev schema)
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger in PUBLIC schema
CREATE TRIGGER update_membership_on_order_completion
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'finished')
  EXECUTE FUNCTION public.create_or_update_customer_membership();

-- Create trigger in DEV schema
CREATE TRIGGER update_membership_on_order_completion
  AFTER INSERT OR UPDATE ON dev.orders
  FOR EACH ROW
  WHEN (NEW.status = 'finished')
  EXECUTE FUNCTION dev.create_or_update_customer_membership();

-- =====================================================
-- 3. SYNC EXISTING DATA FROM PUBLIC TO DEV
-- =====================================================
-- This ensures dev schema has the latest data
TRUNCATE dev.customer_memberships CASCADE;
INSERT INTO dev.customer_memberships SELECT * FROM public.customer_memberships;

TRUNCATE dev.membership_level_history CASCADE;
INSERT INTO dev.membership_level_history SELECT * FROM public.membership_level_history;

-- =====================================================
-- 4. VERIFICATION QUERY
-- =====================================================
-- Run this to verify the setup
SELECT
  cm.customer_id,
  c.username,
  ml.name AS membership_level,
  cm.total_transactions,
  ml.transaction_threshold AS level_threshold
FROM dev.customer_memberships cm
JOIN dev.customer_membership_levels ml ON cm.membership_level_id = ml.id
LEFT JOIN dev.customers c ON cm.customer_id = c.customer_id
ORDER BY cm.total_transactions DESC;
