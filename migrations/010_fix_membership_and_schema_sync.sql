-- Migration: Fix Membership and Schema Sync
-- Description: Properly set up dev schema with foreign keys and sync data from public

-- =====================================================
-- 1. ADD MEMBERSHIP FIELDS TO ORDERS TABLE
-- =====================================================

-- Add to public.orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'membership_discount_amount' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN membership_discount_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'membership_level_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN membership_level_id bigint;
  END IF;
END $$;

-- =====================================================
-- 2. SYNC ORDERS TABLE TO DEV SCHEMA
-- =====================================================

-- Drop dev.orders if it exists and recreate from public
DROP TABLE IF EXISTS dev.orders CASCADE;

-- Create dev.orders as a copy of public.orders with proper foreign keys
CREATE TABLE dev.orders AS SELECT * FROM public.orders;

-- Add primary key
ALTER TABLE dev.orders ADD PRIMARY KEY (id);

-- Add unique constraint on invoice_id
ALTER TABLE dev.orders ADD UNIQUE (invoice_id);

-- Recreate foreign key to dev.customers
ALTER TABLE dev.orders
  ADD CONSTRAINT orders_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES dev.customers(customer_id);

-- =====================================================
-- 3. SYNC OTHER TABLES TO DEV SCHEMA
-- =====================================================

-- Copy customers table
DROP TABLE IF EXISTS dev.customers CASCADE;
CREATE TABLE dev.customers AS SELECT * FROM public.customers;
ALTER TABLE dev.customers ADD PRIMARY KEY (id);
ALTER TABLE dev.customers ADD UNIQUE (customer_id);
ALTER TABLE dev.customers ADD UNIQUE (whatsapp);

-- Copy order_item table
DROP TABLE IF EXISTS dev.order_item CASCADE;
CREATE TABLE dev.order_item AS SELECT * FROM public.order_item;
ALTER TABLE dev.order_item ADD PRIMARY KEY (id);

-- Add foreign key to dev.orders
ALTER TABLE dev.order_item
  ADD CONSTRAINT order_item_invoice_id_fkey
  FOREIGN KEY (invoice_id) REFERENCES dev.orders(invoice_id);

-- Copy order_discounts table if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_discounts' AND table_schema = 'public') THEN
    DROP TABLE IF EXISTS dev.order_discounts CASCADE;
    CREATE TABLE dev.order_discounts AS SELECT * FROM public.order_discounts;
    ALTER TABLE dev.order_discounts ADD PRIMARY KEY (id);
  END IF;
END $$;

-- =====================================================
-- 4. CREATE MEMBERSHIP TABLES IN DEV SCHEMA
-- =====================================================

-- Copy customer_membership_levels to dev
DROP TABLE IF EXISTS dev.customer_membership_levels CASCADE;
CREATE TABLE dev.customer_membership_levels AS SELECT * FROM public.customer_membership_levels;
ALTER TABLE dev.customer_membership_levels ADD PRIMARY KEY (id);

-- Copy membership_benefits to dev
DROP TABLE IF EXISTS dev.membership_benefits CASCADE;
CREATE TABLE dev.membership_benefits AS SELECT * FROM public.membership_benefits;
ALTER TABLE dev.membership_benefits ADD PRIMARY KEY (id);

-- Add foreign key
ALTER TABLE dev.membership_benefits
  ADD CONSTRAINT membership_benefits_membership_level_id_fkey
  FOREIGN KEY (membership_level_id) REFERENCES dev.customer_membership_levels(id);

-- Copy customer_memberships to dev
DROP TABLE IF EXISTS dev.customer_memberships CASCADE;
CREATE TABLE dev.customer_memberships AS SELECT * FROM public.customer_memberships;
ALTER TABLE dev.customer_memberships ADD PRIMARY KEY (id);
ALTER TABLE dev.customer_memberships ADD UNIQUE (customer_id);

-- Add foreign keys
ALTER TABLE dev.customer_memberships
  ADD CONSTRAINT customer_memberships_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES dev.customers(customer_id);

ALTER TABLE dev.customer_memberships
  ADD CONSTRAINT customer_memberships_membership_level_id_fkey
  FOREIGN KEY (membership_level_id) REFERENCES dev.customer_membership_levels(id);

-- Copy membership_level_history to dev
DROP TABLE IF EXISTS dev.membership_level_history CASCADE;
CREATE TABLE dev.membership_level_history AS SELECT * FROM public.membership_level_history;
ALTER TABLE dev.membership_level_history ADD PRIMARY KEY (id);

-- Add foreign keys
ALTER TABLE dev.membership_level_history
  ADD CONSTRAINT membership_level_history_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES dev.customers(customer_id);

ALTER TABLE dev.membership_level_history
  ADD CONSTRAINT membership_level_history_from_level_id_fkey
  FOREIGN KEY (from_level_id) REFERENCES dev.customer_membership_levels(id);

ALTER TABLE dev.membership_level_history
  ADD CONSTRAINT membership_level_history_to_level_id_fkey
  FOREIGN KEY (to_level_id) REFERENCES dev.customer_membership_levels(id);

-- =====================================================
-- 5. CREATE INDEXES IN DEV SCHEMA
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_dev_customer_membership_levels_level_index ON dev.customer_membership_levels(level_index);
CREATE INDEX IF NOT EXISTS idx_dev_customer_membership_levels_is_active ON dev.customer_membership_levels(is_active);
CREATE INDEX IF NOT EXISTS idx_dev_membership_benefits_membership_level_id ON dev.membership_benefits(membership_level_id);
CREATE INDEX IF NOT EXISTS idx_dev_membership_benefits_display_order ON dev.membership_benefits(display_order);
CREATE INDEX IF NOT EXISTS idx_dev_customer_memberships_customer_id ON dev.customer_memberships(customer_id);
CREATE INDEX IF NOT EXISTS idx_dev_customer_memberships_membership_level_id ON dev.customer_memberships(membership_level_id);
CREATE INDEX IF NOT EXISTS idx_dev_membership_level_history_customer_id ON dev.membership_level_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_dev_membership_level_history_changed_at ON dev.membership_level_history(changed_at);

-- =====================================================
-- 6. ENABLE RLS ON DEV TABLES
-- =====================================================

ALTER TABLE dev.customer_membership_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.membership_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.customer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.membership_level_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all access for users" ON dev.customers;
DROP POLICY IF EXISTS "Enable all access for users" ON dev.orders;
DROP POLICY IF EXISTS "Allow public read access to membership levels" ON dev.customer_membership_levels;
DROP POLICY IF EXISTS "Allow authenticated users to manage membership levels" ON dev.customer_membership_levels;
DROP POLICY IF EXISTS "Allow public read access to membership benefits" ON dev.membership_benefits;
DROP POLICY IF EXISTS "Allow authenticated users to manage membership benefits" ON dev.membership_benefits;
DROP POLICY IF EXISTS "Allow customers to read own membership" ON dev.customer_memberships;
DROP POLICY IF EXISTS "Allow authenticated users to manage customer memberships" ON dev.customer_memberships;
DROP POLICY IF EXISTS "Allow customers to read own membership history" ON dev.membership_level_history;
DROP POLICY IF EXISTS "Allow authenticated users to manage membership history" ON dev.membership_level_history;

-- Create new policies
CREATE POLICY "Enable all access for users" ON dev.customers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for users" ON dev.orders FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access to membership levels" ON dev.customer_membership_levels FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated users to manage membership levels" ON dev.customer_membership_levels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access to membership benefits" ON dev.membership_benefits FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated users to manage membership benefits" ON dev.membership_benefits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow customers to read own membership" ON dev.customer_memberships FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated users to manage customer memberships" ON dev.customer_memberships FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow customers to read own membership history" ON dev.membership_level_history FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated users to manage membership history" ON dev.membership_level_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- 7. CREATE OR REPLACE TRIGGER FUNCTION FOR AUTO-UPDATE
-- =====================================================

DROP FUNCTION IF EXISTS dev.create_or_update_customer_membership();

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

  -- Get the IDs for levels
  SELECT id INTO v_level_id_for_bronze FROM dev.customer_membership_levels WHERE level_index = 1;
  SELECT id INTO v_level_id_for_silver FROM dev.customer_membership_levels WHERE level_index = 2;
  SELECT id INTO v_level_id_for_gold FROM dev.customer_membership_levels WHERE level_index = 3;

  -- Get thresholds
  SELECT COALESCE(transaction_threshold, 3)
    INTO v_silver_threshold
    FROM dev.customer_membership_levels
    WHERE level_index = 2;

  SELECT COALESCE(transaction_threshold, 10)
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger
DROP TRIGGER IF EXISTS update_membership_on_order_completion ON dev.orders;

-- Create trigger
CREATE TRIGGER update_membership_on_order_completion
  AFTER INSERT OR UPDATE ON dev.orders
  FOR EACH ROW
  WHEN (NEW.status = 'finished')
  EXECUTE FUNCTION dev.create_or_update_customer_membership();

-- Also enable trigger on public schema
DROP FUNCTION IF EXISTS public.create_or_update_customer_membership();
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
  -- Only proceed for finished orders
  IF NEW.status <> 'finished' THEN
    RETURN NEW;
  END IF;

  -- Get the IDs for levels
  SELECT id INTO v_level_id_for_bronze FROM public.customer_membership_levels WHERE level_index = 1;
  SELECT id INTO v_level_id_for_silver FROM public.customer_membership_levels WHERE level_index = 2;
  SELECT id INTO v_level_id_for_gold FROM public.customer_membership_levels WHERE level_index = 3;

  -- Get thresholds
  SELECT COALESCE(transaction_threshold, 3)
    INTO v_silver_threshold
    FROM public.customer_membership_levels
    WHERE level_index = 2;

  SELECT COALESCE(transaction_threshold, 10)
    INTO v_gold_threshold
    FROM public.customer_membership_levels
    WHERE level_index = 3;

  -- Count total finished transactions
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
    INSERT INTO public.customer_memberships (customer_id, membership_level_id, total_transactions, progress_percent)
    VALUES (NEW.customer_id, v_new_level_id, v_total_transactions, 0);
  ELSE
    IF v_current_level_id != v_new_level_id THEN
      INSERT INTO public.membership_level_history (customer_id, from_level_id, to_level_id, trigger_reason)
      VALUES (NEW.customer_id, v_current_level_id, v_new_level_id, 'transaction_count');

      UPDATE public.customer_memberships
      SET membership_level_id = v_new_level_id,
          total_transactions = v_total_transactions,
          updated_at = NOW()
      WHERE customer_id = NEW.customer_id;
    ELSE
      UPDATE public.customer_memberships
      SET total_transactions = v_total_transactions,
          updated_at = NOW()
      WHERE customer_id = NEW.customer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_membership_on_order_completion ON public.orders;
CREATE TRIGGER update_membership_on_order_completion
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'finished')
  EXECUTE FUNCTION public.create_or_update_customer_membership();

-- =====================================================
-- 8. BACKFILL CUSTOMER MEMBERSHIPS BASED ON ACTUAL ORDER COUNT
-- =====================================================

-- Clear existing data
TRUNCATE TABLE dev.customer_memberships CASCADE;
TRUNCATE TABLE public.customer_memberships CASCADE;

-- Recalculate membership for all customers based on finished orders
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
GROUP BY o.customer_id
ON CONFLICT (customer_id) DO UPDATE SET
  membership_level_id = EXCLUDED.membership_level_id,
  total_transactions = EXCLUDED.total_transactions,
  progress_percent = EXCLUDED.progress_percent,
  updated_at = NOW();

-- Copy to dev schema
INSERT INTO dev.customer_memberships SELECT * FROM public.customer_memberships;

-- Also create Bronze membership for customers without any finished orders
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

-- Copy new records to dev
INSERT INTO dev.customer_memberships
SELECT * FROM public.customer_memberships
WHERE NOT EXISTS (
  SELECT 1 FROM dev.customer_memberships dm WHERE dm.customer_id = public.customer_memberships.customer_id
);

-- =====================================================
-- 9. VERIFICATION QUERY
-- =====================================================
-- Run this to verify everything is working
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

-- Also verify order counts match
SELECT
  o.customer_id,
  c.username,
  COUNT(*) FILTER (WHERE o.status = 'finished') as finished_orders,
  cm.total_transactions as membership_transactions,
  ml.name AS membership_level
FROM dev.orders o
JOIN dev.customers c ON o.customer_id = c.customer_id
LEFT JOIN dev.customer_memberships cm ON cm.customer_id = o.customer_id
LEFT JOIN dev.customer_membership_levels ml ON cm.membership_level_id = ml.id
GROUP BY o.customer_id, c.username, cm.total_transactions, ml.name
ORDER BY finished_orders DESC;
