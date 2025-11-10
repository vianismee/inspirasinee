## Why
Enable a new fulfillment method called "drop-point" where customers can place orders manually through a specialized form that combines order and cart functionality, with unique item tracking, QRIS-only payments, color customization, automatic add-on services, and capacity-managed drop-off locations.

## What Changes
- **NEW**: Drop-point order type with specialized form combining Order Form and Cart Form capabilities
- **NEW**: Item numbering system for drop-point orders with maximum 40 pair capacity management
- **NEW**: Customer marking/identification system for drop-point orders
- **NEW**: QRIS-only payment restriction for drop-point orders
- **NEW**: Color selection per item in drop-point orders
- **NEW**: Automatic White Treatment add-on when white shoes are selected
- **NEW**: Sizing information collection per item
- **MODIFIED**: Price catalog to support conditional add-on logic based on color selection
- **MODIFIED**: Order processing to handle drop-point fulfillment workflow
- **MODIFIED**: Payment processing to enforce QRIS-only for drop-point orders

## Impact
- Affected specs: orders, payments, catalog
- Affected code: OrderForm component, CartForm component, payment processing, pricing logic, order management system
- Database changes: New drop-point order type, item numbering, color selections, add-on services