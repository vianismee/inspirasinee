-- ============================================
-- Diagnose RLS Issues for Client-Side Migration
-- Run this script first to understand current state
-- ============================================

-- Check which tables have RLS enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('orders', 'customers', 'points_transactions', 'order_items', 'referral_usage', 'points', 'discounts', 'services')
ORDER BY tablename;

-- Check existing RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    CASE
        WHEN qual IS NOT NULL THEN 'Has condition'
        ELSE 'No condition'
    END as has_condition,
    CASE
        WHEN with_check IS NOT NULL THEN 'Has check'
        ELSE 'No check'
    END as has_check
FROM pg_policies
WHERE tablename IN ('orders', 'customers', 'points_transactions', 'order_items', 'referral_usage', 'points', 'discounts', 'services')
ORDER BY tablename, policyname;

-- Check if anon role exists and can access tables
SELECT
    'ANON role exists' as status,
    EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') as exists
UNION ALL
SELECT
    'AUTHENTICATED role exists' as status,
    EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') as exists
UNION ALL
SELECT
    'SERVICE_ROLE role exists' as status,
    EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') as exists;

-- Test actual access as ANON user (this might fail)
-- You'll need to run these as the ANON user to see if they work

-- Test 1: Can we read orders?
-- SET ROLE anon;
-- SELECT COUNT(*) FROM orders LIMIT 1;
-- RESET ROLE;

-- Test 2: Can we read customers?
-- SET ROLE anon;
-- SELECT COUNT(*) FROM customers LIMIT 1;
-- RESET ROLE;

-- Test 3: Can we read points_transactions?
-- SET ROLE anon;
-- SELECT COUNT(*) FROM points_transactions LIMIT 1;
-- RESET ROLE;

-- Show table structures to understand what we're working with
SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
    AND t.table_name IN ('orders', 'customers', 'points_transactions', 'order_items', 'referral_usage')
ORDER BY t.table_name, c.ordinal_position;