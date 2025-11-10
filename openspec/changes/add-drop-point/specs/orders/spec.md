## ADDED Requirements

### Requirement: Drop-Point Order Type
The system SHALL support a new order type called "drop-point" with specialized fulfillment workflow and item management.

#### Scenario: Creating drop-point order
- **WHEN** a customer selects drop-point as fulfillment method
- **THEN** the system presents the drop-point order form with combined order and cart functionality

#### Scenario: Drop-point order identification
- **WHEN** a drop-point order is created
- **THEN** the system marks the customer with drop-point identifier for tracking purposes

### Requirement: Item Numbering System
The system SHALL assign unique sequential numbers to each item within a drop-point order for tracking purposes.

#### Scenario: Item numbering assignment
- **WHEN** items are added to a drop-point order
- **THEN** each item receives a sequential number (Item 1, Item 2, etc.) within that order

#### Scenario: Maximum capacity enforcement
- **WHEN** a drop-point order reaches 40 pairs
- **THEN** the system prevents adding additional items and displays capacity limit message

### Requirement: Drop-Point Order Form
The system SHALL provide a specialized order form combining Order Form and Cart Form functionality with manual item entry for drop-point specific features.

#### Scenario: Form initialization
- **WHEN** the drop-point form is accessed
- **THEN** the system displays customer information fields, manual item name input, color options, and sizing inputs

#### Scenario: Manual item entry
- **WHEN** adding items to drop-point order
- **THEN** the system requires manual shoe name input followed by color selection, size input, and automatic add-on application per item

#### Scenario: Cart-like input flow
- **WHEN** customers configure multiple items
- **THEN** the system provides cart-style interface with manual name entry for each item

### Requirement: Drop-Point Fulfillment Workflow
The system SHALL manage drop-point order completion when items return to the drop-point location.

#### Scenario: Drop-point return confirmation
- **WHEN** all items in a drop-point order are returned to the drop-point location
- **THEN** the system updates order status to completed and finalizes item numbering

## MODIFIED Requirements

### Requirement: Order Processing Service
The order processing service SHALL support multiple fulfillment methods including drop-point with specialized workflow handling through direct database operations.

#### Scenario: Multi-method order handling
- **WHEN** processing any order through the service layer
- **THEN** the service routes orders based on fulfillment method (standard, drop-point, etc.)

#### Scenario: Drop-point specific processing
- **WHEN** processing a drop-point order through the service
- **THEN** the service applies item numbering, customer marking, and capacity management rules