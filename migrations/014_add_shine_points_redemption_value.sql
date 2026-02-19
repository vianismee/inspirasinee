-- =====================================================
-- ADD SHINE POINTS REDEMPTION VALUE SETTING
-- =====================================================
-- This adds a separate redemption rate for Shine Points (membership points)
-- distinct from referral points redemption

-- 1. Add shine_points_redemption_value column to referral_settings
ALTER TABLE public.referral_settings
ADD COLUMN IF NOT EXISTS shine_points_redemption_value integer NOT NULL DEFAULT 1000;

-- 2. Add shine_points_redemption_minimum column
ALTER TABLE public.referral_settings
ADD COLUMN IF NOT EXISTS shine_points_redemption_minimum integer NOT NULL DEFAULT 50;

-- 3. Update existing row(s) with default values
UPDATE public.referral_settings
SET
  shine_points_redemption_value = 1000,
  shine_points_redemption_minimum = 50
WHERE shine_points_redemption_value IS NULL OR shine_points_redemption_minimum IS NULL;

-- 4. Verification query
SELECT
  id,
  points_redemption_value as referral_points_value,
  points_redemption_minimum as referral_points_minimum,
  shine_points_redemption_value,
  shine_points_redemption_minimum,
  is_active
FROM public.referral_settings;
