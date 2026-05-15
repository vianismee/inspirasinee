# Point System Redesign Report

**Date**: 2026-02-19
**Status**: Design Review

## Current System Analysis

### Existing Point Calculation Method

**Current Formula** (in `award_shine_points_after_order()` function):
```sql
-- Current: Points based on transaction amount
v_shine_points_to_award := FLOOR(v_subtotal / 1000.0 * v_points_multiplier);
```

**How it works**:
- 1 point for every Rp 1.000 spent
- Multiplied by `points_multiplier` from membership level
  - Bronze: 1.0x (1 point per Rp 1.000)
  - Silver: 1.2x (1.2 points per Rp 1.000)
  - Gold: 1.5x (1.5 points per Rp 1.000)

**Example**:
- Transaction of Rp 50.000
- Bronze customer: 50 points
- Silver customer: 60 points
- Gold customer: 75 points

### Current Schema

**`customer_membership_levels` table**:
```sql
- id
- name (Bronze/Silver/Gold)
- level_index (1/2/3)
- points_multiplier (1.0, 1.2, 1.5) ← Used for amount-based calculation
- discount_percent
- discount_max_amount
- transaction_threshold
- is_active
```

---

## Proposed New System

### Requirements
1. Every transaction earns fixed points based on membership level
2. Admin can configure points per transaction for each level
3. Not dependent on transaction amount

### Example Configuration
| Level | Points Per Transaction |
|-------|------------------------|
| Bronze | 1 point |
| Silver | 2 points |
| Gold | 3 points |

---

## Implementation Plan

### Option A: Replace Existing System (Recommended)

**Changes Required**:

1. **Schema Migration**:
   - Rename `points_multiplier` → `points_per_transaction` (or add new column)
   - Change data type from `NUMERIC(5,2)` → `INTEGER`
   - Update default values:
     - Bronze: 1
     - Silver: 2
     - Gold: 3

2. **Trigger Function Update** (`award_shine_points_after_order()`):
   ```sql
   -- New formula: Fixed points per transaction
   v_shine_points_to_award := v_points_per_transaction;
   ```

3. **UI Updates**:
   - Admin membership page: Change "Points Multiplier" field to "Points Per Transaction"
   - Input type: Number (integer) instead of decimal
   - Label: "Points earned per transaction"

### Option B: Hybrid System (Both Methods)

**Changes Required**:

1. **Schema**:
   - Keep `points_multiplier` (amount-based)
   - Add new column `points_per_transaction` (transaction-based)

2. **Trigger Function**:
   ```sql
   -- Award points per transaction (fixed amount)
   v_shine_points_to_award := v_points_per_transaction;

   -- Optionally add both:
   -- v_shine_points_to_award := v_points_per_transaction + FLOOR(v_subtotal / 1000.0 * v_points_multiplier);
   ```

3. **UI**:
   - Two separate fields in admin panel
   - Toggle to choose which calculation method to use

### Option C: Configuration-Based

**Changes Required**:

1. **Schema**:
   - Add `points_calculation_method` enum: `'amount_based' | 'transaction_based'`
   - Keep both columns or use one with different logic

2. **Trigger Function**:
   - Check calculation method and apply appropriate formula

3. **UI**:
   - Admin can switch between calculation methods
   - Relevant fields shown based on selection

---

## Impact Analysis

### Files Requiring Changes

#### Database (Migration Required)
- `migrations/016_points_per_transaction.sql` - NEW migration
- `schema.sql` - Update default values

#### Backend/Database
- `award_shine_points_after_order()` function - Update calculation logic

#### Frontend Admin
- `src/components/Membership/MembershipTable.tsx` - Update form field
- `src/types/membership.ts` - Update type definitions

#### Benefits Display
- `migrations/007_membership_tables.sql` - Update benefit descriptions
- Lines 197-198: "Earn 1 point for every Rp 1.000 spent"
  → Change to: "Earn 1 point for every transaction"

---

## Recommendation

**I recommend Option A (Replace Existing System)** because:

1. **Simplicity**: Single, clear point calculation method
2. **Predictability**: Customers know exactly what they'll earn
3. **Admin Control**: Easy to understand and configure
4. **Performance**: Simpler calculation logic

### Migration Steps for Option A:

1. **Create migration** that:
   - Adds `points_per_transaction INTEGER` column
   - Migrates existing `points_multiplier` values to new system
   - Drops `points_multiplier` column (or keeps for historical data)

2. **Update trigger** to use new calculation

3. **Update UI** to show "Points Per Transaction" field

4. **Update benefit descriptions** to reflect new system

---

## Questions for Approval

1. **Should points be awarded ONLY for completed orders, or also for orders in other statuses?**
   - Current: All orders except 'pending' or 'cancelled'
   - Consider: Should 'ongoing' or 'finished' orders earn points?

2. **What happens to existing shine points balances when switching systems?**
   - Keep existing balances?
   - Reset all to 0?
   - Apply a conversion formula?

3. **Should points be retroactively awarded for past transactions?**
   - Re-calculate all historical orders with new system?
   - Start fresh from migration date?

4. **Edge case**: What if a customer completes multiple orders in one day?
   - Earn points for each transaction? (Recommended)
   - Limit points per day?

5. **Should the "Shine Points Settings" in admin show this new configuration?**
   - Update the description to clarify it's per transaction
   - Example: "Bronze members earn 1 point per transaction"

---

## Proposed Migration Script (for Review)

```sql
-- Migration 016: Change to Points Per Transaction System

-- 1. Add new column
ALTER TABLE public.customer_membership_levels
ADD COLUMN points_per_transaction INTEGER NOT NULL DEFAULT 1;

-- 2. Set default values based on current levels
UPDATE public.customer_membership_levels
SET points_per_transaction = CASE
  WHEN level_index = 1 THEN 1  -- Bronze: 1 point
  WHEN level_index = 2 THEN 2  -- Silver: 2 points
  WHEN level_index = 3 THEN 3  -- Gold: 3 points
END;

-- 3. (Optional) Drop old column after migration
-- ALTER TABLE public.customer_membership_levels DROP COLUMN points_multiplier;

-- 4. Update the award function
CREATE OR REPLACE FUNCTION public.award_shine_points_after_order()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id TEXT;
  v_membership_level_id BIGINT;
  v_points_per_transaction INTEGER;
  v_current_shine_points INTEGER;
BEGIN
  -- Only proceed for NEW orders that are NOT 'pending' or 'cancelled'
  IF NEW.status IN ('pending', 'cancelled') THEN
    RETURN NEW;
  END IF;

  -- Don't award points twice on UPDATE
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT NULL AND OLD.status NOT IN ('pending', 'cancelled') THEN
    RETURN NEW;
  END IF;

  v_customer_id := NEW.customer_id;

  -- Get customer's membership level and points per transaction
  SELECT
    cm.membership_level_id,
    cml.points_per_transaction,
    cm.shine_points
  INTO v_membership_level_id, v_points_per_transaction, v_current_shine_points
  FROM public.customer_memberships cm
  INNER JOIN public.customer_membership_levels cml ON cm.membership_level_id = cml.id
  WHERE cm.customer_id = v_customer_id;

  -- If no membership record, create one with Bronze level
  IF v_membership_level_id IS NULL THEN
    INSERT INTO public.customer_memberships (customer_id, membership_level_id, shine_points, total_transactions)
    VALUES (v_customer_id, (SELECT id FROM public.customer_membership_levels WHERE level_index = 1), 0, 0)
    RETURNING membership_level_id INTO v_membership_level_id;

    SELECT points_per_transaction INTO v_points_per_transaction
    FROM public.customer_membership_levels
    WHERE id = v_membership_level_id;

    v_current_shine_points := 0;
  END IF;

  -- Award points per transaction (fixed amount)
  IF v_points_per_transaction > 0 THEN
    -- Update customer's shine points balance
    UPDATE public.customer_memberships
    SET shine_points = shine_points + v_points_per_transaction,
        updated_at = NOW()
    WHERE customer_id = v_customer_id;

    -- Record the transaction in points_transactions
    INSERT INTO public.points_transactions (
      customer_id,
      transaction_type,
      points_change,
      balance_after,
      reference_type,
      reference_id,
      description
    )
    SELECT
      v_customer_id,
      'shine_points_earned',
      v_points_per_transaction,
      shine_points,
      'order',
      NEW.invoice_id,
      'Shine points earned from order ' || NEW.invoice_id || ' (' || cml.name || ' member)'
    FROM public.customer_memberships cm
    INNER JOIN public.customer_membership_levels cml ON cm.membership_level_id = cml.id
    WHERE cm.customer_id = v_customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Approval Required

Before implementing, please confirm:

- [ ] **Option Selection**: Which option do you prefer? (A, B, or C)
- [ ] **Default Values**: Bronze=1, Silver=2, Gold=3?
- [ ] **Existing Points**: What to do with current shine point balances?
- [ ] **Historical Orders**: Re-calculate or start fresh?
- [ ] **Order Status**: Which statuses should award points?
- [ ] **Timing**: When should this migration be deployed?

---

## Next Steps After Approval

1. Create final migration file
2. Update database schema.sql
3. Update admin UI components
4. Update benefit descriptions
5. Test with sample data
6. Deploy migration
7. Verify points are being awarded correctly
