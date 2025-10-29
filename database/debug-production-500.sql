-- ============================================
-- DEBUG PRODUCTION 500 ERRORS
-- Run this in production to identify the exact issue
-- ============================================

-- Step 1: Test basic connectivity and permissions
SELECT '=== BASIC CONNECTIVITY TEST ===' as debug_step;

-- Test if we can read from each table as ANON user
-- These should work with the RLS policies
SELECT 'Orders count test: ' || COUNT(*) as result
FROM orders
LIMIT 1;

SELECT 'Customers count test: ' || COUNT(*) as result
FROM customers
LIMIT 1;

SELECT 'Order Item count test: ' || COUNT(*) as result
FROM order_item
LIMIT 1;

SELECT 'Points Transactions count test: ' || COUNT(*) as result
FROM points_transactions
LIMIT 1;

SELECT 'Referral Usage count test: ' || COUNT(*) as result
FROM referral_usage
LIMIT 1;

-- Step 2: Test specific queries that client-side code uses
SELECT '=== CLIENT-SIDE QUERY TESTS ===' as debug_step;

-- Test the exact query from orderStore.fetchOrder
SELECT 'Tracking query test (orders by invoice): ' || COUNT(*) as result
FROM orders
WHERE invoice_id IS NOT NULL
LIMIT 5;

-- Test the customer lookup query from customer dashboard
SELECT 'Customer lookup test (by whatsapp): ' || COUNT(*) as result
FROM customers
WHERE whatsapp IS NOT NULL
LIMIT 5;

-- Test points transactions query
SELECT 'Points transactions test: ' || COUNT(*) as result
FROM points_transactions
WHERE customer_id IS NOT NULL
LIMIT 5;

-- Step 3: Test specific scenarios that might be failing
SELECT '=== SPECIFIC SCENARIO TESTS ===' as debug_step;

-- Test with a specific invoice if exists
SELECT 'Test with sample invoice: ' || COUNT(*) as result
FROM orders
WHERE invoice_id IN (SELECT invoice_id FROM orders WHERE invoice_id IS NOT NULL LIMIT 1)
LIMIT 1;

-- Test with a specific phone if exists
SELECT 'Test with sample phone: ' || COUNT(*) as result
FROM customers
WHERE whatsapp IN (SELECT whatsapp FROM customers WHERE whatsapp IS NOT NULL LIMIT 1)
LIMIT 1;

-- Step 4: Check for data issues
SELECT '=== DATA INTEGRITY CHECKS ===' as debug_step;

-- Check for NULL values that might cause issues
SELECT 'Orders with NULL invoice_id: ' || COUNT(*) as result
FROM orders
WHERE invoice_id IS NULL;

SELECT 'Customers with NULL whatsapp: ' || COUNT(*) as result
FROM customers
WHERE whatsapp IS NULL;

SELECT 'Order Items with NULL order_id: ' || COUNT(*) as result
FROM order_item
WHERE order_id IS NULL;

-- Step 5: Test the specific queries that are most likely failing
SELECT '=== HIGH-RISK QUERY TESTS ===' as debug_step;

-- Test complex joins that client-side code might be doing
-- This simulates the orderStore.fetchOrder with relationships
SELECT 'Complex order query test: ' || COUNT(*) as result
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
WHERE o.invoice_id IS NOT NULL
LIMIT 5;

-- Test the points balance query
SELECT 'Points balance query test: ' || COUNT(*) as result
FROM points_transactions pt
WHERE pt.customer_id IS NOT NULL
GROUP BY pt.customer_id
LIMIT 5;

-- Step 6: Environment and configuration check
SELECT '=== ENVIRONMENT CHECK ===' as debug_step;

-- Check current user and session
SELECT
    current_user as session_user,
    session_user as effective_user,
    current_database() as database_name,
    current_schema() as current_schema;

-- Check RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('orders', 'customers', 'order_item', 'points_transactions', 'referral_usage')
ORDER BY tablename;

-- Show active policies for each table
SELECT
    'POLICIES FOR ' || tablename as table_policies,
    policyname,
    permissive,
    roles,
    cmd as command,
    CASE
        WHEN qual IS NOT NULL THEN 'Has condition: ' || substr(qual, 1, 50) || '...'
        ELSE 'No condition (public access)'
    END as policy_details
FROM pg_policies
WHERE tablename IN ('orders', 'customers', 'order_item', 'points_transactions', 'referral_usage')
ORDER BY tablename, policyname;

-- Step 7: Performance check (might be timeout issues)
SELECT '=== PERFORMANCE CHECK ===' as debug_step;

-- Check table sizes (might be causing timeouts)
SELECT
    schemaname,
    tablename,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename IN ('orders', 'customers', 'order_item', 'points_transactions', 'referral_usage')
ORDER BY live_rows DESC;

SELECT '=== DEBUG COMPLETE ===' as debug_step;