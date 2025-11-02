# AGENTS.md - Component Library

## Package Identity
React component library built with Shadcn/ui + Radix UI primitives. Provides reusable UI components for the service management system with consistent design and accessibility. Integrates directly with client-side services.

## Setup & Run
```bash
# Install new Shadcn/ui component
npx shadcn@latest add [component-name]

# Development server (from root)
npm run dev

# Type checking
npm run typecheck
```

## Patterns & Conventions
### Component Organization
- ✅ DO: Organize by feature: `src/components/Cart/`, `src/components/Dashboard/`
- ✅ DO: Use Shadcn/ui base components from `src/components/ui/`
- ✅ DO: Import services directly: `import { OrderService } from '@/lib/client-services'`
- ✅ DO: Export components via index files: `export { Cart } from './Cart'`
- ❌ DON'T: Create components without TypeScript interfaces

### Component Structure Examples
```
src/components/
├── ui/                  # Shadcn/ui base components (auto-generated)
│   ├── button.tsx
│   ├── input.tsx
│   └── dialog.tsx
├── Cart/                # Feature components
│   ├── Cart.tsx         # Main cart component
│   ├── CartItem.tsx     # Cart item component
│   └── index.ts         # Barrel exports
├── Dashboard/           # Dashboard components
│   ├── TableJob.tsx     # Orders table
│   └── OrderDetails.tsx # Order details modal
└── Tracking/            # Tracking components
    ├── TrackingDesktop.tsx
    └── TrackingMobile.tsx
```

### Component Patterns
- ✅ Functional components: `export function Button({ children }: Props)`
- ✅ TypeScript interfaces: `interface Props { children: React.ReactNode }`
- ✅ Service integration: `const { data } = await CustomerService.getCustomers()`
- ✅ Compound components: `Card`, `CardHeader`, `CardContent`, `CardFooter`
- ✅ Responsive design: Tailwind CSS breakpoints
- ✅ Accessibility: Radix UI ARIA support

## Touch Points / Key Files
- UI components: `src/components/ui/` (Shadcn/ui)
- Cart system: `src/components/Cart/Cart.tsx` + service integration
- Dashboard: `src/components/Dashboard/TableJob.tsx` with order fetching
- Tracking: `src/components/Tracking/TrackingDesktop.tsx` with order data
- Forms: `src/components/Customer/CustomerForm.tsx` with customer creation
- Data tables: `src/components/data-table/` (TanStack Table)

## JIT Index Hints
- Find a component: `rg -n "export function.*\|export const.*" src/components/`
- Find UI components: `ls src/components/ui/`
- Find feature components: `rg -l "export.*from.*" src/components/*/index.ts`
- Search service usage: `rg -n "import.*from.*client-services" src/components/`
- Search component usage: `rg -n "import.*from.*components" src/`

## Common Gotchas
- Always use forwardRef for components that need ref forwarding
- Shadcn/ui components should not be modified directly
- Use proper TypeScript interfaces for all props
- Call services in useEffect, not during render
- Handle loading states from service calls

## Pre-PR Checks
```bash
npm run typecheck && npm run lint
```