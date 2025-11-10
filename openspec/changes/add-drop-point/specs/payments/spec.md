## ADDED Requirements

### Requirement: QRIS-Only Payment for Drop-Point
The system SHALL enforce QRIS as the exclusive payment method for drop-point orders.

#### Scenario: Payment method restriction
- **WHEN** a customer proceeds to payment for a drop-point order
- **THEN** only QRIS payment options are displayed and selectable

#### Scenario: Payment method validation
- **WHEN** attempting to process non-QRIS payment for drop-point order
- **THEN** the system rejects the payment and displays QRIS requirement message

### Requirement: QRIS Payment Integration
The system SHALL provide seamless QRIS payment processing for drop-point orders.

#### Scenario: QRIS code generation
- **WHEN** drop-point order payment is initiated
- **THEN** the system generates and displays QRIS QR code for payment

#### Scenario: Payment confirmation
- **WHEN** QRIS payment is successfully completed
- **THEN** the system confirms payment and updates drop-point order status

## MODIFIED Requirements

### Requirement: Payment Processing Service
The payment processing service SHALL support method restrictions based on order type through direct business logic implementation.

#### Scenario: Order type payment routing
- **WHEN** processing payment for any order through the service
- **THEN** the service filters available payment methods based on order fulfillment type

#### Scenario: Payment validation logic
- **WHEN** validating payment method selection through the service
- **THEN** the service checks compatibility with order type and fulfillment method