# Design Document: Order Tracking System Refactor

## System Architecture Overview

### Current Architecture Problems
```
Client-Side Only (Current)
├── Browser executes complex database queries
├── Multiple table joins causing memory issues
├── No server-side error handling
├── JSON generation failures in production
└── Complex client-side state management
```

### Proposed Architecture
```
Hybrid Server-Client (Proposed)
├── Server Component (Data Layer)
│   ├── Simple CRUD queries
│   ├── Error boundaries and validation
│   ├── Response caching
│   └── Rate limiting
├── Client Component (UI Layer)
│   ├── Pure UI rendering
│   ├── Client-side error handling
│   ├── Loading states
│   └── User interactions
└── Monitoring & Logging
    ├── Performance metrics
    ├── Error tracking
    └── Access logging
```

## Data Flow Design

### Request Flow
```
1. User Request
   ↓
2. /tracking/[slug] (Server Component)
   ├── Validate invoice ID format
   ├── Check rate limits
   └── Fetch order data server-side
   ↓
3. Tracking Service
   ├── Database query with error handling
   ├── Data validation and sanitization
   └── Response caching
   ↓
4. Client Component (TrackingApp)
   ├── Receive props from server
   ├── Handle loading/error states
   └── Render appropriate UI
   ↓
5. User Interface
   ├── Desktop or mobile layout
   ├── Interactive elements
   └── Real-time updates (optional)
```

### Error Handling Flow
```
Error Detection
├── Server-side validation errors
│   ├── Invalid invoice ID format
│   ├── Rate limit exceeded
│   └── Database connection issues
├── Database query errors
│   ├── Order not found
│   ├── Query timeout
│   └── Data corruption
└── Client-side errors
    ├── Network failures
    ├── Component errors
    └── User interaction errors
↓
Error Response
├── Server errors → Error boundary → Fallback UI
├── Database errors → Retry mechanism → User message
└── Client errors → Local error handling → Graceful degradation
```

## Component Design

### Server Components

#### Tracking Page Component
```typescript
// src/app/tracking/[slug]/page.tsx
export default async function TrackingPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  try {
    const { slug } = await params

    // Validate input
    if (!validateInvoiceId(slug)) {
      return <TrackingErrorPage type="INVALID_ID" />
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(slug)
    if (!rateLimitResult.allowed) {
      return <TrackingErrorPage type="RATE_LIMITED" />
    }

    // Fetch order data
    const orderData = await trackingService.getOrderById(slug)

    if (!orderData) {
      return <TrackingErrorPage type="NOT_FOUND" />
    }

    return (
      <TrackingErrorBoundary>
        <div className="w-full flex justify-center">
          <TrackingApp orderData={orderData} />
        </div>
      </TrackingErrorBoundary>
    )
  } catch (error) {
    console.error('Tracking page error:', error)
    return <TrackingErrorPage type="SERVER_ERROR" />
  }
}
```

#### Tracking Service
```typescript
// src/lib/tracking-service.ts
class TrackingService {
  async getOrderById(invoiceId: string): Promise<OrderData | null> {
    try {
      // Input validation
      if (!this.validateInvoiceId(invoiceId)) {
        throw new ValidationError('Invalid invoice ID format')
      }

      // Check cache first
      const cached = await this.getFromCache(invoiceId)
      if (cached) return cached

      // Database query with retry logic
      const orderData = await this.queryWithRetry(
        () => this.fetchOrderFromDatabase(invoiceId),
        3 // max attempts
      )

      // Cache the result
      if (orderData) {
        await this.setCache(invoiceId, orderData, 300) // 5 minutes
      }

      return orderData
    } catch (error) {
      console.error('Failed to fetch order:', error)
      throw new TrackingServiceError(
        'Failed to fetch order data',
        error.code || 'UNKNOWN_ERROR',
        error
      )
    }
  }
}
```

### Client Components

#### Tracking App (Simplified)
```typescript
// src/components/Tracking/TrackingApp.tsx
interface TrackingAppProps {
  orderData: OrderData
}

export function TrackingApp({ orderData }: TrackingAppProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const isMobile = useIsMobile()

  // Handle client-side errors only
  const handleError = useCallback((error: string) => {
    setLocalError(error)
    // Log error for monitoring
    logClientError(error, { invoiceId: orderData.invoice_id })
  }, [orderData.invoice_id])

  if (localError) {
    return <TrackingErrorPage error={localError} onRetry={() => setLocalError(null)} />
  }

  return isMobile ? (
    <TrackingMobile order={orderData} onError={handleError} />
  ) : (
    <TrackingDesktop order={orderData} onError={handleError} />
  )
}
```

## Database Design

### Optimized Queries

#### Primary Order Query
```sql
-- Simplified, indexed query
SELECT
  o.invoice_id,
  o.status,
  o.total_price,
  o.subtotal,
  o.payment_method,
  o.payment_status,
  o.created_at,
  o.updated_at,
  c.name as customer_name,
  c.phone as customer_phone,
  -- Basic shipping info only
  s.address as shipping_address,
  s.tracking_number
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN shipping s ON o.invoice_id = s.invoice_id
WHERE o.invoice_id = $1
  AND o.status IS NOT NULL
LIMIT 1;

-- Indexes needed:
CREATE INDEX idx_orders_invoice_id ON orders(invoice_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_customers_customer_id ON customers(customer_id);
```

#### Order Items Query
```sql
-- Separate query for better performance
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
ORDER BY created_at ASC;

-- Index needed:
CREATE INDEX idx_order_items_invoice_id ON order_item(invoice_id);
```

#### Timeline Query
```sql
-- Order status timeline
SELECT
  id,
  event_type,
  description,
  created_at,
  created_by
FROM order_timeline
WHERE invoice_id = $1
ORDER BY created_at DESC
LIMIT 10;

-- Index needed:
CREATE INDEX idx_order_timeline_invoice_id ON order_timeline(invoice_id);
```

## Security Design

### Rate Limiting Implementation
```typescript
// src/lib/rate-limiting.ts
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class RateLimiter {
  private store: RateLimitStore = {}

  async checkLimit(
    identifier: string,
    windowMs: number = 60000, // 1 minute
    maxRequests: number = 10
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now()
    const key = identifier
    const window = this.store[key]

    if (!window || now > window.resetTime) {
      // New window or expired window
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs
      }
      return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
    }

    if (window.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: window.resetTime
      }
    }

    window.count++
    return {
      allowed: true,
      remaining: maxRequests - window.count,
      resetTime: window.resetTime
    }
  }
}
```

### Input Validation
```typescript
// src/lib/validation.ts
import { z } from 'zod'

export const InvoiceIdSchema = z.string()
  .min(6, 'Invoice ID must be at least 6 characters')
  .max(20, 'Invoice ID must be no more than 20 characters')
  .regex(/^[A-Z0-9-]+$/, 'Invoice ID can only contain letters, numbers, and hyphens')

export function validateInvoiceId(invoiceId: string): {
  isValid: boolean
  error?: string
} {
  try {
    InvoiceIdSchema.parse(invoiceId)
    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: error.errors[0]?.message || 'Invalid invoice ID format'
    }
  }
}
```

## Performance Design

### Caching Strategy
```typescript
// src/lib/cache.ts
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}
```

### Error Boundary Design
```typescript
// src/components/Tracking/TrackingErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

export class TrackingErrorBoundary extends Component<
  PropsWithChildren<{ fallback?: ReactNode }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo })

    // Log error for monitoring
    console.error('Tracking error boundary caught:', error, errorInfo)

    // Send to error monitoring service
    if (typeof window !== 'undefined') {
      window.analytics?.track('tracking_error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <TrackingErrorPage
          error={this.state.error?.message || 'Unknown error'}
          onRetry={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      )
    }

    return this.props.children
  }
}
```

## Monitoring & Observability

### Performance Metrics
```typescript
// src/lib/monitoring.ts
interface TrackingMetrics {
  requestCount: number
  errorCount: number
  averageResponseTime: number
  cacheHitRate: number
  rateLimitHits: number
}

class TrackingMonitor {
  private metrics: TrackingMetrics = {
    requestCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    rateLimitHits: 0
  }

  trackRequest(duration: number, success: boolean, fromCache: boolean): void {
    this.metrics.requestCount++
    if (!success) this.metrics.errorCount++
    if (fromCache) this.updateCacheHitRate(true)

    // Update average response time
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.requestCount - 1) + duration)
      / this.metrics.requestCount
  }

  trackRateLimit(): void {
    this.metrics.rateLimitHits++
  }

  updateCacheHitRate(hit: boolean): void {
    // Simple moving average for cache hit rate
    const alpha = 0.1 // Smoothing factor
    this.metrics.cacheHitRate =
      alpha * (hit ? 1 : 0) + (1 - alpha) * this.metrics.cacheHitRate
  }

  getMetrics(): TrackingMetrics {
    return { ...this.metrics }
  }
}
```

### Error Tracking
```typescript
// src/lib/error-tracking.ts
interface ErrorReport {
  timestamp: string
  invoiceId?: string
  errorType: string
  errorMessage: string
  stackTrace?: string
  userAgent?: string
  ip?: string
  context?: any
}

class ErrorTracker {
  reportError(error: Error, context?: any): void {
    const report: ErrorReport = {
      timestamp: new Date().toISOString(),
      invoiceId: context?.invoiceId,
      errorType: error.constructor.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      context
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Tracking error:', report)
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(report)
    }
  }

  private async sendToMonitoringService(report: ErrorReport): Promise<void> {
    try {
      // Implementation depends on monitoring service
      await fetch('/api/errors/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      })
    } catch (error) {
      console.error('Failed to send error report:', error)
    }
  }
}
```

## Deployment Strategy

### Feature Flag Implementation
```typescript
// src/lib/feature-flags.ts
interface FeatureFlags {
  useNewTrackingSystem: boolean
  enableRealTimeUpdates: boolean
  enableAdvancedErrorHandling: boolean
}

class FeatureFlagService {
  private flags: FeatureFlags = {
    useNewTrackingSystem: process.env.NEXT_PUBLIC_USE_NEW_TRACKING === 'true',
    enableRealTimeUpdates: false, // Phase 2 feature
    enableAdvancedErrorHandling: true
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag]
  }

  // For runtime updates
  updateFlags(updates: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...updates }
  }
}
```

### Migration Strategy
1. **Phase 1**: Deploy new system behind feature flag
2. **Phase 2**: Enable for 10% of traffic
3. **Phase 3**: Monitor performance and errors
4. **Phase 4**: Gradual rollout to 100%
5. **Phase 5**: Remove old system

## Testing Strategy

### Test Coverage Requirements
- Unit tests: >90% coverage
- Integration tests: All API endpoints
- E2E tests: Critical user journeys
- Performance tests: Load and stress testing
- Security tests: Input validation and rate limiting

### Test Scenarios
```typescript
// Critical test cases
describe('Tracking System', () => {
  test('Valid invoice ID loads successfully')
  test('Invalid invoice ID shows error message')
  test('Non-existent order shows not found')
  test('Rate limiting prevents abuse')
  test('Network errors handled gracefully')
  test('Server errors show fallback UI')
  test('Mobile responsive design works')
  test('Desktop responsive design works')
  test('Loading states display properly')
  test('Error boundaries prevent crashes')
})
```

This design provides a comprehensive, reliable, and maintainable tracking system that addresses the current 500 error issues while improving performance and security.