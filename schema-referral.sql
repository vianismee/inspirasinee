-- Referral System Database Schema
-- Additions to support complete referral functionality

-- 1.1 Referral settings table for admin configuration
CREATE TABLE dev.referral_settings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  referral_discount_amount integer NOT NULL DEFAULT 0, -- Discount amount for new users
  referrer_points_earned integer NOT NULL DEFAULT 0, -- Points awarded to referrer
  points_redemption_minimum integer NOT NULL DEFAULT 50, -- Minimum points to redeem
  points_redemption_value integer NOT NULL DEFAULT 0, -- Discount amount per point redemption
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referral_settings_pkey PRIMARY KEY (id)
);

-- 1.2 Customer points table for point tracking
CREATE TABLE dev.customer_points (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id text NOT NULL,
  current_balance integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  total_redeemed integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customer_points_pkey PRIMARY KEY (id),
  CONSTRAINT customer_points_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES dev.customers(customer_id),
  CONSTRAINT customer_points_customer_id_unique UNIQUE (customer_id)
);

-- 1.3 Referral usage table for tracking referral usage
CREATE TABLE dev.referral_usage (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  referral_code text NOT NULL,
  referrer_customer_id text NOT NULL,
  referred_customer_id text NOT NULL,
  order_invoice_id text NOT NULL,
  discount_applied integer NOT NULL,
  points_awarded integer NOT NULL,
  used_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referral_usage_pkey PRIMARY KEY (id),
  CONSTRAINT referral_usage_referrer_fkey FOREIGN KEY (referrer_customer_id) REFERENCES dev.customers(customer_id),
  CONSTRAINT referral_usage_referred_fkey FOREIGN KEY (referred_customer_id) REFERENCES dev.customers(customer_id),
  CONSTRAINT referral_usage_order_fkey FOREIGN KEY (order_invoice_id) REFERENCES dev.orders(invoice_id)
);

-- Points transaction history for audit trail
CREATE TABLE dev.points_transactions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id text NOT NULL,
  transaction_type text NOT NULL, -- 'earned', 'redeemed', 'adjusted'
  points_change integer NOT NULL, -- Positive for earned, negative for redeemed
  balance_after integer NOT NULL,
  reference_type text NOT NULL, -- 'referral', 'redemption', 'manual_adjustment'
  reference_id text, -- order_invoice_id, referral_usage_id, etc.
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT points_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT points_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES dev.customers(customer_id)
);

-- 1.4 Update orders table to properly handle points_used
ALTER TABLE dev.orders
ADD COLUMN IF NOT EXISTS points_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_discount_amount integer DEFAULT 0;

-- 1.5 Add database indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_usage_referrer ON dev.referral_usage(referrer_customer_id);
CREATE INDEX IF NOT EXISTS idx_referral_usage_referred ON dev.referral_usage(referred_customer_id);
CREATE INDEX IF NOT EXISTS idx_referral_usage_code ON dev.referral_usage(referral_code);
CREATE INDEX IF NOT EXISTS idx_customer_points_customer_id ON dev.customer_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_customer_id ON dev.points_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON dev.points_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON dev.orders(referral_code);

-- Insert default referral settings
INSERT INTO dev.referral_settings (
  referral_discount_amount,
  referrer_points_earned,
  points_redemption_minimum,
  points_redemption_value
) VALUES (
  5000, -- 10,000 discount for new user (adjust based on currency)
  10,    -- 50 points for referrer
  50,    -- Minimum 50 points to redeem
  100    -- 500 discount per point redeemed (adjust based on currency)
) ON CONFLICT DO NOTHING;