## ADDED Requirements

### Requirement: Referral Code System
The system SHALL provide a referral code mechanism that rewards both referrers and new users with discounts and points.

#### Scenario: New user applies valid referral code
- **WHEN** a new user enters a valid referral code during order creation
- **THEN** the system applies the configured discount to their order
- **AND** the referrer earns points as configured by admin

#### Scenario: Invalid referral code
- **WHEN** a user enters an invalid or expired referral code
- **THEN** the system displays an appropriate error message
- **AND** no discount is applied

### Requirement: Points System
The system SHALL maintain a points balance for customers that can be redeemed for order discounts.

#### Scenario: Customer earns points from referral
- **WHEN** their referral code is successfully used by a new customer
- **THEN** the referrer's points balance increases by the configured amount
- **AND** the system logs the points transaction

#### Scenario: Customer redeems points
- **WHEN** a customer with at least 50 points chooses to redeem points
- **THEN** the system applies the configured discount to their order
- **AND** deducts the redeemed points from their balance

#### Scenario: Insufficient points for redemption
- **WHEN** a customer with less than 50 points attempts to redeem points
- **THEN** the system displays an error message
- **AND** prevents points redemption

### Requirement: Referral Settings Management
Admin users SHALL be able to configure referral system parameters.

#### Scenario: Admin configures referral settings
- **WHEN** an admin updates referral discount amount and referrer points
- **THEN** the system saves the new settings
- **AND** applies them to future referral transactions

#### Scenario: Admin sets points redemption rules
- **WHEN** an admin configures points redemption (minimum points, discount amount)
- **THEN** the system validates and saves the settings
- **AND** enforces the rules for future redemptions