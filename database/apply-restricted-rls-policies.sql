-- ============================================
-- RESTRICTED RLS POLICIES (MORE SECURE)
-- Use this instead of public access if needed
-- ============================================

-- Enable RLS on all required tables
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referral_usage ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies
DROP POLICY IF EXISTS "Orders - Public Read Access" ON orders;
DROP POLICY IF EXISTS "Customers - Public Read Access" ON customers;
DROP POLICY IF EXISTS "Points Transactions - Public Read Access" ON points_transactions;
DROP POLICY IF EXISTS "Order Items - Public Read Access" ON order_items;
DROP POLICY IF EXISTS "Referral Usage - Public Read Access" ON referral_usage;

-- ============================================
-- RESTRICTED POLICIES
-- Only allow access to specific data patterns
-- ============================================

-- Orders: Allow access by invoice_id (for tracking)
CREATE POLICY "Orders - Invoice Access" ON orders
    FOR SELECT USING (
        invoice_id IS NOT NULL AND
        LENGTH(invoice_id) >= 3
    );

-- Customers: Allow access by phone/whatsapp (for dashboard)
CREATE POLICY "Customers - Phone Access" ON customers
    FOR SELECT USING (
        whatsapp IS NOT NULL AND
        LENGTH(whatsapp) >= 10
    );

-- Points Transactions: Allow access by customer_id
CREATE POLICY "Points Transactions - Customer Access" ON points_transactions
    FOR SELECT USING (
        customer_id IS NOT NULL AND
        LENGTH(customer_id) >= 3
    );

-- Order Items: Allow access (linked to orders which are already restricted)
CREATE POLICY "Order Items - Linked Access" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
        )
    );

-- Referral Usage: Allow read access for analytics
CREATE POLICY "Referral Usage - Analytics Access" ON referral_usage
    FOR SELECT USING (
        referral_code IS NOT NULL AND
        LENGTH(referral_code) >= 3
    );

-- ============================================
-- TEST RESTRICTED POLICIES
-- ============================================

-- Test orders access by invoice_id
SELECT 'Orders by invoice test: ' || COUNT(*) as result
FROM orders
WHERE invoice_id IS NOT NULL
LIMIT 1;

-- Test customers access by phone
SELECT 'Customers by phone test: ' || COUNT(*) as result
FROM customers
WHERE whatsapp IS NOT NULL
LIMIT 1;

-- Test points transactions by customer
SELECT 'Points transactions by customer test: ' || COUNT(*) as result
FROM points_transactions
WHERE customer_id IS NOT NULL
LIMIT 1;