# Tracking Page UI/UX Redesign - Visual Design Reference

## Color Palette (from existing design system)

### Primary Colors
```
Primary:        oklch(0.4593 0.2821 266.9842)  → Purple-Blue (#6366f1 / Indigo-500)
Secondary:      oklch(0.1884 0.0128 248.5103)  → Dark Blue (#1e3a5f)
Accent:         oklch(0.9392 0.0166 250.8453)  → Light Blue (#e0e7ff)
```

### Semantic Colors for New Features
```
Points Earned:      Green theme (#22c55e / bg-green-50)
Points Redeemed:    Red theme (#ef4444 / bg-red-50)
Points Balance:     Blue theme (#3b82f6 / bg-blue-50)
Referral:           Purple theme (#a855f7 / bg-purple-50)
Success:            Green-600 (#16a34a)
```

---

## Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              [Logo]                                         │
│                         Tracking Page Header                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    ┌──────────────────────────────────┐                    │
│   ╔═══════════════╗│  🎯 PROMOTIONAL ADS BANNER       │                    │
│   ║ CLICKABLE AD ║│  [Image Banner - Full Width]      │   ← Collapsible   │
│   ╚═══════════════╝│  Click to visit: [website-link]  │      on mobile     │
│                    └──────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │                                     │  │                             │  │
│  │     ORDER STATUS & DETAILS          │  │      POINTS BALANCE          │  │
│  │  ┌─────────────────────────────┐   │  │  ┌─────────────────────┐   │  │
│  │  │ Invoice: INV-2024-001       │   │  │  │   1,250              │   │  │
│  │  │ Status: Cleaning            │   │  │  │   Points Balance     │   │  │
│  │  │                             │   │  │  └─────────────────────┘   │  │
│  │  │  ┌───┐   ┌───┐   ┌───┐   ┐ │   │  │  ┌──────────┬──────────┐   │  │
│  │  │  │○  │──▶│●  │──▶│ ○ │   │ │   │  │  │  +2,500   │  -1,250  │   │  │
│  │  │  └───┘   └───┘   └───┘   ┘ │   │  │  │  Earned   │ Redeemed │   │  │
│  │  │  Ongoing  Pending  Cleaning │   │  │  └──────────┴──────────┘   │  │
│  │  │                    Finish   │   │  │                             │  │
│  │  └─────────────────────────────┘   │  │     [View Points History]   │  │
│  │                                     │  │                             │  │
│  │  ┌─────────────────────────────┐   │  └─────────────────────────────┘  │
│  │  │ 👤 John Doe                 │   │  ┌─────────────────────────────┐  │
│  │  │ 📞 +62 812-3456-7890        │   │  │                             │  │
│  │  │ 📍 Jl. Sudirman No. 123     │   │  │     REFERRAL CODE           │  │
│  │  └─────────────────────────────┘   │  │  ┌─────────────────────┐   │  │
│  │                                     │  │  │   INSPIRA2024        │   │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │  │  └─────────────────────┘   │  │
│  │  📦 INVOICE ITEMS                  │   │  │  [📋 Copy Code]           │  │
│  │  ┌─────────────────────────────┐   │  │  └─────────────────────┘   │  │
│  │  │ 👟 Nike Air Max             │   │  │  ┌──────────┬──────────┐   │  │
│  │  │   • Deep Clean        75K  │   │  │  │    12     │  +600    │   │  │
│  │  │   • Repaint           50K  │   │  │  │ Referrals │  Points  │   │  │
│  │  │   • Premium Sole      25K  │   │  │  └──────────┴──────────┘   │  │
│  │  │                        ─────│   │  │                             │  │
│  │  │   Subtotal:          150K  │   │  └─────────────────────────────┘  │
│  │  └─────────────────────────────┘   │                                     │
│  │  ┌─────────────────────────────┐   │                                     │
│  │  │ 👟 Adidas Ultraboost        │   │                                     │
│  │  │   • Fast Clean         50K  │   │                                     │
│  │  │   • Whitening          40K  │   │                                     │
│  │  │                        ─────│   │                                     │
│  │  │   Subtotal:           90K   │   │                                     │
│  │  └─────────────────────────────┘   │                                     │
│  │                                     │                                     │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │                                     │
│  │  💳 ORDER SUMMARY                  │                                     │
│  │  Subtotal:           Rp 240.000    │                                     │
│  │  Discount (REF2024):  -Rp 20.000   │                                     │
│  │  Points (250 pts):     -Rp 25.000  │                                     │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │                                     │
│  │  TOTAL:              Rp 195.000    │                                     │
│  │                                     │                                     │
│  │  ┌─────────────────────────────┐   │                                     │
│  │  │ [👤 Dashboard Pelanggan]    │   │                                     │
│  │  │ [💬 Hubungi Kami]           │   │                                     │
│  │  │ [📝 Complain]               │   │                                     │
│  │  └─────────────────────────────┘   │                                     │
│  │                                     │                                     │
│  └─────────────────────────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Mobile Layout (<768px)

```
┌──────────────────────────────┐
│         [Logo]               │
│     Tracking Page Header     │
└──────────────────────────────┘

┌──────────────────────────────┐
│  ╔═════════════════════════╗ │
│  ║ 🎯 [AD BANNER]    [×]   ║ │ ← Dismissible
│  ╚═════════════════════════╝ │
└──────────────────────────────┘

┌──────────────────────────────┐
│                              │
│    ORDER STATUS CARD         │
│  ┌────────────────────────┐  │
│  │  INV-2024-001          │  │
│  │  ● Cleaning            │  │
│  │                        │  │
│  │  ┌──┐  ┌──┐  ┌──┐  ┌──┐│  │
│  │  │○ │─▶│● │─▶│○ │─▶│○ ││  │
│  │  └──┘  └──┘  └──┘  └──┘│  │
│  └────────────────────────┘  │
│                              │
│  Customer Details            │
│  (scrollable content)        │
└──────────────────────────────┘

┌──────────────────────────────┐
│                              │
│    INVOICE ITEMS CARD        │
│  ┌────────────────────────┐  │
│  │ 👟 Nike Air Max        │  │
│  │   • Deep Clean    75K  │  │
│  │   • Repaint       50K  │  │
│  │   • Premium Sole  25K  │  │
│  │   ─────────────────     │  │
│  │   Subtotal:       150K  │  │
│  ├────────────────────────┤  │
│  │ 👟 Adidas Ultraboost   │  │
│  │   • Fast Clean     50K  │  │
│  │   • Whitening      40K  │  │
│  │   ─────────────────     │  │
│  │   Subtotal:        90K  │  │
│  └────────────────────────┘  │
│                              │
│  Order Summary               │
│  Subtotal:      Rp 240.000   │
│  Discounts:     -Rp 45.000   │
│  ────────────────────────    │
│  TOTAL:         Rp 195.000   │
└──────────────────────────────┘

┌──────────────────────────────┐
│                              │
│    POINTS BALANCE CARD       │
│  ┌────────────────────────┐  │
│  │      1,250             │  │
│  │   Points Balance       │  │
│  │                        │  │
│  │  ┌────────┬──────────┐ │  │
│  │  │+2,500  │ -1,250   │ │  │
│  │  │Earned  │Redeemed  │ │  │
│  │  └────────┴──────────┘ │  │
│  └────────────────────────┘  │
└──────────────────────────────┘

┌──────────────────────────────┐
│                              │
│    REFERRAL CODE CARD        │
│  ┌────────────────────────┐  │
│  │     INSPIRA2024        │  │
│  │                        │  │
│  │   [📋 Copy Code]       │  │
│  │                        │  │
│  │  ┌────────┬──────────┐ │  │
│  │  │   12   │  +600    │ │  │
│  │  │Referrals│Points  │ │  │
│  │  └────────┴──────────┘ │  │
│  └────────────────────────┘  │
└──────────────────────────────┘

┌──────────────────────────────┐
│  [👤 Dashboard Pelanggan]    │
│  [💬 Hubungi Kami]           │
│  [📝 Complain]               │
└──────────────────────────────┘
```

---

## Component Visual Specifications

### 1. Ads Banner Component

**Light Mode:**
```tsx
// Border: 1px solid oklch(0.741 0.0064 223.48)
// Background: oklch(0.9392 0.0166 250.84) (accent)
// Shadow: lg
// Radius: 0.525rem
```

**Dark Mode:**
```tsx
// Border: 1px solid oklch(0.2674 0.0047 248.00)
// Background: oklch(0.1928 0.0331 242.54) (accent)
```

### 2. Points Balance Card

**Visual Style:**
```tsx
<Card className="shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
  <CardContent className="pt-6">
    {/* Large balance display */}
    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
      1,250
    </div>

    {/* Earned / Redeemed split */}
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
        <div className="text-green-700 dark:text-green-400">+2,500</div>
        <div className="text-xs text-green-600">Earned</div>
      </div>
      <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
        <div className="text-red-700 dark:text-red-400">-1,250</div>
        <div className="text-xs text-red-600">Redeemed</div>
      </div>
    </div>
  </CardContent>
</Card>
```

### 3. Referral Code Card

**Visual Style:**
```tsx
<Card className="shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Gift className="w-5 h-5 text-purple-600" />
      Kode Referral Kamu
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Code display */}
    <div className="bg-purple-100 dark:bg-purple-900 border-2 border-purple-300 dark:border-purple-700 p-4 rounded-lg">
      <div className="text-lg font-mono font-bold text-purple-800 dark:text-purple-200 text-center">
        INSPIRA2024
      </div>
    </div>

    {/* Copy button */}
    <Button className="w-full bg-purple-600 hover:bg-purple-700">
      <Copy className="w-4 h-4 mr-2" />
      Salin Kode Referral
    </Button>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-3 mt-4">
      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-center">
        <div className="text-2xl font-bold text-blue-600">12</div>
        <div className="text-xs text-blue-600">Total Referral</div>
      </div>
      <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-center">
        <div className="text-2xl font-bold text-green-600">+600</div>
        <div className="text-xs text-green-600">Poin dari Referral</div>
      </div>
    </div>
  </CardContent>
</Card>
```

### 4. Invoice Items Display (Enhanced)

**Visual Style:**
```tsx
<Card className="shadow-lg bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Package className="w-5 h-5 text-indigo-600" />
      📦 Invoice Items
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">

    {/* Item Group 1 */}
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-indigo-500 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        {/* Product Icon/Thumbnail */}
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
          👟
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">
            Nike Air Max
          </h4>

          {/* Services List */}
          <div className="mt-3 space-y-2">
            {[
              { name: 'Deep Clean', price: 75000, icon: '🧹' },
              { name: 'Repaint', price: 50000, icon: '🎨' },
              { name: 'Premium Sole', price: 25000, icon: '👟' },
            ].map((service, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-base">{service.icon}</span>
                  <span className="text-gray-700 dark:text-gray-300">{service.name}</span>
                </div>
                <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                  Rp {(service.price / 1000).toFixed(0)}K
                </span>
              </div>
            ))}
          </div>

          {/* Subtotal */}
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Rp 150.000</span>
          </div>
        </div>
      </div>
    </div>

    {/* Item Group 2 */}
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500 hover:shadow-md transition-all">
      {/* Similar structure for second item */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
          👟
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">
            Adidas Ultraboost
          </h4>
          {/* ... services list ... */}
        </div>
      </div>
    </div>

  </CardContent>
</Card>
```

### 5. Order Summary Section

**Visual Style:**
```tsx
<div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
    <CreditCard className="w-5 h-5 text-indigo-600" />
    💳 Order Summary
  </h4>

  <div className="space-y-3">
    {/* Subtotal */}
    <div className="flex justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
      <span className="font-mono font-medium">Rp 240.000</span>
    </div>

    {/* Referral Discount */}
    <div className="flex justify-between text-sm items-center bg-green-50 dark:bg-green-950 p-2 rounded">
      <span className="text-green-700 dark:text-green-400">
        💰 Referral (INSPIRA2024)
      </span>
      <span className="font-mono font-bold text-green-700 dark:text-green-400">
        -Rp 20.000
      </span>
    </div>

    {/* Points Redemption */}
    <div className="flex justify-between text-sm items-center bg-orange-50 dark:bg-orange-950 p-2 rounded">
      <span className="text-orange-700 dark:text-orange-400">
        🎯 Points (250 pts)
      </span>
      <span className="font-mono font-bold text-orange-700 dark:text-orange-400">
        -Rp 25.000
      </span>
    </div>

    <Separator className="my-2" />

    {/* Total */}
    <div className="flex justify-between items-center font-bold text-lg">
      <span>Total</span>
      <span className="font-mono text-indigo-600 dark:text-indigo-400">
        Rp 195.000
      </span>
    </div>
  </div>
</div>
```

---

## Spacing & Typography

### Typography Scale
```
Heading Large:   text-4xl font-bold    (Points balance, Invoice title)
Heading Medium:  text-xl font-bold     (Card titles, Product names)
Body:            text-sm               (Service items, details)
Caption:         text-xs               (Secondary info, labels)
Mono:            font-mono             (Referral code, prices)
```

### Spacing Scale
```
Card padding:        p-4 to p-6
Gap between cards:   gap-6 to gap-8
Section padding:     py-6 to py-10
Button padding:      py-2 to py-6 (large)
Item padding:        p-4 (invoice items)
```

---

## Micro-interactions

### Copy to Clipboard
1. User clicks "Copy" button
2. Button bg changes: purple-600 → green-600
3. Icon remains the same
4. Text changes: "Salin Kode Referral" → "Tersalin!"
5. Toast appears: "Kode referral berhasil disalin!"
6. After 2 seconds, button returns to original state

### Card Hover (Desktop)
```css
.invoice-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.2);
  border-left-width: 6px;
  transition: all 0.2s ease-in-out;
}
```

### Service Item Hover
```css
.service-row:hover {
  background-color: oklch(0.95 0.01 250); /* Lighter accent */
  transform: translateX(4px);
  transition: all 0.15s ease-out;
}
```

---

## Empty States

### No Items in Invoice
```
┌─────────────────────────────────────┐
│                                     │
│         📦 (icon, opacity: 50%)     │
│                                     │
│     Tidak ada item dalam invoice     │
│   Hubungi customer service untuk     │
│        bantuan lebih lanjut          │
│                                     │
│    [Hubungi Kami →]                 │
│                                     │
└─────────────────────────────────────┘
```

### No Referral Code
```
┌─────────────────────────────────────┐
│                                     │
│       🎁 (icon, opacity: 50%)       │
│                                     │
│     Anda belum memiliki kode        │
│        referral undangan            │
│                                     │
│    [Dapatkan Kode Referral →]       │
│                                     │
└─────────────────────────────────────┘
```

### No Points Yet
```
┌─────────────────────────────────────┐
│                                     │
│       ⭐ (icon, opacity: 50%)       │
│                                     │
│     Mulai kumpulkan poin dari       │
│     setiap pesanan dan referral!    │
│                                     │
│    [Lihat Cara Mendapatkan Poin →]  │
│                                     │
└─────────────────────────────────────┘
```

---

## Responsive Breakpoints

```tsx
// Mobile First Approach
const breakpoints = {
  sm: '640px',   // Small mobile
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
}

// Grid Layout Changes
// Mobile: 1 column (grid-cols-1)
// Tablet: 1 column (grid-cols-1) - cards remain stacked
// Desktop: 2 columns (grid-cols-2) or mixed layout
```

---

## Invoice Items Component Features

### Enhanced Display Elements
1. **Product Icon/Thumbnail** - Visual identifier for each item
2. **Color-coded Borders** - Different border colors for different items
3. **Service Icons** - Emoji or Lucide icons for service types
4. **Hover Effects** - Items lift slightly on hover
5. **Collapsible Items** - On mobile, long item lists can be collapsed
6. **Aligned Pricing** - Right-aligned prices for easy scanning

### Service Type Icons (suggested)
```
Deep Clean:    🧹 or Sparkles
Fast Clean:    ⚡ or Zap
Repaint:       🎨 or Palette
Whitening:     ✨ or Star
Premium Sole:  👟 or Footprints
Deodorize:     💨 or Wind
```
