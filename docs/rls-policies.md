# Row Level Security (RLS) Policies

## Current Issues
- Client-side authentication is working ✅
- Database operations failing with 400/409 errors ❌
- Need to implement RLS policies for secure client-side access

## Tables That Need RLS Policies
Based on errors, these tables need immediate RLS policies:

1. **orders** - 400 Bad Request errors
2. **order_item** - 409 Conflict errors
3. **service_catalog** - Already working with client-side
4. **customers** - Likely needs policies
5. **discounts** - Likely needs policies

## Temporary Fix for Development
Until proper RLS policies are implemented, we can:
1. Enable RLS on tables
2. Add permissive policies for authenticated users
3. Restrict access for unauthenticated users

## Sample RLS Policy Structure
```sql
-- Enable RLS on a table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create policy for inserting orders
CREATE POLICY "Users can insert orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

## Implementation Priority
1. **High Priority**: orders, order_item (currently failing)
2. **Medium Priority**: customers, service_catalog, discounts
3. **Low Priority**: referral-related tables, debug tables