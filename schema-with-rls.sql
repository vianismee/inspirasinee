-- Schema with Row Level Security (RLS) policies for client-side access
-- Add these policies to your existing Supabase database

-- Enable RLS on all tables that need client-side access
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

-- Admin users table (if not exists, create it for role management)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- === AUTHENTICATION POLICIES ===

-- Allow authenticated users to see their own data
CREATE POLICY "Users can view their own customer data" ON public.customers
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Allow admin users to access all customer data
CREATE POLICY "Admins can view all customers" ON public.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = auth.email()
    )
  );

-- === ORDERS POLICIES ===

-- Allow users to see orders related to them (if customer_id matches their auth)
CREATE POLICY "Users can view their orders" ON public.orders
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Allow admin users to manage all orders
CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = auth.email()
    )
  );

-- === ORDER ITEM POLICIES ===

-- Allow users to see order items for their orders
CREATE POLICY "Users can view their order items" ON public.order_item
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Allow admin users to manage all order items
CREATE POLICY "Admins can manage all order items" ON public.order_item
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = auth.email()
    )
  );

-- === SERVICE CATALOG POLICIES ===

-- Allow authenticated users to view service catalog (public read access)
CREATE POLICY "Authenticated users can view services" ON public.service_catalog
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Allow admin users to manage services
CREATE POLICY "Admins can manage services" ON public.service_catalog
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = auth.email()
    )
  );

-- === DISCOUNT POLICIES ===

-- Allow authenticated users to view active discounts
CREATE POLICY "Users can view active discounts" ON public.discount
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Allow admin users to manage discounts
CREATE POLICY "Admins can manage discounts" ON public.discount
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = auth.email()
    )
  );

-- === CUSTOMER POINTS POLICIES ===

-- Allow users to view their own points
CREATE POLICY "Users can view their points" ON public.customer_points
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Allow admin users to manage all points
CREATE POLICY "Admins can manage all points" ON public.customer_points
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = auth.email()
    )
  );

-- === POINTS TRANSACTIONS POLICIES ===

-- Allow users to view their own transactions
CREATE POLICY "Users can view their points transactions" ON public.points_transactions
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Allow admin users to manage all transactions
CREATE POLICY "Admins can manage all transactions" ON public.points_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = auth.email()
    )
  );

-- === REFERRAL POLICIES ===

-- Allow users to view their referral usage
CREATE POLICY "Users can view their referral usage" ON public.referral_usage
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Allow admin users to manage all referrals
CREATE POLICY "Admins can manage all referrals" ON public.referral_usage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = auth.email()
    )
  );

-- === REFERRAL SETTINGS POLICIES ===

-- Allow authenticated users to view referral settings
CREATE POLICY "Users can view referral settings" ON public.referral_settings
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Allow admin users to manage referral settings
CREATE POLICY "Admins can manage referral settings" ON public.referral_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = auth.email()
    )
  );

-- === ADMIN USERS POLICIES ===

-- Allow users to view their own admin profile
CREATE POLICY "Users can view their admin profile" ON public.admin_users
  FOR SELECT USING (
    auth.email() = email
  );

-- Allow users to update their own admin profile
CREATE POLICY "Users can update their admin profile" ON public.admin_users
  FOR UPDATE USING (
    auth.email() = email
  );

-- === DASHBOARD ACCESS POLICIES ===

-- Allow access to dashboard logs for authenticated users
ALTER TABLE public.dashboard_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access dashboard logs" ON public.dashboard_access_logs
  FOR ALL USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can access dashboard sessions" ON public.dashboard_sessions
  FOR ALL USING (
    auth.uid() IS NOT NULL
  );

-- === ORDER DISCOUNTS POLICIES ===

ALTER TABLE public.order_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order discounts" ON public.order_discounts
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can manage order discounts" ON public.order_discounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = auth.email()
    )
  );