# Bug Report: Membership & Points System Issues

**Date**: 2026-02-19
**Status**: Investigation Complete

---

## Executive Summary

Three critical bugs have been identified in the membership and points redemption system:

1. **Bug #1**: Shine Points do not increase during transaction
2. **Bug #2**: Invoice display confusion between Membership Discount and Points Redemption
3. **Bug #3**: Points (Referral) do not decrease when used

---

## Bug #1: Shine Points Do Not Increase During Transaction

### Severity
**CRITICAL** - Core feature not working

### Root Cause
**Missing Implementation Logic**

### Analysis

#### Current State
1. **Database Schema**: ✅ Correctly implemented
   - `customer_memberships.shine_points` column exists (NOT NULL DEFAULT 0)
   - `customer_membership_levels.points_multiplier` exists (1.0, 1.2, 1.5)

2. **Trigger**: ⚠️ Partially implemented
   - `create_or_update_customer_membership()` function exists
   - Trigger `update_membership_on_order_completion` is **COMMENTED OUT** in migration 007
   - Function handles:
     - ✅ Level progression (Bronze → Silver → Gold)
     - ✅ Transaction counting
     - ❌ **Does NOT award shine points**

3. **Application Code**: ❌ Not implemented
   - `cartStore.ts` `handleSubmit()` does NOT call any service to award shine points
   - No `ShinePointsService.awardShinePoints()` call after transaction completion

#### Expected Behavior (per Membership Benefits)
According to `migrations/007_membership_tables.sql`:
- **Bronze**: "Earn 1 point for every Rp 1.000 spent"
- **Silver**: "Earn 1.2x points on every transaction"
- **Gold**: "Earn 1.5x points on every transaction"

### Code Evidence

**Migration File (007_membership_tables.sql, line 422-424):**
```sql
-- Note: The trigger below is commented out by default
-- Uncomment it after testing to enable automatic membership updates
-- CREATE TRIGGER update_membership_on_order_completion
--   AFTER INSERT OR UPDATE ON public.orders
--   FOR EACH ROW
--   EXECUTE FUNCTION public.create_or_update_customer_membership();
```

**cartStore.ts handleSubmit() (lines 560-620):**
- Referral points award logic: ✅ Implemented
- Referral points deduction: ✅ Implemented
- **Shine points award: ❌ NOT IMPLEMENTED**

### Solution Required

1. **Enable or create trigger** to award shine points after transaction
2. **OR** Add logic to `cartStore.ts handleSubmit()` to call `ShinePointsService.addShinePoints()`
3. Calculate points as: `subtotal / 1000 * points_multiplier`
4. Record transaction in `points_transactions` table

---

## Bug #2: Invoice Display Confusion

### Severity
**MEDIUM** - User experience issue

### Root Cause
**Confusion between three separate discount systems:**
1. Regular Discount (coupons) - `order_discounts` table
2. Membership Discount (automatic) - `membership_discount_amount` field
3. Points Redemption (user-initiated) - `points_discount_amount` field

### Analysis

#### Current Invoice Display (InvoiceItems.tsx)

The invoice displays discounts in this order:
1. **Regular Discounts** (Green) - `Diskon - {code}`
2. **Referral Discount** (Green) - `Referral - {code}`
3. **Points Redemption** (Orange) - `Poin ({pts} pts)`
4. **Membership Discount** (Purple) - `Membership Discount`

#### The Confusion

When a user has:
- **Membership level** (e.g., Silver with 5% discount)
- **AND** redeems **points** (referral or shine points)

The invoice shows:
```
Subtotal: Rp 100.000
Diskon - PROMO: -Rp 5.000        ← Regular discount
Poin (50 pts): -Rp 50.000         ← Points redemption
Membership Discount: -Rp 5.000     ← Automatic membership discount
```

**Problem**: The "Membership Discount" line might be confusing because:
1. Users may not understand why they're getting a separate "Membership Discount"
2. It's not clear that this is the automatic percentage discount from their tier
3. The `membershipDiscount` variable is being used for BOTH:
   - Automatic membership discount (based on `discount_percent`)
   - Shine points redemption (which also calls `setMembershipDiscount()`)

### Code Evidence

**ShinePointsRedemption.tsx (line 105):**
```typescript
setMembershipDiscount(result.discount_amount || 0, membershipLevel || "Bronze", membershipLevelData?.id || 0);
```

This **overwrites** the automatic membership discount with shine points discount!

**cartStore.ts (line 500-501):**
```typescript
membership_discount_amount: membershipDiscount || 0,
membership_level_id: membershipLevelId || null,
```

Both automatic discount AND shine points redemption use the same `membershipDiscount` variable.

### Solution Required

1. **Separate the two discount types**:
   - `membershipDiscount` = Automatic discount from tier (Bronze/Silver/Gold)
   - `shinePointsDiscount` = User-initiated shine points redemption

2. **Add separate field to orders table**:
   - Keep `membership_discount_amount` for automatic tier discount
   - Add `shine_points_discount_amount` for shine points redemption

3. **Update invoice display** to clearly distinguish:
   - "Membership Discount (Silver 5%)" - automatic
   - "Shine Points Redemption (100 pts)" - user-initiated

---

## Bug #3: Points Do Not Decrease When Used

### Severity
**CRITICAL** - Financial/points balance bug

### Root Cause
**Variable naming confusion between Referral Points and Shine Points**

### Analysis

#### The Problem

When a customer redeems **Referral Points** (stored in `customer_points` table):
1. The code calls `PointsService.deductPoints()` ✅
2. This correctly deducts from `customer_points.current_balance` ✅
3. **BUT** the cart UI shows "Points Applied" but the balance doesn't update visually ❌

#### Code Evidence

**cartStore.ts handleSubmit() (lines 603-619):**
```typescript
} else if (pointsUsed && pointsUsed > 0) {
  try {
    const { PointsService } = await import("@/lib/client-services");
    await PointsService.deductPoints(
      customerIdToUse,
      pointsUsed,
      'order',
      invoice,
      `Points used for order ${invoice}`
    );
    toast.success(`Points deducted! You used ${pointsUsed} points`);
  } catch (error) {
    logger.error("Error deducting points", { error, pointsUsed, invoice }, "CartStore");
    toast.warning("Order successful, but points deduction failed");
  }
}
```

The deduction happens **AFTER** order is completed, but:
1. The cart state is not updated to refresh the points balance
2. The `PointsRedemption.tsx` component doesn't refetch the balance after redemption
3. The customer sees the same balance even though deduction occurred

#### Database vs UI Sync Issue

| Component | Database | UI Display |
|-----------|----------|------------|
| Order created | ✅ points_used saved | ✅ Shows deduction applied |
| Points deducted | ✅ customer_points updated | ❌ Balance NOT refreshed |
| Invoice shown | ✅ points_discount_amount shown | ❌ Old balance still shown |

### Solution Required

1. **Refetch points balance after successful deduction**:
   - In `cartStore.ts`, after `PointsService.deductPoints()` succeeds
   - Call `PointsService.getCustomerBalance()` to get new balance
   - Update cart state or trigger a refetch in `PointsRedemption` component

2. **Or better**: Reset cart after successful order:
   - The `resetCart()` function should clear all discount states
   - Points redemption UI should show "cleared" state after order

---

## Additional Findings

### Schema Issues

#### 1. Missing Foreign Key
```sql
-- orders.membership_level_id has no foreign key constraint!
ALTER TABLE public.orders ADD CONSTRAINT orders_membership_level_id_fkey
  FOREIGN KEY (membership_level_id) REFERENCES public.customer_membership_levels(id);
```

This is why the join query failed earlier.

#### 2. Points Redemption Value Column Order
In `schema.sql` (line 256-257):
```sql
shine_points_redemption_value integer NOT NULL DEFAULT 1000,
shine_points_redemption_minimum integer NOT NULL DEFAULT 50,
```

These columns are placed BEFORE the constraint definition, which is unusual but not necessarily wrong.

### Logic Confusion

#### Variable Name Collision

| Variable | Used For | Should Be |
|----------|----------|-----------|
| `membershipDiscount` | Both automatic tier discount AND shine points redemption | `automaticMembershipDiscount` |
| `pointsDiscount` | Referral points redemption | `referralPointsDiscount` |
| (missing) | Shine points redemption | `shinePointsDiscount` |

---

## Recommended Fix Priority

### Immediate (Critical)
1. **Fix Bug #3** - Points not decreasing (UI sync issue)
2. **Implement Bug #1** - Award shine points after transaction

### High (Important)
3. **Fix Bug #2** - Separate membership discount from shine points redemption

### Medium (Technical Debt)
4. Add foreign key constraint for `orders.membership_level_id`
5. Rename variables to be more descriptive
6. Create unified "Discount Service" to handle all discount types

---

## Migration Required

A new migration is needed to:
1. Add `shine_points_discount_amount` column to `orders` table
2. Add foreign key constraint for `orders.membership_level_id`
3. Create trigger or function to award shine points after transaction

---

## Testing Checklist

Before executing fixes:
- [ ] Verify `customer_points` table structure
- [ ] Verify `customer_memberships.shine_points` column exists
- [ ] Check if `update_membership_on_order_completion` trigger is enabled
- [ ] Test referral points redemption flow
- [ ] Test shine points redemption flow
- [ ] Verify invoice displays correctly for all discount combinations

---

## Files Requiring Changes

### High Priority
1. `src/stores/cartStore.ts` - Add shine points awarding logic
2. `src/components/Cart/ShinePointsRedemption.tsx` - Fix variable collision
3. `src/components/Cart/PointsRedemption.tsx` - Refresh balance after redemption

### Medium Priority
4. `migrations/015_fix_membership_points_system.sql` - Create new migration
5. `src/lib/client-services.ts` - Separate discount types
6. `src/components/Tracking/InvoiceItems.tsx` - Update invoice display

---

## Conclusion

All three bugs stem from incomplete implementation of the membership feature:
- **Bug #1**: Shine points earning was never implemented
- **Bug #2**: Variable naming collision between discount types
- **Bug #3**: UI state not refreshing after database update

The database schema is mostly correct, but the application logic needs to be completed.
