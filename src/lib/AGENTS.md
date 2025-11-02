# AGENTS.md - Client Services & Utilities

## Package Identity
Core client-side service layer providing direct Supabase database access, utilities, validation schemas, and business logic helpers. Replaces traditional API routes with client-side database operations.

## Setup & Run
```bash
# Development server (from root)
npm run dev

# Type checking
npm run typecheck
```

## Patterns & Conventions
### Service Organization
- ✅ DO: Group by domain: `CustomerService`, `OrderService`, `DiscountService`
- ✅ DO: Use async functions for database operations
- ✅ DO: Export service objects: `export const CustomerService = { ... }`
- ✅ DO: Handle errors with `handleClientError(error, options)`
- ❌ DON'T: Create Next.js API routes

### Service Structure Examples
```typescript
// Customer operations
export const CustomerService = {
  async getCustomers(filter?: { phone?: string; email?: string }) {
    let query = supabase.from('customers').select('*');
    // Apply filters and return data
  },
  async createCustomer(customerData: any) {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();
    // Handle errors and return data
  }
}

// Order operations
export const OrderService = {
  async createOrder(orderData: any) {
    // Direct database insert
  },
  async getOrders(filter?: { customer_id?: string; status?: string }) {
    // Direct database query with filters
  }
}
```

### Database Access Patterns
- ✅ Direct Supabase client: `supabase.from('table').select('*')`
- ✅ Error handling: `if (error) throw error;`
- ✅ Type safety: TypeScript interfaces for all operations
- ✅ Logging: Use `logger.info()`, `logger.error()`
- ✅ RLS handling: Let Supabase handle row-level security

## Touch Points / Key Files
- Main services: `src/lib/client-services.ts` (all database operations)
- Supabase client: `src/utils/supabase/client.ts`
- Invoice generation: `src/lib/invoiceUtils.ts`
- Formatting utilities: `src/lib/utils.ts`
- Error handling: `src/utils/client-error-handler.ts`
- Logger: `src/utils/client/logger.ts`

## JIT Index Hints
- Find service functions: `rg -n "async.*\(" src/lib/client-services.ts`
- Find service objects: `rg -n "export const.*Service" src/lib/client-services.ts`
- Search service usage: `rg -n "Service\." src/`
- Find database operations: `rg -n "supabase\.from\(" src/lib/client-services.ts`

## Common Gotchas
- Always use Supabase client from `src/utils/supabase/client`
- Handle RLS permission errors gracefully
- Use proper error boundaries for database failures
- Validate all data before database operations
- Don't expose sensitive data in client services

## Pre-PR Checks
```bash
npm run typecheck
```