-- Migration: Move from dev schema to public schema
-- This migration moves all tables from dev schema to public schema
-- Run this in your Supabase SQL editor or migration tool

-- =====================================================
-- STEP 1: Create public schema tables with proper structure
-- =====================================================

-- Core Business Tables
-- --------------------

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id text UNIQUE,
  username text,
  email text,
  whatsapp text UNIQUE,
  alamat text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);

-- Service category table
CREATE TABLE IF NOT EXISTS public.service_category (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT service_category_pkey PRIMARY KEY (id)
);

-- Service catalog table
CREATE TABLE IF NOT EXISTS public.service_catalog (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text,
  amount integer NOT NULL,
  category_id bigint,
  CONSTRAINT service_catalog_pkey PRIMARY KEY (id),
  CONSTRAINT fk_service_catalog_category FOREIGN KEY (category_id) REFERENCES public.service_category(id)
);

-- Discount table
CREATE TABLE IF NOT EXISTS public.discount (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  label text,
  amount integer,
  percent numeric,
  CONSTRAINT discount_pkey PRIMARY KEY (id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  invoice_id text UNIQUE,
  customer_id text,
  subtotal integer,
  total_price integer,
  payment text,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  status text,
  referral_code character varying,
  referral_discount_amount numeric DEFAULT 0,
  points_awarded integer DEFAULT 0,
  points_used integer DEFAULT 0,
  points_discount_amount integer DEFAULT 0,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_item (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  invoice_id text,
  shoe_name text,
  amount integer,
  service text,
  CONSTRAINT order_item_pkey PRIMARY KEY (id),
  CONSTRAINT order_item_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.orders(invoice_id)
);

-- Order discounts table
CREATE TABLE IF NOT EXISTS public.order_discounts (
  order_invoice_id text NOT NULL,
  discount_code text NOT NULL,
  discounted_amount integer NOT NULL,
  CONSTRAINT order_discounts_pkey PRIMARY KEY (order_invoice_id, discount_code),
  CONSTRAINT order_discounts_order_invoice_id_fkey FOREIGN KEY (order_invoice_id) REFERENCES public.orders(invoice_id)
);

-- Referral System Tables
-- ---------------------

-- Referral settings table
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  referral_discount_amount integer NOT NULL DEFAULT 0,
  referrer_points_earned integer NOT NULL DEFAULT 0,
  points_redemption_minimum integer NOT NULL DEFAULT 50,
  points_redemption_value integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referral_settings_pkey PRIMARY KEY (id)
);

-- Customer points table
CREATE TABLE IF NOT EXISTS public.customer_points (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id text NOT NULL,
  current_balance integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  total_redeemed integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customer_points_pkey PRIMARY KEY (id),
  CONSTRAINT customer_points_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT customer_points_customer_id_unique UNIQUE (customer_id)
);

-- Referral usage table
CREATE TABLE IF NOT EXISTS public.referral_usage (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  referral_code text NOT NULL,
  referrer_customer_id text NOT NULL,
  referred_customer_id text NOT NULL,
  order_invoice_id text NOT NULL,
  discount_applied integer NOT NULL,
  points_awarded integer NOT NULL,
  used_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referral_usage_pkey PRIMARY KEY (id),
  CONSTRAINT referral_usage_referrer_fkey FOREIGN KEY (referrer_customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT referral_usage_referred_fkey FOREIGN KEY (referred_customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT referral_usage_order_fkey FOREIGN KEY (order_invoice_id) REFERENCES public.orders(invoice_id)
);

-- Points transactions table
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id text NOT NULL,
  transaction_type text NOT NULL,
  points_change integer NOT NULL,
  balance_after integer NOT NULL,
  reference_type text NOT NULL,
  reference_id text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT points_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT points_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);

-- =====================================================
-- STEP 2: Create Performance Indexes
-- =====================================================

-- Core business indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_item_invoice_id ON public.order_item(invoice_id);
CREATE INDEX IF NOT EXISTS idx_service_catalog_category_id ON public.service_catalog(category_id);

-- Referral system indexes
CREATE INDEX IF NOT EXISTS idx_referral_usage_referrer ON public.referral_usage(referrer_customer_id);
CREATE INDEX IF NOT EXISTS idx_referral_usage_referred ON public.referral_usage(referred_customer_id);
CREATE INDEX IF NOT EXISTS idx_referral_usage_code ON public.referral_usage(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_usage_used_at ON public.referral_usage(used_at);
CREATE INDEX IF NOT EXISTS idx_customer_points_customer_id ON public.customer_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_customer_id ON public.points_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON public.points_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON public.points_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON public.orders(referral_code);

-- =====================================================
-- STEP 3: Data Migration (uncomment if you have data to migrate)
-- =====================================================

/*
-- Migrate customers data
INSERT INTO public.customers (id, customer_id, username, email, whatsapp, alamat, created_at)
SELECT id, customer_id, username, email, whatsapp, alamat, created_at
FROM dev.customers
ON CONFLICT (id) DO NOTHING;

-- Migrate service category data
INSERT INTO public.service_category (id, name, created_at)
SELECT id, name, created_at
FROM dev.service_category
ON CONFLICT (id) DO NOTHING;

-- Migrate service catalog data
INSERT INTO public.service_catalog (id, name, amount, category_id)
SELECT id, name, amount, category_id
FROM dev.service_catalog
ON CONFLICT (id) DO NOTHING;

-- Migrate discount data
INSERT INTO public.discount (id, label, amount, percent)
SELECT id, label, amount, percent
FROM dev.discount
ON CONFLICT (id) DO NOTHING;

-- Migrate orders data
INSERT INTO public.orders (
  id, invoice_id, customer_id, subtotal, total_price, payment,
  created_at, status, referral_code, referral_discount_amount,
  points_awarded, points_used, points_discount_amount
)
SELECT
  id, invoice_id, customer_id, subtotal, total_price, payment,
  created_at, status, referral_code, referral_discount_amount,
  points_awarded, COALESCE(points_used, 0), COALESCE(points_discount_amount, 0)
FROM dev.orders
ON CONFLICT (id) DO NOTHING;

-- Migrate order items data
INSERT INTO public.order_item (id, invoice_id, shoe_name, amount, service)
SELECT id, invoice_id, shoe_name, amount, service
FROM dev.order_item
ON CONFLICT (id) DO NOTHING;

-- Migrate order discounts data
INSERT INTO public.order_discounts (order_invoice_id, discount_code, discounted_amount)
SELECT order_invoice_id, discount_code, discounted_amount
FROM dev.order_discounts
ON CONFLICT (order_invoice_id, discount_code) DO NOTHING;

-- Migrate referral settings data
INSERT INTO public.referral_settings (
  id, referral_discount_amount, referrer_points_earned,
  points_redemption_minimum, points_redemption_value, is_active,
  created_at, updated_at
)
SELECT
  id, referral_discount_amount, referrer_points_earned,
  points_redemption_minimum, points_redemption_value, is_active,
  created_at, updated_at
FROM dev.referral_settings
ON CONFLICT (id) DO NOTHING;

-- Migrate customer points data
INSERT INTO public.customer_points (
  id, customer_id, current_balance, total_earned, total_redeemed, created_at, updated_at
)
SELECT id, customer_id, current_balance, total_earned, total_redeemed, created_at, updated_at
FROM dev.customer_points
ON CONFLICT (id) DO NOTHING;

-- Migrate referral usage data
INSERT INTO public.referral_usage (
  id, referral_code, referrer_customer_id, referred_customer_id,
  order_invoice_id, discount_applied, points_awarded, used_at
)
SELECT
  id, referral_code, referrer_customer_id, referred_customer_id,
  order_invoice_id, discount_applied, points_awarded, used_at
FROM dev.referral_usage
ON CONFLICT (id) DO NOTHING;

-- Migrate points transactions data
INSERT INTO public.points_transactions (
  id, customer_id, transaction_type, points_change, balance_after,
  reference_type, reference_id, description, created_at
)
SELECT
  id, customer_id, transaction_type, points_change, balance_after,
  reference_type, reference_id, description, created_at
FROM dev.points_transactions
ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- STEP 4: Initialize Default Data
-- =====================================================

-- Insert default referral settings if table is empty
INSERT INTO public.referral_settings (
  referral_discount_amount,
  referrer_points_earned,
  points_redemption_minimum,
  points_redemption_value
) VALUES (
  5000, -- Discount amount for new users (adjust based on currency)
  10,   -- Points awarded to referrer
  50,   -- Minimum points to redeem
  100   -- Discount amount per point redemption (adjust based on currency)
) ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 5: Set Up Row Level Security (RLS) - Optional
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (customize based on your security requirements)
/*
-- Customers can only view their own data
CREATE POLICY "Users can view own customer data" ON public.customers
  FOR SELECT USING (auth.uid()::text = customer_id);

-- Customers can only view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid()::text = customer_id);

-- Customers can only view their own points
CREATE POLICY "Users can view own points" ON public.customer_points
  FOR SELECT USING (auth.uid()::text = customer_id);
*/

-- =====================================================
-- Migration Complete
-- =====================================================

-- Notes:
-- 1. After running this migration, update your application code to use 'public' schema
-- 2. Update environment variables to point to public schema
-- 3. Test all functionality to ensure data integrity
-- 4. Consider backing up your dev schema data before migration
-- 5. Uncomment the data migration section if you need to migrate existing data