-- Setup Admin Authentication for Inspirasiinee
-- Run this in your Supabase SQL Editor

-- =====================================================
-- STEP 1: Create Admin Users Table (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text DEFAULT 'admin'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);

-- =====================================================
-- STEP 2: Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Create Policies for Admin Users
-- =====================================================

-- Allow users to view their own admin profile
CREATE POLICY "Users can view own admin profile" ON public.admin_users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Allow users to insert their own admin profile (on signup)
CREATE POLICY "Users can insert own admin profile" ON public.admin_users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Allow users to update their own admin profile
CREATE POLICY "Users can update own admin profile" ON public.admin_users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- =====================================================
-- STEP 4: Create Function to Handle Admin User Creation
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user into admin_users table with admin role
  INSERT INTO public.admin_users (id, email, role)
  VALUES (new.id, new.email, 'admin');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 5: Create Trigger for New User Registration
-- =====================================================
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 6: Create Admin Login Function
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: Insert Default Admin User (if needed)
-- =====================================================
-- Note: You'll need to create the actual user through Supabase Auth first
-- Then run this with their UUID:

-- Uncomment and replace with actual UUID after creating user in Supabase Auth
-- INSERT INTO public.admin_users (id, email, role)
-- VALUES ('YOUR_USER_UUID_HERE', 'admin@inspirasinee.com', 'admin')
-- ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- =====================================================
-- STEP 8: Grant Permissions
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.admin_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check admin users table
SELECT * FROM public.admin_users;

-- Check if function works
SELECT public.is_admin('test-uuid'::uuid);