## 1. Setup Client-Side Infrastructure
- [x] 1.1 Create client-side Supabase configuration utility
- [x] 1.2 Setup authentication context provider with React context
- [x] 1.3 Create client-side error handling utilities
- [x] 1.4 Update environment variables for client usage (remove NEXT_PUBLIC_ restrictions)
- [x] 1.5 Create client-side service classes for referral and points operations
- [ ] 1.6 Setup client-side rate limiting and security utilities

## 2. Database Security Setup
- [ ] 2.1 Audit all existing tables and access patterns (customers, orders, services, discounts, referrals, points)
- [ ] 2.2 Implement Row Level Security (RLS) policies for all tables
- [ ] 2.3 Create authentication-related RLS policies (admin vs customer access)
- [ ] 2.4 Create referral-specific RLS policies for dashboard access
- [ ] 2.5 Test RLS policies with different user roles (admin, customer, public)
- [ ] 2.6 Implement RLS policies for points system and referral validation

## 3. Authentication Migration
- [x] 3.1 Replace server-side login API route (/api/login) with client-side auth
- [x] 3.2 Update login form to use browser Supabase client (signInWithPassword)
- [x] 3.3 Implement client-side session management with React context
- [ ] 3.4 Update logout functionality to use client-side signOut (nav-user.tsx still uses server action)
- [ ] 3.5 Remove server-side authentication middleware (/src/utils/supabase/middleware.ts)
- [ ] 3.6 Update protected routes to use client-side auth state
- [x] 3.7 Implement automatic token refresh handling client-side

## 4. API Route Migration - Core Features (Current 20 API Routes)
- [x] 4.1 Convert /api/points/balance API calls to client-side Supabase queries
- [x] 4.2 Convert /api/points/redeem API calls to client-side validation
- [x] 4.3 Convert /api/points/deduct API calls to client-side operations (no components using this API)
- [x] 4.4 Convert /api/referral/record API calls to client-side referral recording (no components using this API)
- [x] 4.5 Convert /api/referral/validate API calls to client-side validation
- [x] 4.6 Convert customer management API calls to client-side (no API routes exist)
- [x] 4.7 Convert order management API calls to client-side (no API routes exist)
- [x] 4.8 Convert service catalog API calls to client-side (no API routes exist)
- [x] 4.9 Convert discount management API calls to client-side (no API routes exist)

## 5. API Route Migration - Referral System
- [x] 5.1 Convert /api/referral/dashboard/verify API calls to client-side phone verification
- [x] 5.2 Convert /api/referral/dashboard/access/[hash] API calls to client-side session validation
- [ ] 5.3 Convert /api/admin/referral/analytics API calls to client-side analytics queries
- [ ] 5.4 Convert /api/admin/referral/customers API calls to client-side customer management
- [ ] 5.5 Convert /api/admin/referral/settings API calls to client-side settings management
- [x] 5.6 Implement client-side secure hash generation for dashboard access
- [ ] 5.7 Migrate complex analytics joins to client-side Supabase queries
- [x] 5.8 Update referral dashboard components to use client-side data fetching

## 6. API Route Migration - Tracking System
- [ ] 6.1 Convert package tracking API calls to client-side (if any exist)
- [ ] 6.2 Convert tracking search API calls to client-side (if any exist)
- [ ] 6.3 Convert customer dashboard API calls to client-side (if any exist)
- [ ] 6.4 Update public tracking pages to use client-side Supabase queries

## 7. API Route Migration - Debug/Health
- [ ] 7.1 Remove all /api/debug/ routes (8+ debug endpoints)
- [ ] 7.2 Convert /api/referral/health check to client-side connectivity test
- [ ] 7.3 Remove server-side debugging utilities
- [ ] 7.4 Replace debug functionality with client-side logging utilities
- [ ] 7.5 Create client-side environment validation utilities

## 8. Frontend Component Updates
- [x] 8.1 Update PointsRedemption.tsx component to use client-side Supabase calls
- [ ] 8.2 Update PhoneVerification.tsx component to use client-side verification
- [ ] 8.3 Update admin dashboard components to use client-side data fetching
- [ ] 8.4 Update order management components (if any exist)
- [ ] 8.5 Update customer management components (if any exist)
- [x] 8.6 Update referral system components and dashboard pages (Referral.tsx uses client services)
- [ ] 8.7 Update tracking system components (if any exist)
- [x] 8.8 Add proper loading states and error handling to all components (client-error-handler.ts exists)
- [ ] 8.9 Implement optimistic updates for better user experience
- [ ] 8.10 Add client-side caching for frequently accessed data

## 9. Service Layer Migration
- [x] 9.1 Convert SimpleReferralService class to client-side operations
- [x] 9.2 Convert SimplePointsService class to client-side operations
- [x] 9.3 Implement client-side data transformation utilities
- [x] 9.4 Create client-side analytics calculation functions
- [ ] 9.5 Update all service classes to use RLS-protected queries

## 10. Cleanup and Testing
- [ ] 10.1 Remove all API route directories and files under /src/app/api/
- [ ] 10.2 Remove server-side action files (if any exist)
- [ ] 10.3 Remove unused server-side Supabase utilities (/src/utils/supabase/server.ts)
- [ ] 10.4 Remove SimpleReferralService and SimplePointsService server-side implementations
- [ ] 10.5 Test authentication flow end-to-end (login, session, logout)
- [ ] 10.6 Test all CRUD operations with RLS policies
- [ ] 10.7 Test admin functionality with proper permissions
- [ ] 10.8 Test public tracking pages functionality
- [ ] 10.9 Test referral system analytics and dashboard access
- [ ] 10.10 Test points system redemption and balance operations
- [ ] 10.11 Verify PWA functionality still works with client-side auth
- [ ] 10.12 Test error handling and loading states across all components

## 11. Deployment
- [ ] 11.1 Build and test locally with client-side architecture
- [ ] 11.2 Verify no server-side API routes exist in build
- [ ] 11.3 Deploy to staging environment
- [ ] 11.4 Verify no 405/500 errors occur on staging
- [ ] 11.5 Test all functionality on staging before production
- [ ] 11.6 Deploy to production
- [ ] 11.7 Monitor production for any issues and performance
- [ ] 11.8 Verify client-side RLS policies are working correctly in production