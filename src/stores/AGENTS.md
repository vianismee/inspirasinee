# AGENTS.md - State Management

## Package Identity
Zustand-based state management for global application state. Handles shopping cart, orders, customers, services, and UI state with TypeScript type safety.

## Setup & Run
```bash
# Development server (from root)
npm run dev

# Type checking
npm run typecheck
```

## Patterns & Conventions
### Store Organization
- ✅ DO: One store per domain: `cartStore.ts`, `orderStore.ts`, `customerStore.ts`
- ✅ DO: Use TypeScript interfaces for state shape
- ✅ DO: Separate actions from state selectors
- ❌ DON'T: Mix unrelated state in single store

### Store Structure Examples
```typescript
// cartStore.ts - Shopping cart and checkout logic
interface CartState {
  cart: CartItem[];
  activeDiscounts: Discount[];
  totalPrice: number;
  setPayment: (payment: string) => void;
  addItem: () => void;
  handleSubmit: () => Promise<boolean>;
}

// orderStore.ts - Order management and tracking
interface OrderState {
  orders: Orders[];
  singleOrder: Orders | null;
  fetchOrder: (options?: FetchOptions) => Promise<boolean>;
  updateOrderStep: (invoiceId: string, newStep: string) => Promise<void>;
}
```

### State Management Patterns
- ✅ Zustand create(): `export const useCartStore = create<CartState>()`
- ✅ Async actions: `handleSubmit: async () => { /* API call */ }`
- ✅ Computed values: Calculate in action, store in state
- ✅ Error handling: Try/catch with toast notifications
- ✅ TypeScript: Strict typing for all state and actions

## Touch Points / Key Files
- Shopping cart: `src/stores/cartStore.ts` (cart items, discounts, checkout)
- Order management: `src/stores/orderStore.ts` (order CRUD, tracking)
- Customer data: `src/stores/customerStore.ts` (customer selection, creation)
- Service catalog: `src/stores/serviceCatalogStore.ts` (services, categories)
- Admin orders: `src/stores/adminOrderStore.ts` (admin order management)

## JIT Index Hints
- Find stores: `rg -n "export const use.*Store" src/stores/`
- Find state interfaces: `rg -n "interface.*State" src/stores/`
- Search store usage: `rg -n "use.*Store\(" src/`
- Find async actions: `rg -n "async.*=.*async" src/stores/`

## Common Gotchas
- Always handle loading states and error cases
- Use optimistic updates for better UX
- Don't store sensitive data in client-side state
- Keep API calls in actions, not in components

## Pre-PR Checks
```bash
npm run typecheck
```