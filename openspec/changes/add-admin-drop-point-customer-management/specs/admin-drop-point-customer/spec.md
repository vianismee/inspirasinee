## ADDED Requirements

### Requirement: Admin Drop-Point Customer Management
The system SHALL provide a comprehensive admin interface for managing drop-point customers with search, filtering, and reporting capabilities.

#### Scenario: View all drop-point customers
- **WHEN** admin navigates to `/admin/drop-point/customers`
- **THEN** display a table of all drop-point customers with customer details and order statistics

#### Scenario: Search and filter customers
- **WHEN** admin searches by customer name, WhatsApp, or customer marker
- **THEN** display filtered results matching the search criteria
- **WHEN** admin filters by drop-point location or date range
- **THEN** display customers matching the selected filters

#### Scenario: View customer details and order history
- **WHEN** admin clicks on a customer row
- **THEN** display detailed customer information including all drop-point orders, customer markers, and order history

#### Scenario: Generate customer reports
- **WHEN** admin requests customer analytics report
- **THEN** provide metrics including customer count, order frequency, revenue per customer, and drop-point distribution

#### Scenario: Export customer data
- **WHEN** admin exports customer data
- **THEN** generate downloadable CSV/Excel file with customer information and order statistics

### Requirement: Customer Data Table
The system SHALL display drop-point customers in a sortable, filterable data table with comprehensive customer information.

#### Scenario: Table displays customer information
- **WHEN** the customer table loads
- **THEN** display columns for customer name, WhatsApp, customer marker, total orders, total items, last order date, and preferred drop-point

#### Scenario: Sortable columns
- **WHEN** admin clicks column headers
- **THEN** sort the table by the selected column (ascending/descending)

#### Scenario: Pagination
- **WHEN** there are more than 50 customers
- **THEN** display pagination controls to navigate through customer data

### Requirement: Customer Analytics Dashboard
The system SHALL provide analytics and reporting functionality for drop-point customer insights.

#### Scenario: Overview metrics
- **WHEN** viewing the analytics dashboard
- **THEN** display total customers, active customers, average orders per customer, and total revenue

#### Scenario: Customer segmentation
- **WHEN** viewing customer analytics
- **THEN** categorize customers by frequency (new, regular, loyal) and display segment statistics

#### Scenario: Drop-point performance
- **WHEN** analyzing drop-point performance
- **THEN** show customer distribution across drop-point locations and customer retention rates per location

### Requirement: Integration with Existing Admin Interface
The system SHALL integrate seamlessly with the existing admin dashboard structure and navigation.

#### Scenario: Navigation integration
- **WHEN** admin navigates the admin interface
- **THEN** include drop-point customer management in the admin navigation menu

#### Scenario: Consistent design
- **WHEN** viewing the customer management interface
- **THEN** maintain design consistency with existing admin pages and components

#### Scenario: Permission control
- **WHEN** accessing customer management features
- **THEN** enforce admin authentication and authorization requirements