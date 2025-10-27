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

### Requirement: Secure Customer Dashboard Access
The system SHALL provide secure guest access to customer referral dashboards using phone-only verification with hashed paths.

#### Scenario: Customer enters phone number
- **WHEN** a customer enters their phone number on the verification page
- **THEN** the system validates the phone number exists in customer records
- **AND** generates a secure hash for the phone number
- **AND** redirects to the hashed dashboard path (e.g., /hYidasnuiwqeUsj)
- **AND** logs the successful verification

#### Scenario: Customer accesses hashed dashboard path
- **WHEN** a customer navigates to a valid hashed dashboard path
- **THEN** the system validates the hash against stored phone numbers
- **AND** checks if the link is within 15 minutes of creation
- **AND** displays their current points balance
- **AND** shows transaction history (points earned/redeemed)
- **AND** displays their personal referral code with copy functionality
- **AND** shows basic profile information
- **AND** presents information in mobile-first responsive design

#### Scenario: Phone input UI design consistency
- **WHEN** a customer accesses the phone verification page
- **THEN** the system displays the same UI pattern as tracking page
- **AND** uses centered card layout with gradient background
- **AND** includes the Logo component with consistent styling
- **AND** provides mobile-optimized input field with Indonesian placeholder text
- **AND** displays search icon button matching tracking page design

#### Scenario: Hashed link expires
- **WHEN** a customer tries to access a hashed path after 15 minutes
- **THEN** the system displays an expired link message
- **AND** redirects them to phone verification page

#### Scenario: Invalid phone number
- **WHEN** a customer enters a phone number not found in customer records
- **THEN** the system displays an error message
- **AND** applies rate limiting for failed attempts
- **AND** prevents enumeration attacks

#### Scenario: Hashed path security
- **WHEN** generating hashed paths from phone numbers
- **THEN** the system uses cryptographically secure hashing
- **AND** ensures hashes cannot be reverse-engineered to phone numbers
- **AND** generates unique hashes for each session

### Requirement: Mobile-First Dashboard Design
The system SHALL provide a mobile-first responsive dashboard interface that follows the tracking page design patterns.

#### Scenario: Mobile-optimized dashboard layout
- **WHEN** a customer views their referral dashboard on mobile
- **THEN** the system displays information in vertical card layout
- **AND** uses touch-friendly buttons and interactive elements
- **AND** presents points balance prominently at the top
- **AND** shows referral code with easy-to-use copy button
- **AND** displays transaction history in scrollable mobile format

#### Scenario: Responsive design for larger screens
- **WHEN** a customer views the dashboard on desktop/tablet
- **THEN** the system maintains mobile-first layout with appropriate max-width
- **AND** uses consistent spacing and typography from tracking page
- **AND** ensures all interactive elements remain easily accessible

#### Scenario: Indonesian language consistency
- **WHEN** displaying text and placeholder content
- **THEN** the system uses Indonesian language consistently
- **AND** matches the tone and style from tracking page
- **AND** provides clear, mobile-friendly labels and instructions

### Requirement: Dashboard Security and Privacy
The system SHALL protect customer data and prevent unauthorized access to referral dashboards.

#### Scenario: Phone number privacy protection
- **WHEN** processing phone numbers
- **THEN** the system never exposes phone numbers in URLs or client-side code
- **AND** only uses phone numbers for database validation
- **AND** implements hash generation to obscure phone numbers in paths

#### Scenario: Hash generation security
- **WHEN** creating hashed paths from phone numbers
- **THEN** the system uses cryptographically secure random hash generation
- **AND** includes timestamp for 15-minute expiry
- **AND** ensures hashes cannot be predicted or reverse-engineered
- **AND** generates unique hash for each access request

#### Scenario: Rate limiting and abuse prevention
- **WHEN** validating phone numbers
- **THEN** the system implements rate limiting for failed attempts
- **AND** prevents phone number enumeration attacks
- **AND** temporarily blocks suspicious IP addresses

#### Scenario: Access audit logging
- **WHEN** any customer accesses their dashboard
- **THEN** the system logs IP address, timestamp, and phone hash
- **AND** maintains audit trail for security monitoring
- **AND** tracks successful and failed access attempts

#### Scenario: Link expiry and cleanup
- **WHEN** hashed links expire after 15 minutes
- **THEN** the system automatically removes expired hash mappings
- **AND** prevents access to expired links
- **AND** requires phone re-verification for new access