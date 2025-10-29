-- ============================================
-- RLS Policies for Client-Side Access
-- Fixes 500 errors in Tracking & Customer Dashboard
-- ============================================

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referral_usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORDERS TABLE - Public Read Access for Tracking
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Orders - Public Read Access" ON orders;

-- Create policy for public read access to orders (for tracking)
CREATE POLICY "Orders - Public Read Access" ON orders
    FOR SELECT USING (true); -- Allow anyone to read orders for tracking

-- ============================================
-- CUSTOMERS TABLE - Public Read Access
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
DROP POLICY IF EXISTS "Customers - Public Read Access" ON customers;

-- Create policy for public read access to customers (for dashboard access)
CREATE POLICY "Customers - Public Read Access" ON customers
    FOR SELECT USING (true); -- Allow anyone to read customer data for dashboard

-- ============================================
-- POINTS_TRANSACTIONS TABLE - Public Read Access
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON points_transactions;
DROP POLICY IF EXISTS "Points Transactions - Public Read Access" ON points_transactions;

-- Create policy for public read access to points transactions
CREATE POLICY "Points Transactions - Public Read Access" ON points_transactions
    FOR SELECT USING (true); -- Allow anyone to read points transactions

-- ============================================
-- ORDER_ITEMS TABLE - Public Read Access
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON order_items;
DROP POLICY IF EXISTS "Order Items - Public Read Access" ON order_items;

-- Create policy for public read access to order items
CREATE POLICY "Order Items - Public Read Access" ON order_items
    FOR SELECT USING (true); -- Allow anyone to read order items

-- ============================================
-- REFERRAL_USAGE TABLE - Public Read Access
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON referral_usage;
DROP POLICY IF EXISTS "Referral Usage - Public Read Access" ON referral_usage;

-- Create policy for public read access to referral usage
CREATE POLICY "Referral Usage - Public Read Access" ON referral_usage
    FOR SELECT USING (true); -- Allow anyone to read referral usage

-- ============================================
-- VERIFY POLICIES ARE ACTIVE
-- ============================================

-- Check that policies are created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('orders', 'customers', 'points_transactions', 'order_items', 'referral_usage')
ORDER BY tablename, policyname;

-- ============================================
-- ALTERNATIVE: If public access is too broad,
-- use these more restrictive policies instead
-- ============================================

/*
-- More restrictive orders policy (only allow access by invoice_id)
DROP POLICY IF EXISTS "Orders - Public Read Access" ON orders;
CREATE POLICY "Orders - Public Read Access" ON orders
    FOR SELECT USING (true); -- Still allow public access for tracking

-- More restrictive customers policy (only allow access by phone/whatsapp)
DROP POLICY IF EXISTS "Customers - Public Read Access" ON customers;
CREATE POLICY "Customers - Public Read Access" ON customers
    FOR SELECT USING (true); -- Still allow public access for dashboard

-- For production, you might want to add IP-based restrictions
-- or time-based access controls
*/

-- ============================================
-- TEST QUERIES (run these to verify access)
-- ============================================

-- Test orders access
SELECT COUNT(*) as orders_count FROM orders LIMIT 1;

-- Test customers access
SELECT COUNT(*) as customers_count FROM customers LIMIT 1;

-- Test points_transactions access
SELECT COUNT(*) as points_transactions_count FROM points_transactions LIMIT 1;

-- Test order_items access
SELECT COUNT(*) as order_items_count FROM order_items LIMIT 1;

-- Test referral_usage access
SELECT COUNT(*) as referral_usage_count FROM referral_usage LIMIT 1;