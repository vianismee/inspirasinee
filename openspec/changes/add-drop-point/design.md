## Context
The drop-point feature introduces a new fulfillment method that combines order and cart functionality with specialized item tracking, color-based add-ons, and QRIS-only payments. This feature requires careful coordination between order management, payment processing, and catalog systems while maintaining the existing architecture.

## Goals / Non-Goals
### Goals
- Enable drop-point fulfillment with manual order entry
- Implement item numbering system for tracking (max 40 pairs)
- Create color-based automatic add-on logic (White Treatment)
- Enforce QRIS-only payments for drop-point orders
- Provide intuitive multi-item configuration interface
- Maintain capacity management for drop-point locations

### Non-Goals
- Complete redesign of existing order system
- Support for non-QRIS payment methods in drop-point
- Real-time inventory management
- Multi-location drop-point management (single location initially)

## Decisions

### Decision: Combined Order Form Approach
**What**: Create a unified DropPointOrderForm that merges Order Form and Cart Form functionality
**Why**: Simplified user experience for manual order entry; reduces cognitive load; allows item-wise configuration
**Alternatives considered**:
- Separate forms with synchronization (complex UX)
- Multi-step wizard (longer flow)
- Tab-based interface (context switching)

### Decision: Item Numbering Database Schema
**What**: Use sequential numbering per order stored in order_items table
**Why**: Simple to implement; maintains order association; easy to query and display
**Alternatives considered**:
- Global item numbering (complex; conflicts across orders)
- UUID-based tracking (non-user-friendly)
- Composite keys (overly complex for this use case)

### Decision: QRIS-Only Payment Enforcement
**What**: Validate payment method at order creation and enforce QRIS for drop-point orders
**Why**: Business requirement; simplifies payment processing; reduces fraud risk
**Alternatives considered**:
- Allow multiple methods with warnings (violates requirement)
- Conditional payment methods (adds complexity)
- Post-order payment method selection (breaks workflow)

### Decision: Color-Based Add-On Logic
**What**: Implement automatic White Treatment add-on when white color is selected
**Why**: Business rule automation; ensures service quality; reduces manual errors
**Alternatives considered**:
- Manual add-on selection (user error prone)
- Post-order add-on application (delayed processing)
- Optional add-on suggestion (service quality risk)

### Decision: Capacity Management Strategy
**What**: Enforce 40-pair maximum per drop-point location with real-time validation
**Why**: Space limitations; service quality; operational feasibility
**Alternatives considered**:
- Queue system (complex; delays)
- Multiple locations (over-engineering)
- No capacity limits (operational issues)

## Risks / Trade-offs

### Performance Risk: Real-time Price Calculation
**Risk**: Complex pricing logic with color-based add-ons may slow down form interaction
**Mitigation**: Implement client-side caching; debounced calculations; optimistic UI updates

### Integration Risk: Payment Method Restrictions
**Risk**: QRIS-only requirement may conflict with existing payment processing
**Mitigation**: Separate payment flows; clear error messaging; graceful fallbacks

### Data Integrity Risk: Item Numbering Consistency
**Risk**: Item numbers may become inconsistent if orders are modified
**Mitigation**: Immutable item numbers; audit logging; validation checks

### UX Risk: Complex Form Interface
**Risk**: Combined order and cart functionality may overwhelm users
**Mitigation**: Progressive disclosure; clear sections; visual grouping; help text

### Business Risk: Capacity Management
**Risk**: 40-pair limit may be too restrictive or too permissive
**Mitigation**: Configurable limits; monitoring; easy adjustment mechanism

## Migration Plan

### Phase 1: Database Schema Updates
1. Add new columns to existing tables (order_type, color, size)
2. Create new tables (item_numbering, add_on_services)
3. Run migration script with backward compatibility
4. Validate data integrity

### Phase 2: Backend Service Development
1. Implement drop-point order services with direct database operations
2. Create item numbering and capacity management services
3. Implement payment method validation logic
4. Add color-based add-on calculation services

### Phase 3: Frontend Implementation
1. Create new components alongside existing ones
2. Implement routing for drop-point orders
3. Integrate with existing state management
4. Add responsive design considerations

### Phase 4: Testing and Validation
1. Unit tests for new business logic
2. Integration tests for payment flow
3. End-to-end testing for complete order flow
4. Performance testing for real-time calculations

### Rollback Strategy
- Feature flags to disable drop-point functionality
- Database migration rollback scripts
- Service isolation for backward compatibility
- UI fallbacks to standard order form

## Open Questions

### Technical Architecture
- Should drop-point orders use existing order table or separate table?
- How to handle item numbering order if items are removed from order?
- What's the best approach for real-time capacity updates across multiple users?

### User Experience
- How to best present item numbering to users during order creation?
- Should capacity warnings be shown proactively or only at limit?
- What's the optimal flow for color selection with automatic add-ons?

### Business Logic
- How to handle partial returns in drop-point fulfillment?
- Should add-on services be configurable or always automatic?
- What happens when capacity is reached mid-order?

### Performance Considerations
- How to optimize price calculations with multiple items and add-ons?
- What caching strategy for color-based add-on rules?
- How to handle concurrent capacity updates?