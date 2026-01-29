# Design Document: Tracking Page UI/UX Redesign

## Context

The tracking page is a customer-facing feature that displays order status and details. Currently, it only shows order information without leveraging opportunities for customer engagement and retention. This redesign aims to modernize the UI while integrating referral, points, and invoice features to create a more comprehensive customer experience.

### Stakeholders
- Customers viewing their order status
- Business owners (monetization through ads)
- Customer support (reduced inquiries through self-service)

### Constraints
- Must maintain existing order tracking functionality
- Must use existing color palette and design system
- Must be responsive (mobile and desktop)
- Should minimize performance impact

## Goals / Non-Goals

### Goals
1. Modernize the tracking page UI with better visual hierarchy
2. Display customer referral code with easy copying
3. Show points balance (earned, redeemed, current balance)
4. Display invoice history for quick access
5. Add monetization through clickable ad banners
6. Maintain consistent design language with existing app

### Non-Goals
- Complete redesign of the entire app
- Changing the order tracking timeline/status logic
- Adding new backend services beyond Supabase
- Implementing ad management system (manual configuration initially)

## Decisions

### 1. Component Architecture
**Decision:** Create modular, reusable components for each new section (AdsBanner, ReferralCard, PointsCard, InvoiceList).

**Rationale:**
- Easier to maintain and test
- Can be reused in other parts of the app (dashboard, profile page)
- Follows existing component patterns in the codebase
- Allows for independent updates and changes

**Alternatives considered:**
- Monolithic component with all features: Too complex, hard to maintain
- Server components only: Would limit interactivity (copy to clipboard, etc.)

### 2. Data Fetching Strategy
**Decision:** Fetch enrichment data (referral, points, invoices) on the server side in the page component and pass to client components.

**Rationale:**
- Reduces client-side JavaScript
- Better SEO and initial load performance
- Leverages Next.js 15 server components
- Maintains existing pattern used in tracking page

**Alternatives considered:**
- Client-side fetching: Would increase bundle size and cause loading states
- Separate API routes: Unnecessary complexity for read-only data

### 3. Ads Banner Implementation
**Decision:** Implement as a configurable image banner with external link support.

**Rationale:**
- Simple to implement and maintain
- No external ad network dependencies initially
- Full control over displayed content
- Can be extended later with analytics or ad network integration

**Configuration:**
- Store ad configuration in environment variables or a simple config file
- Support multiple ads with rotation or single banner
- Track clicks via simple analytics (optional)

### 4. Layout Structure
**Decision:** Use a vertical stacking layout with the following order:
1. Ads Banner (top, collapsible on mobile)
2. Order Status & Details (existing content, slightly compressed)
3. Invoice Items Display (enhanced styling)
4. Points Balance Card
5. Referral Code Card

**Rationale:**
- Most important info (order status) remains accessible
- Engaging features (referral, points) are prominent
- Logical flow from status → rewards → history
- Works well on both mobile and desktop

**Desktop variations:**
- Consider 2-column layout with order status on left, new features on right
- Keep vertical single-column for consistency on mobile
- Invoice items displayed prominently within order details card

### 5. Color Scheme & Styling
**Decision:** Use existing CSS variables and color palette:
- Primary: `oklch(0.4593 0.2821 266.9842)` (purple-blue)
- Points: Green for earned, red for redeemed, blue for balance
- Referral: Purple theme matching primary
- Ads: Neutral styling to not compete with content

**Rationale:**
- Maintains brand consistency
- Leverages existing design tokens
- Reduces design decisions and potential inconsistencies

### 6. Invoice Items Display
**Decision:** Enhance the existing invoice items display with modern styling and better visual hierarchy.

**Rationale:**
- Invoice items are already part of the order details
- Customers need to see what services/products they ordered
- Modern styling improves readability
- No additional data fetching required

## Data Models

### Ads Configuration
```typescript
interface AdConfig {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
}
```

### Points Data
```typescript
interface PointsData {
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
}
```

### Referral Data
```typescript
interface ReferralData {
  code: string;
  totalReferrals: number;
  totalPointsEarned: number;
}
```

### Invoice Items (Enhanced Display)
```typescript
interface InvoiceItemDisplay {
  shoe_name: string;
  services: Array<{
    service: string;
    amount: number;
    quantity?: number;
  }>;
  // For enhanced display features
  thumbnailUrl?: string;
  category?: string;
}
```

## Risks / Trade-offs

### Risk: Performance Impact
**Risk:** Additional data fetching could slow down page load.

**Mitigation:**
- Use parallel data fetching
- Implement proper caching headers
- Consider loading states for non-critical sections
- Optimize database queries with proper indexes

### Risk: Data Availability
**Risk:** Not all customers may have referral codes or points data.

**Mitigation:**
- Gracefully handle missing data
- Show empty states with helpful messages
- Provide "Get Referral Code" call-to-action when missing
- Default to 0 for points if not available

### Risk: Mobile Usability
**Risk:** Additional content could make mobile page too long.

**Mitigation:**
- Use collapsible sections where appropriate
- Optimize spacing and typography
- Consider lazy loading for invoice list
- Ensure smooth scrolling navigation

### Trade-off: Ad Placement
**Trade-off:** Ads at the top may distract from primary order status.

**Decision:** Place ads at top but make them:
- Subtle and not intrusive
- Dismissible on mobile
- Relevant to business (promotions, not external spam)

## Migration Plan

### Phase 1: Foundation
1. Create data fetching functions
2. Build new components in isolation
3. Test components independently

### Phase 2: Integration
1. Update tracking page to fetch enrichment data
2. Integrate components into desktop layout
3. Integrate components into mobile layout
4. Test full page with real data

### Phase 3: Polish
1. Responsive testing across devices
2. Accessibility audit
3. Performance optimization
4. Final design tweaks

### Rollout Plan
- Feature flag for gradual rollout
- Monitor performance metrics
- Gather user feedback
- Full rollout after validation

### Rollback Plan
- Keep existing tracking components unchanged
- New sections can be toggled off via config
- Database changes are additive (no destructive changes)

## Open Questions

1. **Ads Management:** Should we build a simple admin interface for managing ads, or is config file sufficient?
   - Recommendation: Start with config file, add admin UI if needed

2. **Invoice Items Layout:** How should we group and display multiple items/services?
   - Recommendation: Group by shoe/product name, show services as nested list with clear pricing alignment

3. **Points Display:** Should we show points transaction history or just summary?
   - Recommendation: Just summary on tracking page, full history on dashboard

4. **Referral Rewards:** What information should we show about referral program?
   - Recommendation: Show code and basic stats, link to full program details

5. **Ad Frequency:** How often should ads rotate? Should we show different ads on mobile vs desktop?
   - Recommendation: Start with single ad, add rotation if multiple ads available
