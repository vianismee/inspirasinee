## Why

The current discount system only supports simple fixed amount and percentage discounts without expiration dates, combination rules, or quantity-based pricing. The business needs advanced discount capabilities including expirable promotions, quantity-based tiered pricing, and stackable discount codes with combination rules.

## What Changes

- **Database Schema Updates**: Add new tables and fields for advanced discount management
- **New Discount Types**: Introduce quantity-based, expirable, and combination discount types
- **Enhanced Admin Interface**: Add comprehensive discount management with new features
- **Advanced Calculation Logic**: Implement complex discount stacking and validation rules
- **Maximum Discount Caps**: Add maximum discount amount limits for percentage-based discounts
- **Client-Side Architecture**: All logic implemented client-side using existing Zustand stores and Supabase

**BREAKING**: Database schema changes required for new discount fields and relationships

## Impact

- **Affected specs**: discount capability
- **Affected code**:
  - `src/components/Discount/` - Admin interface updates
  - `src/components/Cart/Discount.tsx` - Customer interface
  - `src/stores/serviceCatalogStore.ts` - Discount data management
  - `src/stores/cartStore.ts` - Cart calculation logic
  - `src/lib/client-services.ts` - Database operations
  - `src/types/database.ts` - Type definitions
  - Database schema - New tables and fields

## Key Features

1. **Expirable Discounts**: Discount campaigns with start/end dates
2. **Quantity-Based Pricing**: Tiered pricing based on item quantity (e.g., "3 pairs for 85k", "5 pairs for 40k")
3. **Discount Codes**: Optional codes for specific discounts
4. **Combination Rules**: Control which discounts can be combined
5. **Maximum Discount Caps**: Percentage discounts with maximum amount limits (e.g., "10% off, max Rp. 2000")
6. **Advanced Validation**: Prevent invalid discount combinations
7. **Real-time Updates**: Live calculation and validation using existing Supabase subscriptions