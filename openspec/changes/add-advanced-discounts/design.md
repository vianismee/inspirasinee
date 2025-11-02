## Context

The current discount system supports basic fixed amount and percentage discounts but lacks advanced features needed for business growth. The system needs to support:
- Time-limited promotional campaigns (e.g., "Halloween Sale")
- Quantity-based tiered pricing (e.g., "3 pairs for 85k, 5 pairs for 40k")
- Discount codes with optional usage (e.g., "INSPACE" for 5k off)
- Combination rules to control discount stacking
- All implementation must be client-side using existing Supabase and Zustand architecture

## Goals / Non-Goals

**Goals:**
- Implement comprehensive discount management system
- Support multiple discount types with complex business rules
- Maintain client-side only architecture
- Provide real-time validation and calculation
- Create intuitive admin and customer interfaces
- Ensure backward compatibility with existing discount data

**Non-Goals:**
- Server-side rendering or API endpoints
- Complex machine learning discount recommendations
- Integration with external discount platforms
- Multi-tenant discount management

## Decisions

### Database Schema Design
**Decision**: Extend existing discount table rather than create new discount types table
**Rationale**: Maintains backward compatibility, simpler queries, follows existing pattern

**Schema Changes:**
```sql
-- Extended discount table
ALTER TABLE discount ADD COLUMN type text DEFAULT 'simple';
ALTER TABLE discount ADD COLUMN code text;
ALTER TABLE discount ADD COLUMN starts_at timestamp;
ALTER TABLE discount ADD COLUMN expires_at timestamp;
ALTER TABLE discount ADD COLUMN is_combinable boolean DEFAULT true;
ALTER TABLE discount ADD COLUMN max_uses integer;
ALTER TABLE discount ADD COLUMN usage_count integer DEFAULT 0;
ALTER TABLE discount ADD COLUMN max_discount_amount integer;

-- New discount_tiers table for quantity-based pricing
CREATE TABLE discount_tiers (
  id serial PRIMARY KEY,
  discount_id integer REFERENCES discount(id) ON DELETE CASCADE,
  min_quantity integer NOT NULL,
  max_quantity integer,
  price_per_item integer NOT NULL,
  created_at timestamp DEFAULT NOW()
);

-- New discount_combination_rules table
CREATE TABLE discount_combination_rules (
  id serial PRIMARY KEY,
  discount_id integer REFERENCES discount(id) ON DELETE CASCADE,
  incompatible_discount_id integer REFERENCES discount(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT NOW()
);
```

### Client-Side Architecture
**Decision**: Use existing Zustand stores and Supabase real-time subscriptions
**Rationale**: Proven pattern in codebase, maintains consistency, no additional dependencies

**Store Enhancements:**
```typescript
// Enhanced Discount interface
interface Discount {
  id: number;
  label: string;
  type: 'simple' | 'quantity' | 'code';
  amount: number | null;
  percent: number | null;
  code?: string;
  starts_at?: string;
  expires_at?: string;
  is_combinable: boolean;
  max_uses?: number;
  usage_count: number;
  max_discount_amount?: number;
  tiers?: DiscountTier[];
  incompatible_discounts?: number[];
}

interface DiscountTier {
  id: number;
  discount_id: number;
  min_quantity: number;
  max_quantity?: number;
  price_per_item: number;
}
```

### Discount Calculation Strategy
**Decision**: Implement priority-based discount application with validation layers
**Rationale**: Predictable behavior, prevents unexpected discount stacking, easy to debug

**Application Order:**
1. **Validation Layer**: Check expiration, usage limits, combination rules
2. **Quantity-based Discounts**: Applied first to eligible items
3. **Cart-level Discounts**: Applied to remaining subtotal
4. **Percentage Discounts**: Applied with maximum amount caps if specified
5. **Fixed Amount Discounts**: Applied after percentage discounts
6. **Final Validation**: Ensure minimum cart requirements met

**Maximum Discount Calculation:**
- When percentage discount has `max_discount_amount` set
- Calculate percentage discount normally
- Apply cap: `discountValue = Math.min(percentageDiscount, max_discount_amount)`
- Display both calculated percentage and capped amount to customers
- Example: 10% of Rp. 50,000 = Rp. 5,000, but with max Rp. 2,000 cap = Rp. 2,000

### UI/UX Design
**Decision**: Extend existing Shadcn/ui components with new forms and displays
**Rationale**: Consistent design system, faster development, familiar user experience

## Risks / Trade-offs

### Performance Risks
- **Complex Calculations**: Multiple discounts with quantity tiers could impact cart performance
  **Mitigation**: Implement efficient calculation caching, limit active discounts per cart
- **Real-time Updates**: Increased Supabase subscription load
  **Mitigation**: Batch updates, debounce validation calls

### Complexity Risks
- **Discount Combination Logic**: Complex rules may confuse users
  **Mitigation**: Clear UI indicators, help text, and validation feedback
- **Admin Interface Complexity**: Many new fields and options
  **Mitigation**: Progressive disclosure, guided workflows, templates

### Data Migration Risks
- **Existing Discount Data**: Schema changes may affect current discounts
  **Mitigation**: Careful migration scripts, backward compatibility, thorough testing

### Trade-offs
- **Flexibility vs Simplicity**: More discount types increase complexity but provide business value
- **Real-time vs Performance**: Live validation is user-friendly but requires optimization
- **Client-side vs Scalability**: Client-side architecture limits future scaling but meets current needs

## Migration Plan

### Phase 1: Database Schema Updates
1. Create migration scripts for new tables and fields
2. Set default values for existing discounts
3. Test with development database
4. Plan rollback procedure

### Phase 2: Core Logic Implementation
1. Update TypeScript interfaces
2. Implement new calculation logic
3. Add validation layers
4. Test with existing discount data

### Phase 3: UI Updates
1. Update admin interface progressively
2. Enhance customer interface
3. Add validation feedback
4. Test user workflows

### Phase 4: Testing and Rollout
1. Comprehensive testing of all discount scenarios
2. Performance testing with complex discount combinations
3. User acceptance testing with admin team
4. Gradual rollout with monitoring

## Open Questions

- **Discount Priority**: How should conflicting discounts be resolved when multiple apply?
- **Usage Tracking**: Should discount usage be tracked per user or globally?
- **Notification System**: Should customers be notified when discounts are about to expire?
- **Analytics**: What discount performance metrics should be tracked for business insights?
- **Template System**: Should common discount configurations be available as templates for admins?