# Referral & Points System Testing Guide

## Prerequisites
- Access to Supabase SQL Editor
- Development server running (npm run dev)

## Step 1: Test Database Functions

1. **Open Supabase SQL Editor**
2. **Run the test script**: Copy and execute the contents of `test_referral_system.sql`

## Step 2: Verify Test Results

After running the test script, you should see:

### ✅ Expected Results:

1. **Database Functions Working**:
   - `add_points_result`: `true`
   - `deduct_points_result`: `true`
   - No error messages

2. **Points Balances Updated**:
   - `new_customer_balance`: `50` (from referral reward)
   - `existing_customer_balance_after`: `75` (100 - 25)

3. **Customer Points Summary**:
   - Should show records for all 3 test customers
   - Balances should match expectations

4. **Point Transactions**:
   - Should show 2 transactions:
     - Credit: +50 points for TEST_NEW_CUSTOMER
     - Debit: -25 points for TEST_EXISTING_CUSTOMER

5. **Order Data**:
   - Should show 3 test orders with proper relationships
   - Referral and points data should be present

## Step 3: Test Frontend Integration

### Test Points Redemption:
1. Go to `http://localhost:3000/admin/order`
2. Create an order for existing customer with points
3. On the service page, try to redeem points
4. Verify points are deducted after order completion

### Test Referral Code:
1. Go to `http://localhost:3000/admin/order`
2. Create a new customer order
3. On the service page, enter referral code: `TEST_REFERRER`
4. Verify referral discount is applied

## Step 4: Common Issues & Fixes

### Issue 1: "Points not deducting"
**Fix**: Check if `customer_points` record exists for the customer
```sql
SELECT * FROM customer_points WHERE customer_id = 'YOUR_CUSTOMER_ID';
```
If not found, create it:
```sql
INSERT INTO customer_points (customer_id, points_balance) VALUES ('YOUR_CUSTOMER_ID', 0);
```

### Issue 2: "Referral code not working"
**Fix**: Verify the referrer exists:
```sql
SELECT * FROM customers WHERE customer_id = 'REFERRAL_CODE';
```

### Issue 3: "Functions returning null/false"
**Fix**: Check database function names and parameters in migration file

## Step 5: Clean Up Test Data

When done testing, run the cleanup section at the bottom of `test_referral_system.sql`:

```sql
-- Uncomment and run this section
DELETE FROM point_transactions WHERE customer_id LIKE 'TEST_%';
DELETE FROM customer_points WHERE customer_id LIKE 'TEST_%';
DELETE FROM order_item WHERE invoice_id LIKE 'TEST_%';
DELETE FROM order_discounts WHERE order_invoice_id LIKE 'TEST_%';
DELETE FROM orders WHERE invoice_id LIKE 'TEST_%';
DELETE FROM customers WHERE customer_id LIKE 'TEST_%';
```

## Debug Commands

### Check all customer points:
```sql
SELECT * FROM customer_points_summary ORDER BY total_points DESC;
```

### Check recent point transactions:
```sql
SELECT * FROM point_transactions ORDER BY created_at DESC LIMIT 10;
```

### Check orders with referrals/points:
```sql
SELECT
    invoice_id,
    customer_id,
    referral_code_used,
    referral_discount_amount,
    points_used,
    points_discount_amount,
    total_price
FROM orders
WHERE referral_code_used IS NOT NULL OR points_used > 0
ORDER BY created_at DESC;
```

### Check referral effectiveness:
```sql
SELECT
    referral_code_used,
    COUNT(*) as times_used,
    SUM(referral_discount_amount) as total_discount_given
FROM orders
WHERE referral_code_used IS NOT NULL
GROUP BY referral_code_used;
```