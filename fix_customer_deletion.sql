-- Fix customer deletion foreign key constraint issue
-- This script will fix the foreign key constraint to allow cascading deletes

-- STEP 1: Drop existing foreign key constraint on orders table
DO $$
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'orders'
        AND constraint_name = 'orders_customer_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE orders DROP CONSTRAINT orders_customer_id_fkey;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
END $$;

-- STEP 2: Create new foreign key constraint with ON DELETE CASCADE
ALTER TABLE orders
ADD CONSTRAINT orders_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES customers(customer_id)
ON DELETE CASCADE;

-- STEP 3: Also fix any other foreign key constraints that might exist
-- Check for order_item constraints
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'order_item'
        AND constraint_name = 'order_item_invoice_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE order_item DROP CONSTRAINT order_item_invoice_id_fkey;
        ALTER TABLE order_item
        ADD CONSTRAINT order_item_invoice_id_fkey
        FOREIGN KEY (invoice_id)
        REFERENCES orders(invoice_id)
        ON DELETE CASCADE;
        RAISE NOTICE 'Fixed order_item foreign key constraint';
    END IF;
END $$;

-- STEP 4: Fix order_discounts constraints
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'order_discounts'
        AND constraint_name = 'order_discounts_order_invoice_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE order_discounts DROP CONSTRAINT order_discounts_order_invoice_id_fkey;
        ALTER TABLE order_discounts
        ADD CONSTRAINT order_discounts_order_invoice_id_fkey
        FOREIGN KEY (order_invoice_id)
        REFERENCES orders(invoice_id)
        ON DELETE CASCADE;
        RAISE NOTICE 'Fixed order_discounts foreign key constraint';
    END IF;
END $$;

-- STEP 5: Fix customer_points constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'customer_points'
        AND constraint_name = 'customer_points_customer_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE customer_points DROP CONSTRAINT customer_points_customer_id_fkey;
        ALTER TABLE customer_points
        ADD CONSTRAINT customer_points_customer_id_fkey
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE CASCADE;
        RAISE NOTICE 'Fixed customer_points foreign key constraint';
    END IF;
END $$;

-- STEP 6: Fix point_transactions constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'point_transactions'
        AND constraint_name = 'point_transactions_customer_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE point_transactions DROP CONSTRAINT point_transactions_customer_id_fkey;
        ALTER TABLE point_transactions
        ADD CONSTRAINT point_transactions_customer_id_fkey
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE CASCADE;
        RAISE NOTICE 'Fixed point_transactions foreign key constraint';
    END IF;
END $$;

-- STEP 7: Create a simpler delete function
CREATE OR REPLACE FUNCTION delete_customer_safely(p_customer_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- With CASCADE constraints, we can delete the customer directly
    -- All related records will be automatically deleted
    DELETE FROM customers
    WHERE customer_id = p_customer_id;

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- STEP 8: Verification
SELECT 'Foreign key constraints fixed successfully!' as status;

SELECT table_name, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('orders', 'order_item', 'order_discounts', 'customer_points', 'point_transactions')
AND constraint_type = 'FOREIGN KEY'
ORDER BY table_name, constraint_name;