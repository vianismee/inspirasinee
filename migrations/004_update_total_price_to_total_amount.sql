-- Migration to rename total_price to total_amount for consistency
-- This matches the field name used throughout the codebase

-- First, add the new column
ALTER TABLE public.orders
ADD COLUMN total_amount integer;

-- Copy data from old column to new column
UPDATE public.orders
SET total_amount = total_price;

-- Drop the old column
ALTER TABLE public.orders
DROP COLUMN total_price;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.total_amount IS 'Total amount after discounts and points redemption';