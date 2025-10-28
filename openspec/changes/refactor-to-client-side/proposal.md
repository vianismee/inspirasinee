## Why
Server-side API routes in Next.js are causing 405 Method Not Allowed and 500 errors during Vercel deployments. The server-side architecture with Supabase is not working reliably in production, preventing users from logging in and using core functionality.

## What Changes
- **BREAKING**: Remove all API routes under `/src/app/api/` directory
- **BREAKING**: Replace all server-side Supabase client usage with client-side browser client
- **BREAKING**: Convert all CRUD operations from API calls to direct Supabase client calls
- **BREAKING**: Update authentication flow to use client-side Supabase auth
- Update all components that call API endpoints to use client-side Supabase operations
- Implement proper client-side error handling and loading states
- Add Row Level Security (RLS) policies to secure data access
- Update environment variables for client-side usage

## Impact
- **Affected specs**: authentication, database-operations, api-endpoints, frontend-components
- **Affected code**: All API routes, authentication logic, data fetching components
- **Deployment impact**: Eliminates server-side deployment issues on Vercel
- **Security impact**: Requires proper RLS policies instead of server-side validation