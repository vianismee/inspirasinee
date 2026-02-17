# Referral Dashboard Access Feature Implementation Guide

This document provides a comprehensive guide for implementing the Referral Dashboard Access feature in a project using the same database schema.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Database Schema](#database-schema)
4. [Architecture](#architecture)
5. [Implementation Steps](#implementation-steps)
6. [Security Considerations](#security-considerations)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Referral Dashboard Access feature allows customers to view their referral statistics, points balance, transaction history, and order history through a secure, phone-based access control system.

### Key Features

- **Phone-based Authentication**: Customers access their dashboard using a WhatsApp number-based hash system
- **No Persistent Sessions**: Direct validation against database without session storage
- **Points Tracking**: View current balance, total earned, and total redeemed points
- **Referral Analytics**: Track total referrals and points earned from referrals
- **Transaction History**: View recent points transactions
- **Order History**: Access order history linked to the customer account

### Tech Stack Requirements

- **Frontend**: Next.js 13+ with App Router
- **UI Framework**: React with any UI component library (Radix UI, shadcn/ui, etc.)
- **Database**: PostgreSQL (via Supabase or direct connection)
- **Authentication**: Supabase Auth (for admin users) or custom auth
- **Styling**: Tailwind CSS or equivalent

---

## Prerequisites

### 1. Database Setup

Ensure your database has the following tables:

```sql
-- Core tables
customers
customer_points
referral_settings
referral_usage
points_transactions
orders

-- Optional for enhanced features
dashboard_sessions
dashboard_access_logs
```

### 2. Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Direct database connection
DATABASE_URL=your_postgresql_connection_string
```

### 3. Required Dependencies

```bash
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs
npm install sonner  # for toast notifications
npm install lucide-react  # for icons
```

---

## Database Schema

### Core Tables

#### `customers`
Stores customer information with WhatsApp number as the unique identifier for dashboard access.

```sql
CREATE TABLE customers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id text UNIQUE,
  username text,
  email text,
  whatsapp text UNIQUE,  -- Used for dashboard access
  alamat text,
  created_at timestamp with time zone DEFAULT now()
);
```

#### `customer_points`
Tracks points balance for each customer.

```sql
CREATE TABLE customer_points (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id text NOT NULL UNIQUE REFERENCES customers(customer_id),
  current_balance integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  total_redeemed integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### `referral_settings`
System-wide configuration for the referral program.

```sql
CREATE TABLE referral_settings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  referral_discount_amount integer NOT NULL DEFAULT 5000,
  referrer_points_earned integer NOT NULL DEFAULT 10,
  points_redemption_minimum integer NOT NULL DEFAULT 50,
  points_redemption_value integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### `referral_usage`
Tracks successful referrals.

```sql
CREATE TABLE referral_usage (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  referral_code text NOT NULL,
  referrer_customer_id text NOT NULL REFERENCES customers(customer_id),
  referred_customer_id text NOT NULL REFERENCES customers(customer_id),
  order_invoice_id text NOT NULL REFERENCES orders(invoice_id),
  discount_applied integer NOT NULL,
  points_awarded integer NOT NULL,
  used_at timestamp with time zone DEFAULT now()
);
```

#### `points_transactions`
History of all points transactions.

```sql
CREATE TABLE points_transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(customer_id),
  transaction_type text NOT NULL,  -- 'earned' or 'redeemed'
  points_change integer NOT NULL,
  balance_after integer NOT NULL,
  reference_type text NOT NULL,  -- 'referral', 'redemption', 'manual_adjustment'
  reference_id text,
  description text,
  created_at timestamp with time zone DEFAULT now()
);
```

#### `orders`
Customer orders with referral tracking.

```sql
CREATE TABLE orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id text UNIQUE,
  customer_id text REFERENCES customers(customer_id),
  total_price integer,
  status text,
  referral_code character varying,
  referral_discount_amount numeric DEFAULT 0,
  points_awarded integer DEFAULT 0,
  points_used integer DEFAULT 0,
  points_discount_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);
```

---

## Architecture

### System Flow

```
1. Customer enters WhatsApp number
         ↓
2. System generates encoded hash link
         ↓
3. Customer accesses dashboard via link
         ↓
4. System decodes hash and validates phone
         ↓
5. System fetches customer data from database
         ↓
6. Dashboard displays personalized information
```

### File Structure

```
src/
├── app/
│   └── referral-dashboard/
│       ├── page.tsx              # Verification entry point
│       └── [hash]/
│           └── page.tsx          # Dashboard with hash validation
├── components/
│   └── Referral/
│       ├── ReferralDashboard.tsx # Main dashboard UI
│       └── PhoneVerification.tsx # Phone input component
├── lib/
│   ├── customer-dashboard-hash.ts    # Hash encoding/decoding utilities
│   └── referral/
│       ├── service.ts                # Referral business logic
│       ├── types.ts                  # TypeScript types
│       └── simple-service.ts         # Simplified service methods
└── utils/
    └── supabase/
        ├── client.ts             # Client-side Supabase client
        └── server.ts             # Server-side Supabase client
```

---

## Implementation Steps

### Step 1: Create Hash Utilities

Create a utility file for encoding and decoding phone numbers:

```typescript
// src/lib/customer-dashboard-hash.ts

/**
 * Create a customer dashboard link with phone number as hash
 */
export function createCustomerDashboardLink(phone: string): string {
  // Clean phone number format
  const cleanPhone = phone.startsWith('+') ? phone : '+' + phone.replace(/\D/g, '');

  // Simple encoding: base64 with URL-safe characters
  const encoded = btoa(cleanPhone)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `/referral-dashboard/${encoded}`;
}

/**
 * Extract phone number from dashboard hash
 */
export function extractPhoneFromHash(hash: string): { phone: string; valid: boolean } {
  if (!hash || typeof hash !== 'string') {
    return { phone: '', valid: false };
  }

  try {
    // Reverse the base64-like encoding
    const paddedHash = hash + '='.repeat((4 - hash.length % 4) % 4);
    const base64Hash = paddedHash.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64Hash);

    // Validate phone number format
    if (decoded && decoded.startsWith('+') && decoded.length >= 12 && /^\+\d+$/.test(decoded)) {
      return { phone: decoded, valid: true };
    }

    return { phone: '', valid: false };
  } catch (error) {
    console.error('Error decoding phone from hash:', error);
    return { phone: '', valid: false };
  }
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  return typeof phone === 'string' &&
         phone.startsWith('+') &&
         phone.length >= 12 &&
         /^\+\d+$/.test(phone);
}
```

### Step 2: Create Supabase Clients

Set up Supabase clients for client and server-side operations:

```typescript
// src/utils/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createClient = () => {
  return createClientComponentClient();
};

// src/utils/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
};
```

### Step 3: Create Referral Types

Define TypeScript types for the referral system:

```typescript
// src/lib/referral/types.ts

export interface ReferralSettings {
  id: number;
  referral_discount_amount: number;
  referrer_points_earned: number;
  points_redemption_minimum: number;
  points_redemption_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerPoints {
  id: number;
  customer_id: string;
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
  created_at: string;
  updated_at: string;
}

export interface ReferralValidationResult {
  valid: boolean;
  referrer_customer_id?: string;
  discount_amount?: number;
  points_awarded?: number;
  error?: string;
}

export interface PointsRedemptionResult {
  valid: boolean;
  discount_amount?: number;
  points_used?: number;
  new_balance?: number;
  error?: string;
}

export interface ReferralUsage {
  id: number;
  referral_code: string;
  referrer_customer_id: string;
  referred_customer_id: string;
  order_invoice_id: string;
  discount_applied: number;
  points_awarded: number;
  used_at: string;
}
```

### Step 4: Create Referral Service

Implement the core referral business logic:

```typescript
// src/lib/referral/service.ts
import { createClient } from "@/utils/supabase/server";
import { ReferralSettings, CustomerPoints, ReferralValidationResult, PointsRedemptionResult, ReferralUsage } from "./types";

export class ReferralService {
  private static instance: ReferralService;
  private supabase = createClient();

  static getInstance(): ReferralService {
    if (!ReferralService.instance) {
      ReferralService.instance = new ReferralService();
    }
    return ReferralService.instance;
  }

  async getReferralSettings(): Promise<ReferralSettings | null> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from("referral_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error && error.code === 'PGRST116') {
      return this.getDefaultSettings();
    }

    if (error) {
      console.error("Error fetching referral settings:", error);
      return null;
    }

    return data;
  }

  private getDefaultSettings(): ReferralSettings {
    return {
      id: 0,
      referral_discount_amount: 5000,
      referrer_points_earned: 10,
      points_redemption_minimum: 50,
      points_redemption_value: 100,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async getCustomerPoints(customerId: string): Promise<CustomerPoints | null> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from("customer_points")
      .select("*")
      .eq("customer_id", customerId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching customer points:", error);
      return null;
    }

    return data;
  }

  async createCustomerPoints(customerId: string): Promise<CustomerPoints | null> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from("customer_points")
      .insert({
        customer_id: customerId,
        current_balance: 0,
        total_earned: 0,
        total_redeemed: 0
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating customer points:", error);
      return null;
    }

    return data;
  }

  async ensureCustomerPoints(customerId: string): Promise<CustomerPoints | null> {
    let customerPoints = await this.getCustomerPoints(customerId);
    if (!customerPoints) {
      customerPoints = await this.createCustomerPoints(customerId);
    }
    return customerPoints;
  }
}
```

### Step 5: Create Phone Verification Component

Build the phone input component for dashboard entry:

```typescript
// src/components/Referral/PhoneVerification.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomerDashboardLink } from "@/lib/customer-dashboard-hash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function PhoneVerification() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone) {
      toast.error("Please enter your WhatsApp number");
      return;
    }

    setIsLoading(true);

    try {
      // Clean phone number
      const cleanPhone = phone.startsWith('+') ? phone : '+' + phone.replace(/\D/g, '');

      // Create dashboard link
      const dashboardLink = createCustomerDashboardLink(cleanPhone);

      // Navigate to dashboard
      router.push(dashboardLink);
    } catch (error) {
      console.error("Error creating dashboard link:", error);
      toast.error("Failed to access dashboard. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-2">
          WhatsApp Number
        </label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+6281234567890"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter your WhatsApp number with country code
        </p>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Processing..." : "Access Dashboard"}
      </Button>
    </form>
  );
}
```

### Step 6: Create Dashboard Page with Hash Validation

Implement the main dashboard page with hash-based validation:

```typescript
// src/app/referral-dashboard/[hash]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { extractPhoneFromHash } from "@/lib/customer-dashboard-hash";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface CustomerData {
  customer_id: string;
  username?: string;
  email?: string;
  whatsapp?: string;
}

interface PointsData {
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
}

export default function ReferralDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const hash = params.hash as string;

      if (!hash) {
        setError("Invalid link");
        setIsLoading(false);
        return;
      }

      try {
        // Extract phone from hash
        const { phone, valid } = extractPhoneFromHash(hash);

        if (!valid || !phone) {
          setError("Invalid or expired link");
          setIsLoading(false);
          return;
        }

        // Query customer by phone
        const supabase = createClient();
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('whatsapp', phone)
          .single();

        if (customerError || !customer) {
          setError("Customer not found");
          setIsLoading(false);
          return;
        }

        setCustomerData(customer);

        // Fetch customer points
        const { data: points, error: pointsError } = await supabase
          .from('customer_points')
          .select('*')
          .eq('customer_id', customer.customer_id)
          .single();

        if (!pointsError && points) {
          setPointsData(points);
        } else {
          // Set default points if none exist
          setPointsData({
            current_balance: 0,
            total_earned: 0,
            total_redeemed: 0
          });
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard");
        toast.error("An error occurred. Please try again.");

        setTimeout(() => {
          router.push("/referral-dashboard");
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [params.hash, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Access Failed</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!customerData || !pointsData) {
    return <div>No data found</div>;
  }

  // Render dashboard UI
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Welcome, {customerData.username || customerData.email || 'Customer'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Current Balance</h3>
          <p className="text-3xl font-bold text-blue-600">{pointsData.current_balance}</p>
          <p className="text-sm text-gray-600">points</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Total Earned</h3>
          <p className="text-3xl font-bold text-green-600">{pointsData.total_earned}</p>
          <p className="text-sm text-gray-600">points</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Total Redeemed</h3>
          <p className="text-3xl font-bold text-purple-600">{pointsData.total_redeemed}</p>
          <p className="text-sm text-gray-600">points</p>
        </div>
      </div>

      {/* Your referral code */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-2">Your Referral Code</h3>
        <p className="text-xl font-mono bg-white p-3 rounded border">
          {customerData.customer_id}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Share this code with friends to earn points!
        </p>
      </div>
    </div>
  );
}
```

### Step 7: Create Verification Entry Page

Create the main entry point for dashboard access:

```typescript
// src/app/referral-dashboard/page.tsx
import { PhoneVerification } from "@/components/Referral/PhoneVerification";

export default function ReferralDashboardPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-2 text-center">Referral Dashboard</h1>
        <p className="text-gray-600 text-center mb-6">
          Enter your WhatsApp number to access your dashboard
        </p>
        <PhoneVerification />
      </div>
    </div>
  );
}
```

### Step 8: Add Enhanced Features (Optional)

#### Transaction History Component

```typescript
// Add to your dashboard page
const { data: transactions } = await supabase
  .from('points_transactions')
  .select('*')
  .eq('customer_id', customerData.customer_id)
  .order('created_at', { ascending: false })
  .limit(10);
```

#### Order History Component

```typescript
// Add to your dashboard page
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .eq('customer_id', customerData.customer_id)
  .order('created_at', { ascending: false });
```

#### Referral Statistics

```typescript
// Calculate referral stats
const { count: totalReferrals } = await supabase
  .from('referral_usage')
  .select('*', { count: 'exact', head: true })
  .eq('referrer_customer_id', customerData.customer_id);
```

---

## Security Considerations

### Hash Security

1. **Encoding Method**: The current implementation uses base64 encoding for simplicity. For production, consider:
   - Using JWT tokens with expiration
   - Implementing proper encryption
   - Adding timestamp validation

2. **No Persistent Sessions**: The current approach validates against the database on each access without creating persistent sessions.

3. **Recommendations for Production**:
   ```typescript
   // Enhanced security with JWT
   import { sign, verify } from 'jsonwebtoken';

   // Create token with expiration
   const token = sign(
     { phone, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, // 1 hour
     process.env.DASHBOARD_SECRET
   );
   ```

### Access Logging

Consider implementing access logging for audit purposes:

```typescript
// Log dashboard access
await supabase.from('dashboard_access_logs').insert({
  phone: phone,
  hash: hash,
  ip_address: ipAddress,
  user_agent: userAgent,
  action: 'dashboard_access',
  success: true,
  created_at: new Date().toISOString()
});
```

### Rate Limiting

Implement rate limiting for the verification endpoint to prevent abuse.

---

## API Reference

### Hash Utilities

#### `createCustomerDashboardLink(phone: string): string`
Creates a dashboard access link from a phone number.

**Parameters:**
- `phone` - Phone number with or without + prefix

**Returns:** Dashboard URL path with encoded phone

#### `extractPhoneFromHash(hash: string): { phone: string; valid: boolean }`
Extracts and validates phone number from hash.

**Parameters:**
- `hash` - Encoded hash from URL

**Returns:** Object with phone number and validity flag

#### `isValidPhone(phone: string): boolean`
Validates phone number format.

**Parameters:**
- `phone` - Phone number to validate

**Returns:** Boolean indicating validity

### Referral Service Methods

#### `getReferralSettings(): Promise<ReferralSettings | null>`
Retrieves active referral settings.

#### `getCustomerPoints(customerId: string): Promise<CustomerPoints | null>`
Gets points balance for a customer.

#### `ensureCustomerPoints(customerId: string): Promise<CustomerPoints | null>`
Ensures customer has a points record, creates if missing.

---

## Troubleshooting

### Common Issues

#### 1. "Customer not found" Error

**Cause:** No customer exists with the provided WhatsApp number.

**Solution:**
- Verify the phone number format includes country code
- Check if customer exists in the database
- Ensure `whatsapp` field is populated correctly

#### 2. Hash Decoding Fails

**Cause:** Invalid hash format or corrupted URL.

**Solution:**
- Ensure hash is not URL-encoded twice
- Check for special characters in the phone number
- Verify base64 padding is handled correctly

#### 3. Points Display as Zero

**Cause:** Customer has no record in `customer_points` table.

**Solution:**
- Use `ensureCustomerPoints()` method to auto-create records
- Check if referral system is active in `referral_settings`

#### 4. Dashboard Loads Slowly

**Cause:** Multiple database queries without optimization.

**Solution:**
- Implement caching for frequently accessed data
- Use database indexes on `customer_id` and `whatsapp` fields
- Consider using a GraphQL API to reduce round trips

### Database Queries for Debugging

```sql
-- Check if customer exists
SELECT * FROM customers WHERE whatsapp = '+6281234567890';

-- Check customer points
SELECT * FROM customer_points WHERE customer_id = 'CUSTOMER_ID';

-- Verify referral settings
SELECT * FROM referral_settings WHERE is_active = true;

-- Check recent transactions
SELECT * FROM points_transactions
WHERE customer_id = 'CUSTOMER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Next Steps

After implementing the basic dashboard:

1. **Add Notification System**: Notify customers when they earn points
2. **Implement Leaderboard**: Show top referrers
3. **Add Export Feature**: Allow customers to export their history
4. **Create Admin Panel**: Build admin interface for managing referrals
5. **A/B Testing**: Test different reward amounts and strategies

---

## Support

For issues or questions about this implementation:
- Check the existing codebase in `src/lib/referral/` and `src/app/referral-dashboard/`
- Review the database schema in `schema.sql`
- Consult the Supabase documentation for database operations
