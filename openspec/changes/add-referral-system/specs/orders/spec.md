## MODIFIED Requirements

### Requirement: Order Creation Process
The system SHALL process orders with optional referral code and points redemption.

#### Scenario: Order with referral code
- **WHEN** a customer creates an order with a valid referral code
- **THEN** the system validates the referral code
- **AND** applies the referral discount to the order total
- **AND** records the referral code usage
- **AND** awards points to the referrer

#### Scenario: Order with points redemption
- **WHEN** a customer creates an order and chooses to redeem points
- **THEN** the system validates the customer has sufficient points (minimum 50)
- **AND** applies the points discount to the order total
- **AND** deducts the redeemed points from the customer's balance
- **AND** records the points redemption transaction

#### Scenario: Order with both referral code and points
- **WHEN** a customer creates an order with both a referral code and points redemption
- **THEN** the system processes the referral code first
- **AND** then applies points redemption to the remaining balance
- **AND** ensures both discounts are properly recorded

#### Scenario: Order processing failure
- **WHEN** order processing fails after referral or points discounts are applied
- **THEN** the system rolls back any points deductions
- **AND** refunds any awarded referral points
- **AND** marks the referral code as unused if applicable