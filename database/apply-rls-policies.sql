-- ============================================
-- APPLY RLS POLICIES FOR CLIENT-SIDE ACCESS
-- Run this in Supabase SQL Editor to fix 500 errors
-- ============================================

-- First, ensure RLS is enabled on all required tables
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referral_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_item ENABLE ROW LEVEL SECURITY;

-- Remove any existing conflicting policies
DROP POLICY IF EXISTS "Enable select for all users" ON orders;
DROP POLICY IF EXISTS "Enable select for all users" ON customers;
DROP POLICY IF EXISTS "Enable select for all users" ON points_transactions;
DROP POLICY IF EXISTS "Enable select for all users" ON order_item;
DROP POLICY IF EXISTS "Enable select for all users" ON referral_usage;

-- ============================================
-- ORDERS TABLE POLICY
-- Allows public read access for tracking system
-- ============================================
CREATE POLICY "Orders - Public Read Access" ON orders
    FOR SELECT USING (true);

-- ============================================
-- CUSTOMERS TABLE POLICY
-- Allows public read access for customer dashboard
-- ============================================
CREATE POLICY "Customers - Public Read Access" ON customers
    FOR SELECT USING (true);

-- ============================================
-- POINTS TRANSACTIONS TABLE POLICY
-- Allows public read access for customer dashboard
-- ============================================
CREATE POLICY "Points Transactions - Public Read Access" ON points_transactions
    FOR SELECT USING (true);

-- ============================================
-- ORDER ITEM TABLE POLICY
-- Allows public read access for tracking system
-- ============================================
CREATE POLICY "Order Item - Public Read Access" ON order_item
    FOR SELECT USING (true);

-- ============================================
-- REFERRAL USAGE TABLE POLICY
-- Allows public read access for referral analytics
-- ============================================
CREATE POLICY "Referral Usage - Public Read Access" ON referral_usage
    FOR SELECT USING (true);

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify the policies work
-- ============================================

-- Test orders access (should work now)
SELECT 'Orders test: ' || COUNT(*) as result
FROM orders
LIMIT 1;

-- Test customers access (should work now)
SELECT 'Customers test: ' || COUNT(*) as result
FROM customers
LIMIT 1;

-- Test points transactions access (should work now)
SELECT 'Points transactions test: ' || COUNT(*) as result
FROM points_transactions
LIMIT 1;

-- Test referral usage access (should work now)
SELECT 'Referral usage test: ' || COUNT(*) as result
FROM referral_usage
LIMIT 1;

-- Test order item access (should work now)
SELECT 'Order item test: ' || COUNT(*) as result
FROM order_item
LIMIT 1;

-- ============================================
-- SHOW ACTIVE POLICIES
-- Verify that policies are created correctly
-- ============================================

SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command
FROM pg_policies
WHERE tablename IN ('orders', 'customers', 'points_transactions', 'order_item', 'referral_usage')
ORDER BY tablename, policyname;