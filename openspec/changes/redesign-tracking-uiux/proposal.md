# Tracking Page UI/UX Redesign

## Why

The current tracking page has a dated appearance and lacks modern UI patterns. Additionally, important customer engagement features (referral code, points balance, and monetization ads) are not integrated into the tracking experience, missing opportunities for customer retention and revenue generation.

## What Changes

- **Add promotional ads banner** at the top of the tracking page with clickable images that redirect to website links
- **Integrate customer referral code display** directly on the tracking page with copy-to-clipboard functionality
- **Add points balance display** showing total earned points, redeemed points, and current balance
- **Enhance invoice items display** with improved visual hierarchy and modern styling for order items and services
- **Modernize UI components** with improved visual hierarchy, spacing, and micro-interactions
- **Maintain design consistency** using existing color palette (primary purple-blue, secondary colors)
- **Improve responsive layout** for better mobile and desktop experience
- **Add data fetching** for customer referral code and points from Supabase

## Impact

- **Affected specs:**
  - New spec: `tracking-page` (comprehensive tracking page requirements)
- **Affected code:**
  - `src/components/Tracking/TrackingDesktop.tsx` - Major UI restructuring
  - `src/components/Tracking/TrackingMobile.tsx` - Major UI restructuring
  - `src/app/tracking/[slug]/page.tsx` - Enhanced data fetching
  - New components: `src/components/Tracking/AdsBanner.tsx`, `src/components/Tracking/ReferralCard.tsx`, `src/components/Tracking/PointsCard.tsx`, `src/components/Tracking/InvoiceItems.tsx`
- **Backward compatibility:** Maintains existing order tracking functionality while adding new features
- **Performance:** Minimal impact with proper data loading strategies
