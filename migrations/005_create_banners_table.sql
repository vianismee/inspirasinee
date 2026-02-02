-- Migration: Create banners table and storage bucket setup
-- Description: Table for managing promotional banners displayed on tracking page
-- Max 10 banners will be enforced at application level
--
-- IMPORTANT: After running this migration, you need to manually create the storage bucket
-- "banner-promotion" in Supabase dashboard with public access enabled
--
-- Storage policies are below - run these in Supabase SQL Editor after creating the bucket:

-- STORAGE BUCKET SETUP (run in Supabase SQL Editor):
/*
-- Insert storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('banner-promotion', 'banner-promotion', true, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Allow public access to view images
CREATE POLICY "Allow public to view banner images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'banner-promotion');

-- Allow authenticated users to upload banner images
CREATE POLICY "Allow authenticated to upload banner images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'banner-promotion');

-- Allow authenticated users to delete banner images
CREATE POLICY "Allow authenticated to delete banner images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'banner-promotion');
*/

CREATE TABLE IF NOT EXISTS public.banners (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  image_url TEXT NOT NULL,
  image_ratio TEXT NOT NULL, -- Stores aspect ratio like "16:9", "4:3", "1:1", etc.
  link_url TEXT, -- Optional URL for banner click-through
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0, -- For ordering banners
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT banners_pkey PRIMARY KEY (id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON public.banners(display_order);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);

-- Enable Row Level Security
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for all users (public banners)
CREATE POLICY "Allow public read access to banners"
  ON public.banners
  FOR SELECT
  TO public
  USING (true);

-- Create policy to allow all operations for authenticated users (admin)
CREATE POLICY "Allow authenticated users to manage banners"
  ON public.banners
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_banners_updated_at();
