## Why
The admin needs a dedicated interface to manage drop-point customers, track customer behavior, and generate reports. Currently there is no centralized way to view drop-point customer information, order history, or analytics across all drop-point locations.

## What Changes
- Add a new admin page for drop-point customer management
- Create a comprehensive customer table with filtering and search capabilities
- Implement customer reporting and analytics features
- Integrate with existing admin dashboard structure
- **BREAKING**: No breaking changes - this is additive functionality

## Impact
- Affected specs: New admin-drop-point-customer capability
- Affected code: New admin page at `/admin/drop-point/customers`, new components for customer table and reporting
- Dependencies: Uses existing drop-point database schema and customer data