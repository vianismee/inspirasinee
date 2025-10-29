-- Migration to add points_discount_amount column to orders table
-- This will store the monetary value of redeemed points (similar to referral_discount_amount)

-- Add the points_discount_amount column to the orders table
ALTER TABLE public.orders
ADD COLUMN points_discount_amount numeric DEFAULT 0;

-- Add a comment to describe the column
COMMENT ON COLUMN public.orders.points_discount_amount IS 'Monetary value of points redeemed for this order';

-- Optional: Create an index if you frequently query by points_discount_amount
-- CREATE INDEX idx_orders_points_discount_amount ON public.orders(points_discount_amount);

-- Verify the column was added correctly
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name = 'points_discount_amount';