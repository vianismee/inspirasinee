## Context

This design document outlines the technical implementation of a customer referral system for the Inspirasinee service management platform. The system needs to handle referral code generation, validation, points management, and integration with the existing order workflow.

## Goals / Non-Goals

**Goals:**
- Implement a secure referral code system that prevents abuse
- Create a flexible points system with configurable redemption rules
- Provide comprehensive admin tools for managing referral programs
- Ensure proper integration with existing order and customer management
- Maintain data integrity and audit trails for all referral transactions

**Non-Goals:**
- Multi-level marketing or pyramid schemes
- Complex referral tier systems
- External API integrations for third-party referral services
- Real-time notification systems for referral events

## Decisions

### Database Schema Design

**Decision**: Use dedicated tables for referral management rather than extending existing customer table.

**Rationale**:
- Separation of concerns - referral logic is distinct from core customer data
- Easier to audit and maintain referral-specific data
- Allows for future expansion of referral features
- Better performance for referral-specific queries

### Referral Code Format

**Decision**: Use unique, non-guessable referral codes based on customer_id with random suffix.

**Rationale**:
- Prevents code enumeration attacks
- Maintains association with referrer
- Easy to generate and validate
- Short enough for practical use

### Points System Implementation

**Decision**: Implement points as integer values with configurable redemption rates.

**Rationale**:
- Simple and transparent for customers
- Easy to calculate and track
- Prevents floating-point precision issues
- Allows for flexible redemption rules

### Order Processing Integration

**Decision**: Process referral discounts before points redemption in order flow.

**Rationale**:
- Logical flow - external discount first, then customer loyalty benefits
- Prevents double-dipping or complex discount interactions
- Easier to calculate final order total
- Clear audit trail

## Risks / Trade-offs

### Security Risks

**Risk**: Referral code abuse or fraudulent usage
**Mitigation**:
- Unique, non-sequential code generation
- Usage limits and expiration policies
- IP tracking and anomaly detection
- Manual review for suspicious patterns

**Risk**: Points manipulation or redemption fraud
**Mitigation**:
- Immutable transaction logs
- Minimum balance requirements
- Admin approval for large redemptions
- Regular audit reports

### Performance Trade-offs

**Trade-off**: Additional database queries during order processing
**Impact**: Slight increase in order creation latency
**Mitigation**:
- Database indexing on referral code and customer_id
- Caching of referral settings
- Optimized query structures

### Complexity Trade-off

**Trade-off**: Increased system complexity with new features
**Impact**: More code to maintain and potential bugs
**Mitigation**:
- Modular, testable components
- Comprehensive error handling
- Clear separation of concerns
- Extensive logging and monitoring

## Migration Plan

### Phase 1: Database Schema
1. Create new tables in dev schema
2. Add columns to existing orders table
3. Create database indexes
4. Run data integrity checks

### Phase 2: Backend Implementation
1. Implement referral validation service
2. Create points management system
3. Update order processing logic
4. Add admin API endpoints

### Phase 3: Frontend Implementation
1. Build admin referral management interface
2. Add referral code input to order forms
3. Create customer points dashboard
4. Implement referral analytics

### Phase 4: Testing & Rollout
1. Comprehensive testing of all scenarios
2. User acceptance testing with admin users
3. Gradual rollout with feature flags
4. Monitor for issues and performance

### Rollback Plan
- Disable referral system via feature flag
- Database migrations are backwards compatible
- Order processing can fallback to pre-referral logic
- Points transactions can be reversed if needed

## Open Questions

1. Should referral codes have expiration dates?
2. Should there be limits on how many times a referral code can be used?
3. Should points expire after a certain time period?
4. How should referral discounts interact with other discount codes?
5. Should we implement referral tiers or bonus structures for high-performing referrers?