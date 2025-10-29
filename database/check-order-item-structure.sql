-- ============================================
-- CHECK ORDER_ITEM TABLE STRUCTURE
-- This will show us the actual column names
-- ============================================

-- Get the actual column structure of order_item table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name = 'order_item'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if there are any foreign key relationships
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'order_item';

-- Check a sample of the actual data to understand the structure
SELECT *
FROM order_item
LIMIT 3;

-- Check what columns relate to orders
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'order_item'
    AND table_schema = 'public'
    AND (
        column_name LIKE '%order%'
        OR column_name LIKE '%invoice%'
        OR column_name LIKE '%id%'
    )
ORDER BY column_name;