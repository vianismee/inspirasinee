## Why
To implement a customer referral system that rewards both referrers and new users with points and discounts, driving user acquisition and customer loyalty.

## What Changes
- Add referral code management system for admin configuration
- Implement referral code validation during order creation
- Add points system for customers with redemption capabilities
- Create admin interface for managing referral settings
- Add referral tracking and analytics
- **BREAKING**: Modify orders table to properly handle referral discounts and points

## Impact
- Affected specs: referral-system, order-management
- Affected code:
  - Database schema (new tables, modified orders table)
  - Order creation flow
  - Admin dashboard
  - Customer management system