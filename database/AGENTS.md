# AGENTS.md - Database Schema & Client Access

## Package Identity
PostgreSQL database with Supabase integration. Defines tables for customers, orders, services, discounts, and tracking functionality with Row Level Security (RLS) policies. Accessed directly via client-side service layer.

## Setup & Run
```bash
# Database operations via Supabase console
# Schema changes: Apply through Supabase dashboard
# Client access: Via src/lib/client-services.ts
```

## Patterns & Conventions
### Table Organization
- ✅ DO: Use snake_case for column names: `customer_id`, `order_items`
- ✅ DO: Add foreign key constraints: `REFERENCES customers(customer_id)`
- ✅ DO: Include created_at/updated_at timestamps
- ✅ DO: Use UUID for primary keys where appropriate
- ✅ DO: Enable RLS on all tables
- ❌ DON'T: Expose raw database errors to clients

### Key Tables Structure
```sql
-- Customers and authentication
customers (customer_id, username, whatsapp, email, alamat)
admin_users (id, email, role, created_at)

-- Orders and services
orders (invoice_id, customer_id, status, subtotal, total_price, payment)
order_item (id, invoice_id, shoe_name, service, amount)
order_discounts (order_invoice_id, discount_code, discounted_amount)

-- Features and business logic
discount (id, label, amount, percent)
service_catalog (id, name, amount, category_id)
referral_usage (id, referral_code, referrer_customer_id, referred_customer_id)

-- Points and analytics
customer_points (id, customer_id, current_balance, total_earned, total_redeemed)
points_transactions (id, customer_id, transaction_type, points_change)
```

### Client Access Patterns
- ✅ Direct access: `supabase.from('table').select('*')`
- ✅ Service layer: All database operations through `client-services.ts`
- ✅ RLS protection: Row-level security handles data filtering
- ✅ Error handling: Client-side error boundaries and try/catch

## Touch Points / Key Files
- Schema reference: `database/schema.sql` (complete table definitions)
- Client services: `src/lib/client-services.ts` (all database access)
- Supabase client: `src/utils/supabase/client.ts`
- RLS policies: Supabase console dashboard
- Service integration: Components that import services

## JIT Index Hints
- Find table definitions: `rg -n "CREATE TABLE" database/`
- Search foreign keys: `rg -n "REFERENCES" database/schema.sql`
- Find client table usage: `rg -n "\.from\(" src/lib/client-services.ts`
- Find service table operations: `rg -n "from.*\(" src/lib/client-services.ts`

## Common Gotchas
- Always test RLS policies before deploying
- Use proper foreign key relationships
- Handle RLS permission errors in service layer
- Don't bypass RLS policies in client services
- Use consistent error handling across services

## Pre-PR Checks
```bash
# Verify schema consistency with client services
npm run typecheck
# Test RLS policies in Supabase console
```