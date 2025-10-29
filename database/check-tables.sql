-- ============================================
-- CHECK WHAT TABLES ACTUALLY EXIST
-- Run this first to understand your database structure
-- ============================================

-- List all tables in the public schema
SELECT
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
    AND (
        tablename LIKE '%order%'
        OR tablename LIKE '%customer%'
        OR tablename LIKE '%point%'
        OR tablename LIKE '%referral%'
        OR tablename LIKE '%discount%'
        OR tablename LIKE '%service%'
    )
ORDER BY tablename;

-- Check if specific tables exist
SELECT
    'orders' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') as exists
UNION ALL
SELECT
    'customers' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') as exists
UNION ALL
SELECT
    'order_items' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items' AND table_schema = 'public') as exists
UNION ALL
SELECT
    'order_item' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'order_item' AND table_schema = 'public') as exists
UNION ALL
SELECT
    'points_transactions' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'points_transactions' AND table_schema = 'public') as exists
UNION ALL
SELECT
    'points' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'points' AND table_schema = 'public') as exists
UNION ALL
SELECT
    'referral_usage' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_usage' AND table_schema = 'public') as exists
UNION ALL
SELECT
    'discounts' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'discounts' AND table_schema = 'public') as exists
UNION ALL
SELECT
    'services' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'services' AND table_schema = 'public') as exists;

-- Check if orders table has order_item relationship
-- (This will help us understand if order_item is a nested relation)
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
    AND table_schema = 'public'
    AND (
        column_name LIKE '%item%'
        OR column_name LIKE '%product%'
        OR column_name LIKE '%service%'
    )
ORDER BY ordinal_position;