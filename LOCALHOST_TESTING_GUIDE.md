# Localhost Testing Guide - Referral & Points System

## 🚀 Development Server Status
- **URL**: http://localhost:3001
- **Status**: ✅ Running and ready for testing
- **Note**: Port 3000 was in use, so it's running on port 3001

## 📋 Test Scenarios

### Scenario 1: Test Referral Points (15 points to referrer)
**Goal**: Verify referrer gets 15 points when new customer signs up with their code

1. **Preparation**:
   - Go to Admin → Customer → Create a test customer (this will be your referrer)
   - Note their customer ID (this is their referral code)

2. **Test Process**:
   - Go to **Admin → Order** (http://localhost:3001/admin/order)
   - Create a **NEW** customer order
   - Fill in customer details
   - Continue to service selection page
   - Enter the referrer's customer ID in the "Referral Code" field
   - Add services and complete the order

3. **Expected Results**:
   - ✅ Order completes successfully
   - ✅ Referrer receives 15 points
   - ✅ Transaction record created
   - ✅ Success message: "15 points awarded to referrer!"

### Scenario 2: Test Points Redemption
**Goal**: Verify existing customers can use their points for discounts

1. **Preparation**:
   - Create a customer with some points (use Scenario 1 first)
   - Note their points balance

2. **Test Process**:
   - Go to **Admin → Order** → Create order for existing customer
   - Continue to service selection page
   - In the "Points Redemption" section, enter points to use
   - Complete the order

3. **Expected Results**:
   - ✅ Points are deducted from balance
   - ✅ Discount is applied to total
   - ✅ Success message: "X points deducted from your balance"

### Scenario 3: Test Order Details Display
**Goal**: Verify referral codes and points show up in order details

1. **Test Process**:
   - Create an order with referral code and/or points
   - Go to the tracking page (should be accessible from order completion)
   - Check the order breakdown

2. **Expected Results**:
   - ✅ Referral code and amount displayed
   - ✅ Points used and discount amount displayed
   - ✅ All discounts properly calculated

## 🔍 Debugging Tips

### If Points Don't Show Up:
1. **Check Customer Points Record**:
   - Go to Admin → Referral → Customer Points
   - Verify the customer has a points record
   - If not, try creating an order to trigger initialization

2. **Check Browser Console**:
   - Open Developer Tools → Console
   - Look for any error messages during order submission
   - Check for network errors

3. **Check Database**:
   - Use Supabase SQL Editor to run:
   ```sql
   SELECT * FROM customer_points WHERE customer_id = 'YOUR_CUSTOMER_ID';
   SELECT * FROM point_transactions WHERE customer_id = 'YOUR_CUSTOMER_ID';
   ```

### If Referral Code Doesn't Work:
1. **Verify Referrer Exists**:
   - Check Admin → Customer to ensure referrer account exists
   - Verify the customer ID is correct

2. **Check Referral Validation**:
   - The referral code input should show validation messages
   - "Valid referral code" should appear if successful

## 📱 Testing Checklist

- [ ] Referral code validation works
- [ ] 15 points awarded to referrer after successful new customer order
- [ ] Points balance updates correctly
- [ ] Points can be redeemed for discounts
- [ ] Points are properly deducted when used
- [ ] Order details show referral information
- [ ] Order details show points used
- [ ] Error messages appear when things go wrong
- [ ] Success messages appear when things work

## 🐛 Known Issues & Workarounds

### Issue: "Points balance shows 0"
- **Cause**: Customer doesn't have points record initialized
- **Fix**: Try creating any order for that customer, it should auto-initialize

### Issue: "Referral code not accepted"
- **Cause**: Referrer customer doesn't exist or ID is incorrect
- **Fix**: Verify the customer exists and use exact customer ID

### Issue: "Points not deducted"
- **Cause**: Points record doesn't exist or system error
- **Fix**: Check browser console for errors, ensure customer has points record

## 📞 If Issues Persist

1. **Check the browser console** for JavaScript errors
2. **Check the Supabase logs** for database errors
3. **Review the recent changes** in the codebase
4. **Run the test scripts** in Supabase SQL Editor to verify database functions

---

## 🎯 Success Criteria

The referral and points system is working correctly when:
- ✅ Referrers automatically receive 15 points for successful referrals
- ✅ Points balances update immediately
- ✅ Points can be redeemed for discounts
- ✅ All referral and point information displays in order details
- ✅ Error handling provides clear feedback
- ✅ No silent failures occur

**Good luck with your testing!** 🚀