-- Migration: Membership Program Tables
-- Description: Creates tables for customer membership tiers (Bronze/Silver/Gold), benefits, and tracking

-- =====================================================
-- 1. CUSTOMER MEMBERSHIP LEVELS TABLE
-- =====================================================
-- Stores configuration for each membership tier (Bronze, Silver, Gold)
CREATE TABLE IF NOT EXISTS public.customer_membership_levels (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  name TEXT NOT NULL UNIQUE, -- Bronze, Silver, Gold
  level_index INTEGER NOT NULL UNIQUE, -- 1 for Bronze, 2 for Silver, 3 for Gold
  points_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.0, -- e.g., 1.5 for 1.5x points
  discount_percent INTEGER NOT NULL DEFAULT 0, -- e.g., 10 for 10% discount
  discount_max_amount INTEGER NOT NULL DEFAULT 0, -- Max discount in Rupiah (cap)
  transaction_threshold INTEGER NOT NULL DEFAULT 0, -- Transactions needed to reach this level
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT customer_membership_levels_pkey PRIMARY KEY (id),
  CONSTRAINT customer_membership_levels_level_index_positive CHECK (level_index > 0),
  CONSTRAINT customer_membership_levels_points_multiplier_positive CHECK (points_multiplier > 0),
  CONSTRAINT customer_membership_levels_discount_percent_valid CHECK (discount_percent >= 0 AND discount_percent <= 100),
  CONSTRAINT customer_membership_levels_discount_max_amount_valid CHECK (discount_max_amount >= 0)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_customer_membership_levels_level_index ON public.customer_membership_levels(level_index);
CREATE INDEX IF NOT EXISTS idx_customer_membership_levels_is_active ON public.customer_membership_levels(is_active);

-- Enable Row Level Security
ALTER TABLE public.customer_membership_levels ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for all users (public membership info)
CREATE POLICY "Allow public read access to membership levels"
  ON public.customer_membership_levels
  FOR SELECT
  TO public
  USING (true);

-- Create policy to allow all operations for authenticated users (admin)
CREATE POLICY "Allow authenticated users to manage membership levels"
  ON public.customer_membership_levels
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. MEMBERSHIP BENEFITS TABLE
-- =====================================================
-- Stores benefit details for each membership level (CMS content)
CREATE TABLE IF NOT EXISTS public.membership_benefits (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  membership_level_id BIGINT NOT NULL,
  icon_name TEXT NOT NULL, -- Lucide icon name: Flame, Percent, Sparkles, Cake, Gift, Crown
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT membership_benefits_pkey PRIMARY KEY (id),
  CONSTRAINT membership_benefits_membership_level_id_fkey FOREIGN KEY (membership_level_id) REFERENCES public.customer_membership_levels(id) ON DELETE CASCADE,
  CONSTRAINT membership_benefits_display_order_valid CHECK (display_order >= 0)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_membership_benefits_membership_level_id ON public.membership_benefits(membership_level_id);
CREATE INDEX IF NOT EXISTS idx_membership_benefits_display_order ON public.membership_benefits(display_order);

-- Enable Row Level Security
ALTER TABLE public.membership_benefits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for all users (public benefits info)
CREATE POLICY "Allow public read access to membership benefits"
  ON public.membership_benefits
  FOR SELECT
  TO public
  USING (true);

-- Create policy to allow all operations for authenticated users (admin)
CREATE POLICY "Allow authenticated users to manage membership benefits"
  ON public.membership_benefits
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. CUSTOMER MEMBERSHIPS TABLE
-- =====================================================
-- Tracks each customer's current membership status
CREATE TABLE IF NOT EXISTS public.customer_memberships (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id TEXT NOT NULL,
  membership_level_id BIGINT NOT NULL,
  progress_percent INTEGER NOT NULL DEFAULT 0, -- 0-100 progress to next level
  total_transactions INTEGER NOT NULL DEFAULT 0, -- Total finished transactions
  shine_points INTEGER NOT NULL DEFAULT 0, -- Current shine points balance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT customer_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT customer_memberships_customer_id_unique UNIQUE (customer_id),
  CONSTRAINT customer_memberships_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE,
  CONSTRAINT customer_memberships_membership_level_id_fkey FOREIGN KEY (membership_level_id) REFERENCES public.customer_membership_levels(id),
  CONSTRAINT customer_memberships_progress_percent_valid CHECK (progress_percent >= 0 AND progress_percent <= 100),
  CONSTRAINT customer_memberships_total_transactions_valid CHECK (total_transactions >= 0),
  CONSTRAINT customer_memberships_shine_points_valid CHECK (shine_points >= 0)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_customer_memberships_customer_id ON public.customer_memberships(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_membership_level_id ON public.customer_memberships(membership_level_id);

-- Enable Row Level Security
ALTER TABLE public.customer_memberships ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for authenticated customers (their own data)
CREATE POLICY "Allow customers to read own membership"
  ON public.customer_memberships
  FOR SELECT
  TO authenticated
  USING (customer_id IN (SELECT customer_id FROM public.customers WHERE customer_id = auth.uid()::text));

-- Create policy to allow all operations for authenticated users (admin)
CREATE POLICY "Allow authenticated users to manage customer memberships"
  ON public.customer_memberships
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. MEMBERSHIP LEVEL HISTORY TABLE
-- =====================================================
-- Audit trail for membership level changes
CREATE TABLE IF NOT EXISTS public.membership_level_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  from_level_id BIGINT,
  to_level_id BIGINT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trigger_reason TEXT, -- e.g., "transaction_count", "admin_override"
  CONSTRAINT membership_level_history_pkey PRIMARY KEY (id),
  CONSTRAINT membership_level_history_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE,
  CONSTRAINT membership_level_history_from_level_id_fkey FOREIGN KEY (from_level_id) REFERENCES public.customer_membership_levels(id),
  CONSTRAINT membership_level_history_to_level_id_fkey FOREIGN KEY (to_level_id) REFERENCES public.customer_membership_levels(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_membership_level_history_customer_id ON public.membership_level_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_membership_level_history_changed_at ON public.membership_level_history(changed_at);

-- Enable Row Level Security
ALTER TABLE public.membership_level_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for authenticated customers (their own data)
CREATE POLICY "Allow customers to read own membership history"
  ON public.membership_level_history
  FOR SELECT
  TO authenticated
  USING (customer_id IN (SELECT customer_id FROM public.customers WHERE customer_id = auth.uid()::text));

-- Create policy to allow all operations for authenticated users (admin)
CREATE POLICY "Allow authenticated users to manage membership history"
  ON public.membership_level_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. INSERT DEFAULT MEMBERSHIP LEVELS
-- =====================================================
-- Bronze Level (Starting level - 0 transactions)
INSERT INTO public.customer_membership_levels (name, level_index, points_multiplier, discount_percent, discount_max_amount, transaction_threshold)
VALUES ('Bronze', 1, 1.0, 0, 0, 0)
ON CONFLICT (name) DO NOTHING;

-- Silver Level (3 transactions needed)
INSERT INTO public.customer_membership_levels (name, level_index, points_multiplier, discount_percent, discount_max_amount, transaction_threshold)
VALUES ('Silver', 2, 1.2, 5, 5000, 3)
ON CONFLICT (name) DO NOTHING;

-- Gold Level (10 transactions needed)
INSERT INTO public.customer_membership_levels (name, level_index, points_multiplier, discount_percent, discount_max_amount, transaction_threshold)
VALUES ('Gold', 3, 1.5, 10, 10000, 10)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 6. INSERT DEFAULT BENEFITS
-- =====================================================
-- Bronze Benefits
INSERT INTO public.membership_benefits (membership_level_id, icon_name, title, description, display_order)
SELECT
  id,
  'Flame',
  'Earn Points',
  'Earn 1 point for every Rp 1.000 spent',
  1
FROM public.customer_membership_levels WHERE name = 'Bronze'
ON CONFLICT DO NOTHING;

INSERT INTO public.membership_benefits (membership_level_id, icon_name, title, description, display_order)
SELECT
  id,
  'Gift',
  'Birthday Reward',
  'Special birthday surprise every year',
  2
FROM public.customer_membership_levels WHERE name = 'Bronze'
ON CONFLICT DO NOTHING;

-- Silver Benefits
INSERT INTO public.membership_benefits (membership_level_id, icon_name, title, description, display_order)
SELECT
  id,
  'Percent',
  '5% Discount',
  'Get 5% off on every service (max Rp 5.000)',
  1
FROM public.customer_membership_levels WHERE name = 'Silver'
ON CONFLICT DO NOTHING;

INSERT INTO public.membership_benefits (membership_level_id, icon_name, title, description, display_order)
SELECT
  id,
  'Flame',
  'Bonus Points',
  'Earn 1.2x points on every transaction',
  2
FROM public.customer_membership_levels WHERE name = 'Silver'
ON CONFLICT DO NOTHING;

INSERT INTO public.membership_benefits (membership_level_id, icon_name, title, description, display_order)
SELECT
  id,
  'Cake',
  'Birthday Bonus',
  'Extra points on your birthday month',
  3
FROM public.customer_membership_levels WHERE name = 'Silver'
ON CONFLICT DO NOTHING;

-- Gold Benefits
INSERT INTO public.membership_benefits (membership_level_id, icon_name, title, description, display_order)
SELECT
  id,
  'Percent',
  '10% Discount',
  'Get 10% off on every service (max Rp 10.000)',
  1
FROM public.customer_membership_levels WHERE name = 'Gold'
ON CONFLICT DO NOTHING;

INSERT INTO public.membership_benefits (membership_level_id, icon_name, title, description, display_order)
SELECT
  id,
  'Flame',
  'Super Points',
  'Earn 1.5x points on every transaction',
  2
FROM public.customer_membership_levels WHERE name = 'Gold'
ON CONFLICT DO NOTHING;

INSERT INTO public.membership_benefits (membership_level_id, icon_name, title, description, display_order)
SELECT
  id,
  'Crown',
  'Priority Service',
  'Skip the queue with priority handling',
  3
FROM public.customer_membership_levels WHERE name = 'Gold'
ON CONFLICT DO NOTHING;

INSERT INTO public.membership_benefits (membership_level_id, icon_name, title, description, display_order)
SELECT
  id,
  'Cake',
  'VIP Birthday',
  'Exclusive birthday reward with extra bonus',
  4
FROM public.customer_membership_levels WHERE name = 'Gold'
ON CONFLICT DO NOTHING;

INSERT INTO public.membership_benefits (membership_level_id, icon_name, title, description, display_order)
SELECT
  id,
  'Sparkles',
  'Exclusive Offers',
  'Access to members-only promotions',
  5
FROM public.customer_membership_levels WHERE name = 'Gold'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp for membership tables
CREATE OR REPLACE FUNCTION public.update_membership_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER customer_membership_levels_updated_at
  BEFORE UPDATE ON public.customer_membership_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_membership_updated_at();

CREATE TRIGGER membership_benefits_updated_at
  BEFORE UPDATE ON public.membership_benefits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_membership_updated_at();

CREATE TRIGGER customer_memberships_updated_at
  BEFORE UPDATE ON public.customer_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_membership_updated_at();

-- =====================================================
-- 8. FUNCTION TO CALCULATE MEMBERSHIP PROGRESS
-- =====================================================
-- This function calculates a customer's membership level based on transaction count
CREATE OR REPLACE FUNCTION public.calculate_membership_level(p_total_transactions INTEGER)
RETURNS BIGINT AS $$
DECLARE
  v_level_id BIGINT;
BEGIN
  -- Start with Bronze (default)
  SELECT id INTO v_level_id FROM public.customer_membership_levels WHERE level_index = 1;

  -- Check for Gold (10+ transactions)
  IF p_total_transactions >= 10 THEN
    SELECT id INTO v_level_id FROM public.customer_membership_levels WHERE level_index = 3;
  -- Check for Silver (3+ transactions)
  ELSEIF p_total_transactions >= 3 THEN
    SELECT id INTO v_level_id FROM public.customer_membership_levels WHERE level_index = 2;
  END IF;

  RETURN v_level_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. FUNCTION TO CREATE OR UPDATE CUSTOMER MEMBERSHIP
-- =====================================================
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
BEGIN
  -- Only proceed for finished orders
  IF NEW.status <> 'finished' THEN
    RETURN NEW;
  END IF;

  -- Get thresholds from membership levels
  SELECT
    COALESCE(MAX(CASE WHEN level_index = 2 THEN transaction_threshold END), 3),
    COALESCE(MAX(CASE WHEN level_index = 3 THEN transaction_threshold END), 10),
    COALESCE(MAX(CASE WHEN level_index = 4 THEN transaction_threshold END), 999)
  INTO v_bronze_threshold, v_silver_threshold, v_gold_threshold
  FROM public.customer_membership_levels;

  -- Count total finished transactions for this customer
  SELECT COUNT(*) INTO v_total_transactions
  FROM public.orders
  WHERE customer_id = NEW.customer_id AND status = 'finished';

  -- Calculate new membership level
  v_new_level_id := public.calculate_membership_level(v_total_transactions);

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
      -- Just update transaction count and progress
      UPDATE public.customer_memberships
      SET total_transactions = v_total_transactions,
          updated_at = NOW()
      WHERE customer_id = NEW.customer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The trigger below is commented out by default
-- Uncomment it after testing to enable automatic membership updates
-- CREATE TRIGGER update_membership_on_order_completion
--   AFTER INSERT OR UPDATE ON public.orders
--   FOR EACH ROW
--   EXECUTE FUNCTION public.create_or_update_customer_membership();
