# Production Installation Guide - Referral and Points System

## Overview
This guide provides step-by-step instructions to deploy the Inspirasinee referral and points system to production.

## Prerequisites
- Next.js 15 project with TypeScript
- Supabase account and project
- Node.js 18+ installed
- Access to Supabase dashboard

## Installation Steps

### 1. Apply Database Migration
Go to your Supabase dashboard and follow these steps:

1. **Navigate to SQL Editor**
   - Open your Supabase project
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

2. **Run the Migration Script**
   - Copy the entire content of `migration.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

3. **Verify Migration Success**
   - Check the results tab for "Migration completed successfully!"
   - Verify that all tables and functions were created

### 2. Environment Configuration
Ensure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
NEXT_PUBLIC_NANO_ID=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
NEXT_PUBLIC_STATIC_QRIS_CODE=your-qris-code
```

### 3. Build and Deploy
Build your application for production:

```bash
npm run build
npm start
```

## System Features

### Referral System
- New customers get Rp 5,000 discount when using a valid referral code
- Referrers receive 15 points for each successful referral
- Referral codes are validated in real-time

### Points System
- Customers earn points through referrals
- Points can be redeemed for discounts (100 points = Rp 1,000)
- Full transaction history tracking
- Points balance management

### Order Integration
- Automatic referral discount application
- Points deduction during checkout
- Complete order history with referral and points information

## Database Schema

### Tables Created
- **referral_settings**: System configuration
- **customer_points**: Customer points balances
- **point_transactions**: All points transactions
- **customer_points_summary**: View of customer points with info

### Columns Added
- **customers.referralCode**: Customer's referral code
- **customers.referralCodeValid**: Referral code validation status
- **customers.referralDiscountAmount**: Discount amount from referral
- **orders.referral_code_used**: Referral code used in order
- **orders.referral_discount_amount**: Discount amount from referral
- **orders.points_used**: Points redeemed in order
- **orders.points_discount_amount**: Discount amount from points

### Functions Created
- `validate_referral_code()`: Validate referral codes
- `add_customer_points()`: Add points to customer
- ` deduct_customer_points()`: Deduct points from customer
- `get_customer_points_balance()`: Get customer points balance
- `ensure_customer_points_record()`: Ensure customer has points record
- `update_referral_setting()`: Update system settings

## Default Settings
- New customer discount: Rp 5,000
- Referrer points per referral: 15 points
- Point to rupiah conversion: 100 points = Rp 1,000

## Testing the System

### 1. Test Referral Code
1. Create a test customer (referrer)
2. Note their customer_id as referral code
3. Create a new customer with the referral code
4. Verify discount is applied
5. Complete the order
6. Check that referrer received 15 points

### 2. Test Points Redemption
1. Create a customer with points balance
2. Add items to cart
3. Use points for discount
4. Verify points are deducted
5. Complete the order

### 3. Test Order Details
1. Create an order with referral and points
2. Check order details page
3. Verify referral code and points are displayed

## Security Considerations

### Row Level Security (RLS)
- Enabled on all new tables
- Customers can only access their own points data
- Referral settings are publicly readable

### Input Validation
- Referral codes are validated against existing customers
- Points are validated before redemption
- All inputs are sanitized

## Monitoring and Maintenance

### Database Monitoring
- Monitor `point_transactions` table for unusual activity
- Check `customer_points` balances regularly
- Verify referral settings periodically

### Application Monitoring
- Monitor referral code validation success rate
- Track points redemption patterns
- Watch for failed transactions

## Troubleshooting

### Common Issues

**Referral Code Not Working**
- Verify customer exists in database
- Check if referral code is correct customer_id
- Ensure database functions are properly created

**Points Not Awarding**
- Check if referrer has points record
- Verify referral code was used in order
- Ensure order was completed successfully

**Database Errors**
- Re-run the migration script
- Check for missing tables or functions
- Verify all columns were created correctly

### Verification Queries
Run these in Supabase SQL Editor to verify system health:

```sql
-- Check referral settings
SELECT * FROM referral_settings;

-- Check customer points
SELECT COUNT(*) as customers_with_points FROM customer_points;

-- Check recent transactions
SELECT * FROM point_transactions ORDER BY created_at DESC LIMIT 10;

-- Verify functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%referral%' OR routine_name LIKE '%point%';
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify database migration was successful
3. Ensure all environment variables are set correctly
4. Test with the verification queries above

## Backup and Recovery

### Database Backup
- Regular backup of Supabase database
- Export referral settings and points data periodically
- Keep migration script for recovery purposes

### Recovery Steps
1. Restore database from backup
2. Re-run the migration script
3. Verify all functions and tables are recreated
4. Test system functionality

---

**Note**: This migration script is designed to be run once. Running it multiple times will not cause issues due to the `IF NOT EXISTS` and `ON CONFLICT` clauses.