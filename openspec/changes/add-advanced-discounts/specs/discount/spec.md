## ADDED Requirements

### Requirement: Expirable Discount Campaigns
The system SHALL support time-limited discount campaigns with start and end dates.

#### Scenario: Active date range validation
- **WHEN** a discount has starts_at and expires_at dates
- **THEN** the discount is only applicable within the specified date range
- **AND** current date/time is checked in real-time on client-side

#### Scenario: Upcoming discount display
- **WHEN** a discount's starts_at date is in the future
- **THEN** the discount is shown as "upcoming" in admin interface
- **AND** cannot be applied by customers until start date

#### Scenario: Expired discount handling
- **WHEN** a discount's expires_at date has passed
- **THEN** the discount is automatically marked as inactive
- **AND** is removed from available customer discounts
- **AND** appears as "expired" in admin interface

### Requirement: Discount Code System
The system SHALL support optional discount codes that customers must enter to apply discounts.

#### Scenario: Code-based discount application
- **WHEN** a customer enters a valid discount code
- **THEN** the corresponding discount is applied to their cart
- **AND** the discount is validated for expiration and usage limits

#### Scenario: Invalid code handling
- **WHEN** a customer enters an invalid or expired discount code
- **THEN** a clear error message is displayed
- **AND** the discount is not applied to the cart

#### Scenario: Optional code functionality
- **WHEN** a discount does not have a code
- **THEN** the discount can be applied directly without code entry
- **AND** appears in available discounts list

### Requirement: Maximum Discount Amount Caps
The system SHALL support maximum discount amount limits for percentage-based discounts.

#### Scenario: Percentage discount with maximum cap
- **WHEN** a percentage discount has max_discount_amount specified
- **THEN** the discount calculation is capped at the maximum amount
- **AND** customer receives the lesser of percentage calculation or maximum amount
- **AND** display shows both percentage and capped amount for transparency

#### Scenario: Cap calculation example
- **WHEN** 10% discount is applied to Rp. 50,000 cart with max Rp. 2,000 cap
- **THEN** calculated percentage discount would be Rp. 5,000
- **AND** applied discount is capped at Rp. 2,000
- **AND** customer pays Rp. 48,000 instead of Rp. 45,000

#### Scenario: Maximum cap not reached
- **WHEN** percentage discount calculation is below the maximum cap
- **THEN** full percentage discount is applied without capping
- **AND** system continues to next discount calculation

#### Scenario: Admin configuration of maximum caps
- **WHEN** creating percentage discounts
- **THEN** admin can optionally specify maximum discount amount
- **AND** maximum cap field is only relevant when discount type is percentage
- **AND** validation ensures maximum amount is positive when specified

### Requirement: Quantity-Based Tiered Pricing
The system SHALL support quantity-based pricing with multiple tiers for the same discount.

#### Scenario: Tier pricing calculation
- **WHEN** a cart contains eligible items meeting tier quantity requirements
- **THEN** the appropriate tier price is applied per item
- **AND** higher quantity tiers provide better per-item pricing

#### Scenario: Mixed quantity tiers
- **WHEN** a discount has multiple tiers (3 pairs for 85k, 5 pairs for 40k)
- **THEN** the system applies the best applicable tier based on total quantity
- **AND** calculates total discount based on tier price vs original price

#### Scenario: Tier validation
- **WHEN** setting up quantity tiers
- **THEN** each tier must have minimum quantity and price
- **AND** higher quantity tiers must have better per-item pricing
- **AND** tier quantities cannot overlap

### Requirement: Discount Combination Rules
The system SHALL support rules to control which discounts can be combined together.

#### Scenario: Combinable discounts
- **WHEN** multiple discounts are marked as combinable
- **THEN** they can be applied together in the same cart
- **AND** total discount is calculated according to priority rules

#### Scenario: Exclusive discounts
- **WHEN** a discount is marked as non-combinable
- **THEN** it cannot be applied with other discounts
- **AND** customers must choose between exclusive discounts

#### Scenario: Incompatible discount pairs
- **WHEN** specific discounts are marked as incompatible
- **THEN** they cannot be applied together
- **AND** system shows clear messaging about combination restrictions

### Requirement: Usage Limits and Tracking
The system SHALL support usage limits for discounts and track current usage.

#### Scenario: Maximum usage enforcement
- **WHEN** a discount reaches its max_uses limit
- **THEN** the discount becomes unavailable for new applications
- **AND** displays as "usage limit reached" in admin interface

#### Scenario: Real-time usage tracking
- **WHEN** a discount is applied to an order
- **THEN** the usage_count is incremented in real-time
- **AND** all clients see updated availability immediately

#### Scenario: Unlimited usage discounts
- **WHEN** a discount has no max_uses specified
- **THEN** the discount can be used without limit
- **AND** usage_count continues to track total applications

### Requirement: Advanced Discount Types
The system SHALL support multiple discount types beyond simple amount and percentage.

#### Scenario: Quantity discount type
- **WHEN** creating a quantity-based discount
- **THEN** admin can configure multiple pricing tiers
- **AND** discount is applied based on item quantity in cart

#### Scenario: Code discount type
- **WHEN** creating a code-based discount
- **THEN** admin must specify a unique discount code
- **AND** discount requires code entry for application

#### Scenario: Simple discount type
- **WHEN** creating a simple discount
- **THEN** system behaves like current implementation
- **AND** supports both amount and percentage types

### Requirement: Real-time Discount Validation
The system SHALL validate all discount rules in real-time on the client-side.

#### Scenario: Cart validation
- **WHEN** cart contents change
- **THEN** all applied discounts are re-validated immediately
- **AND** invalid discounts are automatically removed
- **AND** customer sees updated pricing instantly

#### Scenario: Expiration checking
- **WHEN** current time crosses discount expiration
- **THEN** expired discounts are automatically removed from carts
- **AND** admin interface updates discount status
- **AND** customers see notification about expired discounts

#### Scenario: Combination rule validation
- **WHEN** a new discount is applied
- **THEN** system checks compatibility with existing discounts
- **AND** prevents incompatible combinations
- **AND** shows clear messaging about restrictions

## MODIFIED Requirements

### Requirement: Discount Management Interface
The admin discount management interface SHALL support creating and managing all advanced discount types.

#### Scenario: Enhanced discount creation form
- **WHEN** admin creates a new discount
- **THEN** form includes fields for type, expiration dates, codes, and combination rules
- **AND** validation ensures all required fields are properly configured
- **AND** preview shows how discount will appear to customers

#### Scenario: Quantity tier management
- **WHEN** editing a quantity-based discount
- **THEN** admin interface shows all current tiers
- **AND** allows adding, editing, and removing tiers
- **AND** validates tier pricing logic (higher quantity = better price)

#### Scenario: Combination rule configuration
- **WHEN** setting discount combination rules
- **THEN** admin can mark discount as combinable or exclusive
- **AND** can specify incompatible discount pairs
- **AND** interface shows clear visual indicators of combination settings

### Requirement: Discount Application Logic
The discount calculation system SHALL support complex discount scenarios with proper prioritization.

#### Scenario: Multi-discount application order
- **WHEN** multiple discounts are applied to a cart
- **THEN** quantity-based discounts are applied first to eligible items
- **AND** percentage discounts are applied to remaining subtotal
- **AND** fixed amount discounts are applied last
- **AND** final total cannot be negative

#### Scenario: Discount conflict resolution
- **WHEN** incompatible discounts are selected
- **THEN** system prevents application and shows clear error message
- **AND** suggests alternative compatible discounts
- **AND** provides guidance on combination rules

#### Scenario: Real-time calculation updates
- **WHEN** any cart or discount parameter changes
- **THEN** all calculations are updated immediately
- **AND** customer sees accurate pricing in real-time
- **AND** admin interface reflects current discount impact

### Requirement: Customer Discount Interface
The customer-facing discount selection interface SHALL support all new discount types and validation.

#### Scenario: Discount code input
- **WHEN** customer views cart discounts
- **THEN** interface includes input field for discount codes
- **AND** validates codes in real-time
- **AND** shows success/error feedback immediately

#### Scenario: Available discounts display
- **WHEN** customer views available discounts
- **THEN** interface shows discount details, expiration, and combination restrictions
- **AND** clearly indicates which discounts can be combined
- **AND** shows quantity-based pricing tiers when applicable

#### Scenario: Applied discounts management
- **WHEN** customer has applied discounts
- **THEN** interface shows all active discounts with their impact
- **AND** allows easy removal of individual discounts
- **AND** displays clear pricing breakdown