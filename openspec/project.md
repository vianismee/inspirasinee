# Project Context

## Purpose
Inspirasinee is a web-based service management and tracking application. The system appears to be designed for managing services, orders, discounts, and tracking functionality with both public-facing features and admin capabilities.

Key features include:
- Service catalog management
- Order and discount management system
- Package tracking functionality
- QR code generation for invoices
- Admin dashboard with data tables
- User authentication and private areas
- PWA (Progressive Web App) capabilities

## Tech Stack
### Frontend Framework
- **Next.js 15.4.7** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - Component library (New York style)
- **Radix UI** - Headless UI components
- **Lucide React** - Icon library
- **Motion** - Animation library

### State Management & Data
- **Zustand** - State management
- **TanStack React Table** - Data tables
- **React Hook Form** - Form handling with Zod validation
- **Supabase** - Backend as a Service (database, auth, storage)

### Key Libraries
- **Next PWA** - Progressive Web App functionality
- **Next Themes** - Theme management
- **QR Code** - QR code generation
- **Recharts** - Charting library
- **Date-fns** - Date utilities
- **NanoID** - ID generation

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static typing
- **PostCSS** - CSS processing

## Project Conventions

### Code Style
- **TypeScript Strict Mode**: Enabled for type safety
- **Component Structure**: Uses Shadcn/ui component patterns
- **File Organization**: Feature-based structure under `src/`
- **Path Aliases**: `@/*` maps to `./src/*`
- **CSS**: Utility-first with Tailwind CSS, CSS variables enabled

### Architecture Patterns
- **Next.js App Router**: Server-side rendering with React Server Components
- **Component Composition**: Modular, reusable components
- **Form Validation**: React Hook Form + Zod schemas
- **Data Tables**: TanStack React Table with custom pagination/filters
- **Authentication**: Supabase Auth with middleware
- **API Routes**: Next.js API routes for server-side logic

### UI Patterns
- **Shadcn/ui Components**: Consistent design system
- **Responsive Design**: Mobile-first approach
- **Dark/Light Theme**: Built-in theme switching
- **Loading States**: Skeleton components for better UX
- **Toast Notifications**: Sonner for notifications

### File Structure Conventions
```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
│   ├── ui/             # Shadcn/ui base components
│   └── [feature]/      # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── utils/              # Helper utilities
├── stores/             # Zustand state stores
├── types/              # TypeScript type definitions
└── data/               # Mock data and constants
```

### Testing Strategy
No testing framework is currently configured in the project.

### Git Workflow
- **Main Branch**: `main` for production
- **Current Branch**: `claude/feat` for feature development
- **Commit Convention**: Conventional commits with generated messages
- **Branch Protection**: Main branch likely protected

## Domain Context

### Service Management
The application manages a catalog of services that can be ordered by customers. Services include pricing, descriptions, and categorization.

### Order Processing
Orders go through a workflow management system with status tracking, customer information collection, and invoice generation with QR codes.

### Discount System
Admin can create and manage discount codes with various rules and conditions.

### Tracking System
Package tracking functionality with search capabilities and status updates, accessible via unique slugs/IDs.

### Admin Dashboard
Comprehensive admin interface for managing orders, services, discounts, and viewing analytics with data tables and filtering.

## Important Constraints

### Technical Constraints
- PWA compatibility required for offline functionality
- Mobile-responsive design mandatory
- Server-side rendering for SEO and performance
- Type safety enforced throughout the codebase

### Business Constraints
- Authentication required for admin features
- Public tracking pages accessible without login
- Order management restricted to authenticated users

## External Dependencies

### Supabase
- **Database**: PostgreSQL for data persistence
- **Authentication**: User authentication and session management
- **Storage**: File storage for uploads
- **Real-time**: Live data synchronization

### Third-party Services
- **QR Code Generation**: For invoice and tracking purposes
- **Payment Processing**: Not yet implemented but likely needed
- **Email Service**: For notifications (likely via Supabase)

### Development Dependencies
- **Node.js**: Runtime environment
- **Next.js**: Development server and build tools
- **Tailwind CSS**: Build-time CSS processing
