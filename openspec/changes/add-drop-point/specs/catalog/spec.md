## ADDED Requirements

### Requirement: Color-Based Add-On Logic
The system SHALL automatically apply add-on services based on item color selection.

#### Scenario: White shoe automatic add-on
- **WHEN** a customer selects white color for a shoe item
- **THEN** the system automatically adds White Treatment service to the item configuration

#### Scenario: Add-on service pricing
- **WHEN** add-on services are automatically applied
- **THEN** the system includes add-on pricing in the total item cost calculation

### Requirement: Item Color Customization
The system SHALL provide color selection options for individual items within orders.

#### Scenario: Color selection interface
- **WHEN** configuring items in drop-point order
- **THEN** the system displays available color options for each item type

#### Scenario: Color-based price calculation
- **WHEN** color selection affects pricing
- **THEN** the system updates item price in real-time based on color and add-on logic

### Requirement: Sizing Information Collection
The system SHALL collect and store sizing information for each item in drop-point orders.

#### Scenario: Size input per item
- **WHEN** adding items to drop-point order
- **THEN** the system requires size specification for each individual item

#### Scenario: Size validation
- **WHEN** size information is entered
- **THEN** the system validates size availability and format for the item type

## MODIFIED Requirements

### Requirement: Price Catalog Service
The price catalog service SHALL support dynamic pricing based on color selection and automatic add-ons through business logic services.

#### Scenario: Dynamic price calculation
- **WHEN** calculating item prices through the pricing service
- **THEN** the service considers base price, color modifiers, and automatic add-ons

#### Scenario: Price catalog updates
- **WHEN** price catalog rules are modified in the service
- **THEN** the service applies changes to both standard and drop-point order pricing

### Requirement: Product Configuration Service
The product configuration service SHALL support manual shoe name input with color and size variations through direct configuration logic.

#### Scenario: Manual shoe name input
- **WHEN** customers enter shoe name through the configuration service
- **THEN** the service accepts free-text input for shoe model/name

#### Scenario: Variant configuration
- **WHEN** customers configure items through the service
- **THEN** the service presents available color and size options for the entered shoe name

#### Scenario: Configuration validation
- **WHEN** product configuration is submitted through the service
- **THEN** the service validates size availability and color compatibility for the entered shoe name