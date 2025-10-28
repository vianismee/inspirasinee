-- Migration to add points_used column to orders table
-- This column tracks how many points the customer used for this order

ALTER TABLE public.orders
ADD COLUMN points_used integer DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.points_used IS 'Number of points redeemed by customer for this order';