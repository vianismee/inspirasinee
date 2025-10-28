## MODIFIED Requirements
### Requirement: Data Access Patterns
All data access SHALL use client-side Supabase browser client instead of server-side API routes.

#### Scenario: Customer data operations
- **WHEN** admin manages customer information
- **THEN** Supabase browser client directly queries customer tables
- **AND** RLS policies ensure only admin users can access customer data
- **AND** real-time updates are handled through Supabase subscriptions

#### Scenario: Order management
- **WHEN** admin creates, updates, or manages orders
- **THEN** Supabase browser client performs direct database operations
- **AND** order status changes are immediately reflected in UI
- **AND** related data (customers, services) is fetched through joins or separate queries

#### Scenario: Service catalog management
- **WHEN** admin manages service catalog
- **THEN** Supabase browser client directly manipulates service data
- **AND** service availability and pricing updates are immediate
- **AND** public pages access service data through client-side queries

#### Scenario: Discount system
- **WHEN** admin creates or manages discount codes
- **THEN** Supabase browser client handles discount CRUD operations
- **AND** discount validation happens client-side during checkout
- **AND** discount usage tracking is maintained through direct database operations

## ADDED Requirements
### Requirement: Row Level Security (RLS) Implementation
All database tables SHALL have comprehensive Row Level Security policies to protect data access.

#### Scenario: Admin data protection
- **WHEN** non-admin users attempt to access admin-only tables
- **THEN** RLS policies block unauthorized access attempts
- **AND** appropriate permission denied errors are returned
- **AND** audit logs track unauthorized access attempts

#### Scenario: Customer data privacy
- **WHEN** customers access their own data
- **THEN** RLS policies allow access only to their own records
- **AND** other customers' data is completely inaccessible
- **AND** data isolation is enforced at database level

#### Scenario: Public data access
- **WHEN** public pages access non-sensitive data (services, public tracking)
- **THEN** RLS policies allow read-only access to appropriate data
- **AND** sensitive information is filtered out by RLS policies
- **AND** public access does not compromise data security

### Requirement: Real-time Data Synchronization
The application SHALL use Supabase real-time subscriptions for live data updates.

#### Scenario: Live order status updates
- **WHEN** order status changes in database
- **THEN** all connected admin clients receive real-time updates
- **AND** UI automatically reflects new order status
- **AND** notifications are triggered for status changes

#### Scenario: Live tracking updates
- **WHEN** package tracking information is updated
- **THEN** customer tracking pages show real-time status
- **AND** public tracking pages update automatically
- **AND** push notifications are sent for major status changes

#### Scenario: Multi-user collaboration
- **WHEN** multiple admin users are working simultaneously
- **THEN** changes made by one user are immediately visible to others
- **AND** conflicting edits are handled gracefully
- **AND** user actions are synchronized across all sessions