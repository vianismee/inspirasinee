# Simple Tracking Service Specification

## Overview

The Simple Tracking Service provides minimal, reliable client-side order tracking functionality. It eliminates all server-side processing that could cause 500 errors and uses only basic Supabase client queries.

## Service Interface

### Core Methods

#### `getOrderById(invoiceId: string): Promise<OrderData | null>`
Fetches order data using simple single-table query with basic error handling.

**Parameters:**
- `invoiceId`: String - Unique invoice identifier (basic format validation)

**Returns:**
- `Promise<OrderData | null>`: Order data or null if not found

**Error Handling:**
- **NO server-side errors** (client-side only)
- Network timeouts: Simple retry (max 2 attempts)
- Database errors: Return null immediately
- Invalid invoice ID: Return null

#### `validateInvoiceId(invoiceId: string): boolean`
Basic format validation only (no server checks).

**Parameters:**
- `invoiceId`: String - Invoice ID to validate

**Returns:**
- `boolean`: True if valid format

**Validation Rules:**
- Length: 6-20 characters
- Characters: Alphanumeric only
- Pattern: `^[A-Z0-9]{6,20}$`

#### `getOrderItems(invoiceId: string): Promise<OrderItem[]>`
Fetches order items using separate simple query (if needed).

**Parameters:**
- `invoiceId`: String - Invoice identifier

**Returns:**
- `Promise<OrderItem[]>`: Array of order items

**Features:**
- **NO pagination** (small datasets only)
- **NO complex sorting**
- **NO filtering** (basic query only)

## Data Models

### OrderData
```typescript
interface OrderData {
  // Basic order information
  invoice_id: string
  customer_name: string
  customer_phone: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_price: number
  subtotal: number
  created_at: string
  updated_at: string

  // Payment information
  payment_method: string
  payment_status: 'pending' | 'paid' | 'failed'

  // Order items (simplified)
  items: OrderItem[]

  // Shipping information (simplified)
  shipping_address?: string
  tracking_number?: string

  // Timeline events
  timeline: TimelineEvent[]
}
```

### OrderItem
```typescript
interface OrderItem {
  id: string
  service_name: string
  shoe_name: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
}
```

### TimelineEvent
```typescript
interface TimelineEvent {
  id: string
  event_type: 'created' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  description: string
  created_at: string
  created_by?: string
}
```

## Implementation Details

### Simple Database Queries

#### Primary Order Query (Single Table Only)
```sql
-- Ultra-simple query - NO JOINS to prevent errors
SELECT
  invoice_id,
  customer_id,
  status,
  total_price,
  subtotal,
  payment_method,
  payment_status,
  created_at,
  updated_at
FROM orders
WHERE invoice_id = $1
  AND status IS NOT NULL
LIMIT 1;
```

#### Customer Info Query (Separate, Optional)
```sql
-- Separate simple query if customer data needed
SELECT
  name,
  phone,
  email
FROM customers
WHERE customer_id = $1
LIMIT 1;
```

#### Order Items Query (Simple Only)
```sql
-- Simple order items query - NO JOINS
SELECT
  id,
  service_name,
  shoe_name,
  quantity,
  unit_price,
  total_price,
  notes
FROM order_item
WHERE invoice_id = $1
ORDER BY id ASC
LIMIT 20; -- Reasonable limit
```

**IMPORTANT:**
- **NO complex queries** that could timeout
- **NO multi-table joins** that could fail
- **NO server-side processing** that could cause 500 errors
- **Basic queries only** with simple WHERE clauses

### Error Handling Strategy

#### Error Types
```typescript
enum TrackingError {
  NOT_FOUND = 'ORDER_NOT_FOUND',
  INVALID_ID = 'INVALID_INVOICE_ID',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED'
}

interface TrackingServiceError extends Error {
  code: TrackingError
  details?: any
  retryable: boolean
}
```

#### Retry Logic
```typescript
const retryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
}

function shouldRetry(error: TrackingServiceError): boolean {
  return error.retryable &&
         error.code !== TrackingError.INVALID_ID &&
         error.code !== TrackingError.ACCESS_DENIED
}
```

### Caching Strategy

#### Server-Side Caching
- **TTL**: 5 minutes for order data
- **Cache Key**: `order:${invoiceId}`
- **Invalidation**: Manual on order updates
- **Storage**: Memory cache with LRU eviction

#### Client-Side Caching
- **TTL**: 2 minutes for UI state
- **Cache Key**: `tracking:${invoiceId}`
- **Invalidation**: Page refresh or manual refresh

### Rate Limiting

#### Request Limits
- **Per IP**: 10 requests per minute
- **Per Invoice**: 5 requests per minute
- **Burst Limit**: 20 requests with immediate throttling

#### Implementation
```typescript
interface RateLimitConfig {
  windowMs: number // 1 minute
  maxRequests: number
  keyGenerator: (req: Request) => string
  skipSuccessfulRequests: boolean
  skipFailedRequests: boolean
}

const trackingRateLimit: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  keyGenerator: (req) => req.ip || 'unknown',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
}
```

## Security Considerations

### Input Validation
- Invoice ID format validation using regex
- SQL injection prevention (parameterized queries)
- XSS protection (output encoding)

### Access Control
- No authentication required for basic tracking
- Rate limiting to prevent abuse
- Request logging for monitoring

### Data Protection
- Only expose necessary order information
- No sensitive customer data
- Secure handling of phone numbers (partial masking)

## Performance Optimization

### Query Optimization
- Use database indexes on invoice_id, customer_id
- Implement query result pagination
- Optimize JOIN operations

### Response Optimization
- Implement response compression
- Use CDN for static assets
- Optimize JSON serialization

### Monitoring
- Track query performance metrics
- Monitor error rates
- Alert on performance degradation

## Testing Strategy

### Unit Tests
- Test all service methods
- Mock database responses
- Test error handling scenarios
- Validate input sanitization

### Integration Tests
- Test real database connections
- Test error recovery mechanisms
- Validate rate limiting
- Test caching behavior

### Performance Tests
- Load testing with concurrent requests
- Memory usage monitoring
- Response time validation
- Stress testing under high load

## API Examples

### Successful Response
```json
{
  "success": true,
  "data": {
    "invoice_id": "INV123456",
    "customer_name": "John Doe",
    "customer_phone": "****-****-1234",
    "status": "shipped",
    "total_price": 150000,
    "subtotal": 140000,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-16T14:20:00Z",
    "payment_method": "transfer",
    "payment_status": "paid",
    "items": [
      {
        "id": "1",
        "service_name": "Deep Cleaning",
        "shoe_name": "Nike Air Max",
        "quantity": 1,
        "unit_price": 140000,
        "total_price": 140000,
        "notes": "Extra care requested"
      }
    ],
    "timeline": [
      {
        "id": "1",
        "event_type": "created",
        "description": "Order created successfully",
        "created_at": "2025-01-15T10:30:00Z"
      },
      {
        "id": "2",
        "event_type": "processing",
        "description": "Order is being processed",
        "created_at": "2025-01-15T11:00:00Z"
      },
      {
        "id": "3",
        "event_type": "shipped",
        "description": "Order has been shipped",
        "created_at": "2025-01-16T14:20:00Z"
      }
    ]
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found",
    "details": "Invoice ID 'INVALID123' does not exist",
    "retryable": false
  }
}
```

## Dependencies

### External Dependencies
- `@supabase/supabase-js`: Database client
- `@supabase/ssr`: Server-side rendering utilities
- `zod`: Input validation and type safety

### Internal Dependencies
- Database schema: orders, customers, order_item, order_timeline
- Environment variables: Supabase URL, anon key
- Logging infrastructure: Error tracking and monitoring

## Future Enhancements

### Phase 2 Features
- Real-time order status updates using Supabase Realtime
- Email/SMS notifications for status changes
- Customer feedback collection
- Advanced search and filtering

### Performance Improvements
- Database query optimization
- CDN implementation for static assets
- Advanced caching strategies
- Load balancing for high traffic