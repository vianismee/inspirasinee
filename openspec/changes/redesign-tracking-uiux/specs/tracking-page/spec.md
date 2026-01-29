# Tracking Page Specification

## ADDED Requirements

### Requirement: Ads Banner Display
The tracking page SHALL display a promotional ads banner at the top of the page that shows clickable images and redirects to configured website links.

#### Scenario: Display active ad banner
- **WHEN** a user visits the tracking page and active ads are configured
- **THEN** the system SHALL display the ad banner at the top of the page
- **AND** the banner SHALL show the configured image with proper alt text
- **AND** clicking the banner SHALL open the configured link in a new tab

#### Scenario: Handle no active ads
- **WHEN** a user visits the tracking page and no active ads are configured
- **THEN** the system SHALL NOT display the ad banner
- **AND** the page layout SHALL remain intact without empty space

#### Scenario: Collapsible ads on mobile
- **WHEN** a user views the tracking page on a mobile device
- **THEN** the ad banner SHALL include a collapse/dismiss button
- **AND** clicking dismiss SHALL hide the banner for the current session
- **AND** the page layout SHALL adjust smoothly after dismissal

### Requirement: Customer Referral Code Display
The tracking page SHALL display the customer's referral code with copy-to-clipboard functionality.

#### Scenario: Display referral code
- **WHEN** a customer views their tracking page and has a referral code
- **THEN** the system SHALL display a card showing their referral code
- **AND** the code SHALL be displayed in a prominent, easy-to-read format
- **AND** the card SHALL include a "Copy" button

#### Scenario: Copy referral code to clipboard
- **WHEN** a customer clicks the "Copy" button on their referral code
- **THEN** the system SHALL copy the referral code to the clipboard
- **AND** the button text SHALL change to "Copied!" temporarily
- **AND** a success toast message SHALL be displayed

#### Scenario: Handle missing referral code
- **WHEN** a customer views their tracking page and does not have a referral code
- **THEN** the system SHALL display a message inviting them to get a referral code
- **AND** a call-to-action button SHALL be shown to navigate to the referral program

#### Scenario: Display referral statistics
- **WHEN** a customer views their tracking page
- **THEN** the system SHALL display the total number of referrals made
- **AND** the system SHALL display total points earned from referrals

### Requirement: Points Balance Display
The tracking page SHALL display the customer's points balance including total earned, total redeemed, and current balance.

#### Scenario: Display points summary
- **WHEN** a customer views their tracking page
- **THEN** the system SHALL display a card showing:
  - Current points balance (prominently displayed)
  - Total points earned (with + indicator)
  - Total points redeemed (with - indicator)
- **AND** the values SHALL be formatted with proper thousands separators

#### Scenario: Handle new customer with no points
- **WHEN** a customer views their tracking page and has no points history
- **THEN** the system SHALL display 0 for all points values
- **AND** an encouraging message SHALL be shown about earning points

#### Scenario: Points visual hierarchy
- **WHEN** displaying points information
- **THEN** the current balance SHALL be the largest and most prominent
- **AND** earned points SHALL be styled in green
- **AND** redeemed points SHALL be styled in red
- **AND** the card SHALL use the primary purple-blue theme for consistency

### Requirement: Enhanced Invoice Items Display
The tracking page SHALL display the items and services within the current invoice in a modern, easy-to-read format with clear visual hierarchy.

#### Scenario: Display invoice items
- **WHEN** a customer views their tracking page
- **THEN** the system SHALL display all items in the current invoice grouped by shoe/product name
- **AND** each item SHALL show:
  - Product/shoe name (prominently displayed)
  - List of services with individual pricing
  - Icons or visual indicators for service types
- **AND** items SHALL be visually distinct and easy to scan

#### Scenario: Service item display
- **WHEN** displaying services within an item
- **THEN** each service SHALL be displayed as a separate line item
- **AND** SHALL show:
  - Service name (e.g., "Deep Clean", "Repaint")
  - Individual service price
  - Quantity if applicable
- **AND** the pricing SHALL be clearly aligned to the right

#### Scenario: Visual enhancements for items
- **WHEN** displaying invoice items
- **THEN** each item group SHALL have:
  - Subtle background color or border for separation
  - Product icon or thumbnail (if available)
  - Collapsible/expandable option on mobile for long lists
- **AND** hover effects on desktop to highlight item rows

#### Scenario: Empty invoice items
- **WHEN** an invoice has no items (edge case)
- **THEN** the system SHALL display an empty state message
- **AND** the message SHALL indicate no items found in this invoice

### Requirement: Responsive Layout
The tracking page SHALL maintain a responsive layout that works optimally on mobile, tablet, and desktop devices.

#### Scenario: Desktop layout
- **WHEN** a customer views the tracking page on a desktop device (≥1024px)
- **THEN** the system SHALL display a multi-column layout
- **AND** the order details and status SHALL be prominently displayed
- **AND** new features (referral, points, invoices) SHALL be integrated in a balanced layout

#### Scenario: Mobile layout
- **WHEN** a customer views the tracking page on a mobile device (<768px)
- **THEN** the system SHALL display a single-column vertical layout
- **AND** all sections SHALL stack in a logical order
- **AND** the layout SHALL be scrollable with smooth navigation

#### Scenario: Tablet layout
- **WHEN** a customer views the tracking page on a tablet device (768px-1023px)
- **THEN** the system SHALL display an optimized layout between mobile and desktop
- **AND** columns SHALL adapt gracefully
- **AND** touch targets SHALL be appropriately sized

### Requirement: Design Consistency
The tracking page redesign SHALL maintain visual consistency with the existing design system and color palette.

#### Scenario: Use existing color palette
- **WHEN** styling the new tracking page components
- **THEN** the system SHALL use the existing CSS variables:
  - Primary: `oklch(0.4593 0.2821 266.9842)` (purple-blue)
  - Secondary: `oklch(0.1884 0.0128 248.5103)` (dark blue)
  - Accent: `oklch(0.9392 0.0166 250.8453)` (light blue)
- **AND** semantic colors for points (green/red) and status

#### Scenario: Maintain component patterns
- **WHEN** creating new UI components
- **THEN** the system SHALL follow existing component patterns:
  - Use Card components with shadow and rounded corners
  - Use Badge components for status indicators
  - Use Button components with consistent variants
  - Apply consistent spacing using Tailwind utilities

#### Scenario: Dark mode support
- **WHEN** a customer has dark mode enabled
- **THEN** all new components SHALL properly support dark mode
- **AND** colors SHALL adapt using CSS variables
- **AND** readability SHALL be maintained in both themes

### Requirement: Data Fetching Performance
The tracking page SHALL fetch enrichment data efficiently without impacting page load performance.

#### Scenario: Parallel data fetching
- **WHEN** loading the tracking page
- **THEN** the system SHALL fetch order data, referral data, points data, and invoice history in parallel
- **AND** the page SHALL not block rendering while waiting for enrichment data

#### Scenario: Graceful degradation
- **WHEN** enrichment data fails to load
- **THEN** the system SHALL still display the core order tracking information
- **AND** new sections SHALL show empty states or loading errors gracefully
- **AND** the page SHALL remain functional

#### Scenario: Loading states
- **WHEN** enrichment data is being fetched
- **THEN** the system SHALL display skeleton loaders or loading indicators
- **AND** the loading states SHALL match the component structure

### Requirement: Accessibility
The tracking page redesign SHALL be accessible to all users including those using assistive technologies.

#### Scenario: Keyboard navigation
- **WHEN** a user navigates the tracking page using only a keyboard
- **THEN** all interactive elements SHALL be reachable via Tab key
- **AND** focus indicators SHALL be clearly visible
- **AND** the tab order SHALL follow logical page flow

#### Scenario: Screen reader support
- **WHEN** a user accesses the tracking page using a screen reader
- **THEN** all images SHALL have descriptive alt text
- **AND** buttons and links SHALL have accessible labels
- **AND** semantic HTML SHALL be used (headings, landmarks, lists)

#### Scenario: Touch target sizes
- **WHEN** a user interacts with the tracking page on a touch device
- **THEN** all interactive elements SHALL have minimum touch target size of 44x44 pixels
- **AND** buttons SHALL be appropriately sized for easy tapping

### Requirement: Existing Functionality Preservation
The tracking page redesign SHALL preserve all existing order tracking functionality without breaking changes.

#### Scenario: Order status timeline
- **WHEN** a customer views their tracking page
- **THEN** the existing order status timeline SHALL remain functional
- **AND** the timeline SHALL show: ongoing → pending → cleaning → finish
- **AND** the current status SHALL be clearly highlighted

#### Scenario: Order details display
- **WHEN** a customer views their tracking page
- **THEN** all existing order details SHALL be displayed:
  - Customer information (name, phone, address)
  - Order items and services
  - Payment method and status
  - Order total with discounts
  - Referral and points discounts (if applicable)

#### Scenario: Action buttons
- **WHEN** a customer views their tracking page
- **THEN** all existing action buttons SHALL remain functional:
  - Dashboard Pelanggan (navigate to customer dashboard)
  - Hubungi Kami (WhatsApp contact)
  - Complain (when order is finished)
- **AND** buttons SHALL maintain their existing behavior

#### Scenario: Invoice validation
- **WHEN** a customer accesses an invalid invoice ID
- **THEN** the system SHALL display an appropriate error message
- **AND** the error handling SHALL match existing behavior
