<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

---

# AGENTS.md - Inspirasi Website

## Project Snapshot
- **Type**: Single Next.js 15 application with App Router
- **Tech**: React 19, TypeScript, Tailwind CSS, Shadcn/ui, Supabase
- **Purpose**: Service management and order tracking system with customer dashboard
- **Architecture**: Client-side service layer (no Next.js API routes)
- **Structure**: Feature-based architecture with admin/customer separation

## Root Setup Commands
```bash
# Install dependencies
npm install

# Development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Universal Conventions
- **TypeScript**: Strict mode enabled, use `@/` for absolute imports
- **Code Style**: ESLint + Prettier (flat config)
- **Components**: Functional components with TypeScript interfaces
- **Database**: Direct Supabase client access via service layer
- **State Management**: Zustand for global state, React state for local
- **API**: Client-side services in `src/lib/client-services.ts`
- **UI**: Shadcn/ui components + Radix UI primitives

## Security & Secrets
- Never commit `.env.local` or API keys
- Use Supabase environment variables: `NEXT_PUBLIC_SUPABASE_*`
- Admin routes protected via middleware
- PII handled through Supabase RLS policies
- QR codes and customer data are non-sensitive

## JIT Index - Directory Map

### Feature Structure
- Authentication: `src/contexts/auth-context.tsx` + middleware
- Service Catalog: `src/components/Catalog/` + `src/stores/serviceCatalogStore.ts`
- Order Management: `src/components/Dashboard/` + `src/stores/orderStore.ts`
- Customer Portal: `src/app/customer/` + `src/app/customer-dashboard/`
- Admin Dashboard: `src/app/(admin)/` + `src/components/Dashboard/`
- Service Layer: `src/lib/client-services.ts` (database operations)
- Database: `database/` + Supabase console

### Quick Find Commands
- Find React components: `rg -n "export.*function.*\|export const.*" src/components/`
- Find services: `rg -n "Service.*=" src/lib/client-services.ts`
- Find stores: `rg -n "export const use.*Store" src/stores/`
- Find types: `rg -n "export.*type\|export.*interface" src/types/`
- Search database schema: `rg -n "CREATE TABLE" database/`

## Definition of Done
- All TypeScript errors resolved (`npm run typecheck` passes)
- Build completes successfully (`npm run build` passes)
- Linting passes (`npm run lint` passes)
- Admin routes still protected by middleware
- Supabase RLS policies tested
- Mobile responsive design verified
- PWA functionality preserved