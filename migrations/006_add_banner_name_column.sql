-- Migration: Add name column to banners table
-- Description: Add a name column for admin organization purposes
-- The name will NOT be displayed on the frontend banner view

-- Add name column to banners table
ALTER TABLE public.banners
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing records with default names
UPDATE public.banners
SET name = 'Banner ' || display_order::text
WHERE name IS NULL;
