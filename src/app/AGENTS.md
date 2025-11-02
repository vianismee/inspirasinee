# AGENTS.md - App Router Structure

## Package Identity
Next.js 15 App Router application with server components and client-side service integration. Handles routing, server-side rendering, and page structure for the service management system.

## Setup & Run
```bash
# Development (from root)
npm run dev

# Build check for App Router
npm run build

# Type checking
npm run typecheck
```

## Patterns & Conventions
### Route Organization
- ✅ DO: Group related routes in parentheses: `(admin)/`, `(customer)/`
- ✅ DO: Use server components for data fetching: `page.tsx`
- ✅ DO: Import services for data: `import { CustomerService } from '@/lib/client-services'`
- ❌ DON'T: Create API routes in `api/` folder
- ❌ DON'T: Put client-side logic in server components without "use client"

### File Structure Examples
```
src/app/
├── (admin)/              # Admin route group (layout.tsx protects access)
│   ├── admin/           # Admin dashboard pages
│   └── services/        # Service management pages
├── customer/            # Customer-facing pages
├── customer-dashboard/  # Customer portal pages
└── layout.tsx          # Root layout with providers
```

### Page Component Patterns
- ✅ Server Components: Default for data fetching
- ✅ Client Components: Add `"use client";` directive
- ✅ Service Integration: Import services directly in components
- ✅ Data Fetching: Call service functions in useEffect or server components
- ✅ Loading States: `loading.tsx` files
- ✅ Error Handling: `error.tsx` files

## Touch Points / Key Files
- Root layout: `src/app/layout.tsx` (providers, global styles)
- Admin layout: `src/app/(admin)/layout.tsx` (admin protection)
- Customer dashboard: `src/app/customer-dashboard/[hash]/page.tsx`
- Service integration: Any page using `import { Service } from '@/lib/client-services'`
- Middleware: `src/middleware.ts` (route protection)

## JIT Index Hints
- Find page components: `rg -n "export default.*Page" src/app/**/page.tsx`
- Find layouts: `find src/app -name "layout.tsx"`
- Find loading states: `find src/app -name "loading.tsx"`
- Search service imports: `rg -n "import.*from.*client-services" src/app/`

## Common Gotchas
- Always add `"use client";` for interactive components
- Admin routes require authentication via middleware
- Customer dashboard pages need hash validation
- Services should be called in useEffect or server components
- Handle RLS errors gracefully from service calls

## Pre-PR Checks
```bash
npm run typecheck && npm run build
```