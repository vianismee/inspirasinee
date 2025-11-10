# Drop Point Shelf Assignment Logic - Dummy Output

## Overview
This document demonstrates the shelf assignment logic for customer self-service drop-off. The system checks capacity **before** the customer can start filling out the form.

## Process Flow
1. Customer accesses drop-point service
2. **System checks if empty shelves are available**
3. If capacity available → Customer proceeds to fill order form
4. If full capacity → Customer sees "Drop point is full" message
5. Customer completes order and service selection
6. System assigns shelf number during order creation
7. Customer places items on assigned shelf after payment

## Shelf Assignment Logic

### Rule
- Find the lowest available shelf number
- Skip shelves that already contain items
- Assign next available number to customer's order

### Capacity Check Logic (Before Form Access)

**Important**: Each shelf holds 1 item, and each order can contain multiple items that each need their own shelf.

#### Scenario 1: Drop Point Has Space (Customer Can Proceed)
- **Current items**: 35 items on shelves (5 empty shelves available)
- **Capacity check**: PASS (5 < 40 max capacity)
- **Result**: Customer can access the order form
- **Customer sees**: Drop point order form opens normally

```
Drop Point Status at [Location Name]:
📊 Items: 35/40 shelves occupied
🟢 Status: AVAILABLE (5 empty shelves)

✅ You can proceed with your order!
[Start Drop Point Order]
```

#### Scenario 2: Drop Point Full (Customer Blocked)
- **Current items**: 40 items on shelves (0 empty spaces)
- **Capacity check**: FAIL (40 = 40 max capacity)
- **Result**: Customer cannot access order form
- **Customer sees**: "Drop point is full" message

```
Drop Point Status at [Location Name]:
📊 Items: 40/40 shelves occupied
🔴 Status: FULL

⚠️ For the drop point at the location [Location Name] is still full
Please come to the store

[Find Another Location] [Check Status Later] [Contact Store]
```

#### Scenario 3: Partial Capacity (Customer Can Proceed with Limited Items)
- **Current items**: 38 items on shelves (2 empty shelves available)
- **Capacity check**: PASS (2 < 40 max capacity)
- **Result**: Customer can access order form but limited to 2 items max

```
Drop Point Status at [Location Name]:
📊 Items: 38/40 shelves occupied
🟢 Status: AVAILABLE (2 empty shelves)

⚠️ Limited Capacity Available
You can add up to 2 items maximum.

[Start Drop Point Order]
```

### Shelf Assignment Logic (During Order Creation)

**Rule**: Each shelf = 1 item, each order can have multiple items on different shelves

#### Example Assignment Process
- **Current occupied shelves**: #1, #2, #4, #5, #7, #8 (6 existing items from various orders)
- **Customer order**: 3 items need shelves
- **Available shelves**: #3, #6, #9, #10, #11, #12...
- **Assignment**: Item 1 → Shelf #3, Item 2 → Shelf #6, Item 3 → Shelf #9

```
Order #12345 - Item Assignments:
Current occupied: [1, 2, 4, 5, 7, 8] ← 6 existing items
Available shelves: [3, 6, 9, 10, 11, 12...]

Item 1: Nike Air Max → Shelf #3
Item 2: Adidas Ultraboost → Shelf #6
Item 3: Converse Chuck Taylor → Shelf #9
```

#### Assignment Examples
```
Example 1: Single Item Order
Occupied shelves: [1, 2] ← 2 existing items
Customer order: 1 item
Assignment: Item 1 → Shelf #3

Example 2: Three Item Order
Occupied shelves: [1, 2, 3, 5] ← 4 existing items
Customer order: 3 items
Assignment: Item 1 → Shelf #4, Item 2 → Shelf #6, Item 3 → Shelf #7

Example 3: Gap Assignment
Occupied shelves: [2, 4, 6] ← 3 existing items
Customer order: 2 items
Assignment: Item 1 → Shelf #1, Item 2 → Shelf #3

Example 4: Large Order
Occupied shelves: [1, 2, 3, 4, 5] ← 5 existing items
Customer order: 5 items
Assignment: Item 1 → Shelf #6, Item 2 → Shelf #7, Item 3 → Shelf #8, Item 4 → Shelf #9, Item 5 → Shelf #10
```

#### Multi-Item Order Example
```
Customer Order #12345 (Invoice with 3 items):
- Item 1: Nike Air Max (White, Size 42) → Shelf #2
- Item 2: Adidas Ultraboost (Black, Size 41) → Shelf #5
- Item 3: Converse Chuck Taylor (Red, Size 43) → Shelf #7

Total: 1 order, 3 items, 3 different shelves
Assignment based on available shelves when order was created
```

## Technical Implementation

### Database Schema (Example)
```sql
-- Track individual item assignments to shelves
CREATE TABLE drop_point_shelves (
  id SERIAL PRIMARY KEY,
  shelf_number INT NOT NULL UNIQUE,
  order_id VARCHAR REFERENCES orders(id),
  order_item_id VARCHAR REFERENCES order_items(id),
  item_description VARCHAR,
  location_id VARCHAR NOT NULL,
  customer_name VARCHAR,
  created_at TIMESTAMP,
  status VARCHAR DEFAULT 'available' -- 'occupied', 'available'
);

-- Capacity check function (counts items, not orders)
CREATE OR REPLACE FUNCTION check_drop_point_capacity(
  p_location_id VARCHAR
) RETURNS INTEGER AS $$
DECLARE
  occupied_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO occupied_count
  FROM drop_point_shelves
  WHERE location_id = p_location_id AND status = 'occupied';

  RETURN 40 - occupied_count; -- Return number of available shelves
END;
$$ LANGUAGE plpgsql;

-- Get multiple available shelves for multi-item orders
CREATE OR REPLACE FUNCTION get_available_shelves(
  p_location_id VARCHAR,
  p_needed_shelves INTEGER
) RETURNS INTEGER[] AS $$
DECLARE
  available_shelves INTEGER[];
BEGIN
  SELECT ARRAY_AGG(shelf_number) INTO available_shelves
  FROM drop_point_shelves
  WHERE location_id = p_location_id AND status = 'available'
  AND shelf_number BETWEEN 1 AND 40
  ORDER BY shelf_number
  LIMIT p_needed_shelves;

  RETURN available_shelves;
END;
$$ LANGUAGE plpgsql;

-- Assign multiple shelves to order items
CREATE OR REPLACE FUNCTION assign_shelves_to_order_items(
  p_location_id VARCHAR,
  p_order_id VARCHAR,
  p_item_assignments JSON -- JSON array of {item_id, description}
) RETURNS BOOLEAN AS $$
DECLARE
  item_record JSON;
  shelf_number INTEGER;
BEGIN
  -- For each item in the order, assign a shelf
  FOREACH item_record IN SELECT * FROM json_array_elements(p_item_assignments)
  LOOP
    -- Get next available shelf
    SELECT MIN(shelf_number) INTO shelf_number
    FROM drop_point_shelves
    WHERE location_id = p_location_id AND status = 'available'
    AND shelf_number BETWEEN 1 AND 40;

    IF shelf_number IS NULL THEN
      -- No more shelves available
      RETURN FALSE;
    END IF;

    -- Assign shelf to item
    UPDATE drop_point_shelves
    SET status = 'occupied',
        order_id = p_order_id,
        order_item_id = item_record->>'item_id',
        item_description = item_record->>'description',
        created_at = NOW()
    WHERE shelf_number = shelf_number AND location_id = p_location_id;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### Frontend Logic (TypeScript)

#### Types and Interfaces
```typescript
interface DropPointCapacity {
  locationId: string;
  totalItems: number; // Count of individual items on shelves
  maxCapacity: number;
  availableShelves: number;
  hasCapacity: boolean;
  locationName: string;
}

interface ShelfAssignment {
  shelfNumber: number;
  orderId: string;
  orderItemId: string;
  itemDescription: string;
  locationId: string;
  assignedAt: Date;
}

interface OrderShelfAssignments {
  orderId: string;
  items: ItemShelfAssignment[];
  assignedAt: Date;
}

interface ItemShelfAssignment {
  orderItemId: string;
  itemDescription: string;
  shelfNumber: number;
}

interface OrderData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
}

interface OrderItem {
  id: string; // Unique ID for each item
  description: string;
  color: string;
  size: string;
  service: string;
  price: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

#### Capacity Check (Before Form Load)
```typescript
// Check if drop point has capacity before showing form
async function checkDropPointCapacity(locationId: string): Promise<void> {
  try {
    const response = await fetch(`/api/drop-point/capacity?location=${encodeURIComponent(locationId)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<DropPointCapacity> = await response.json();
    const data = apiResponse.data;

    if (!data) {
      throw new Error('Invalid response data');
    }

    if (data.hasCapacity) {
      // Show order form with capacity info
      showDropPointForm(data);
    } else {
      // Show full capacity message
      showFullCapacityMessage(data);
    }
  } catch (error) {
    console.error('Capacity check failed:', error);
    showError('Unable to check drop point status. Please try again.');
  }
}

// Full capacity message UI
function showFullCapacityMessage(capacity: DropPointCapacity): string {
  return `
    <div class="capacity-full">
      <h2>⚠️ Drop Point Full</h2>
      <p>For the drop point at the location ${capacity.locationName} is still full</p>
      <p>Please come to the store</p>

      <div class="capacity-info">
        <p><strong>Current Status:</strong> ${capacity.totalOrders}/${capacity.maxCapacity} orders</p>
        <p><strong>Available Shelves:</strong> ${capacity.availableShelves}</p>
      </div>

      <div class="actions">
        <button onclick="checkAnotherLocation()">Find Another Location</button>
        <button onclick="checkLater()">Check Status Later</button>
        <button onclick="contactStore()">Contact Store</button>
      </div>
    </div>
  `;
}

// Show drop point form with capacity info
function showDropPointForm(capacity: DropPointCapacity): void {
  const formContainer = document.getElementById('drop-point-form');
  if (!formContainer) return;

  formContainer.innerHTML = `
    <div class="capacity-header">
      <h2>Drop Point Order - ${capacity.locationName}</h2>
      <p>📊 Available Shelves: ${capacity.availableShelves}/${capacity.maxCapacity}</p>
      <p>🟢 Capacity Available - You can proceed with your order</p>
      ${capacity.availableShelves < 5 ? `<p>⚠️ Limited Capacity: Max ${capacity.availableShelves} items</p>` : ''}
    </div>

    <!-- Order form content here -->
    <div id="order-form-content">
      <!-- Form fields will be populated here -->
    </div>
  `;
}
```

#### Shelf Assignment (During Order Creation)
```typescript
// Assign shelves to multiple items in an order
async function assignShelvesToOrderItems(
  locationId: string,
  orderData: OrderData
): Promise<OrderShelfAssignments> {
  try {
    const response = await fetch('/api/drop-point/assign-shelves', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locationId,
        orderData,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<OrderShelfAssignments> = await response.json();

    if (!apiResponse.success || !apiResponse.data) {
      throw new Error(apiResponse.error || 'Failed to assign shelves');
    }

    return apiResponse.data;
  } catch (error) {
    console.error('Shelf assignment failed:', error);
    throw new Error(`Failed to assign shelves: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Check if enough shelves are available for the items
function validateShelfAvailability(itemCount: number, availableShelves: number): boolean {
  return itemCount <= availableShelves;
}

// Get multiple available shelves for assignment
function getAvailableShelves(occupiedShelves: number[], neededShelves: number): number[] | null {
  const maxShelves = 40;
  const availableShelves: number[] = [];

  for (let shelf = 1; shelf <= maxShelves && availableShelves.length < neededShelves; shelf++) {
    if (!occupiedShelves.includes(shelf)) {
      availableShelves.push(shelf);
    }
  }

  return availableShelves.length === neededShelves ? availableShelves : null;
}

// Get occupied shelves from database
async function getOccupiedShelves(locationId: string): Promise<number[]> {
  try {
    const response = await fetch(`/api/drop-point/occupied-shelves?location=${encodeURIComponent(locationId)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<number[]> = await response.json();
    return apiResponse.data || [];
  } catch (error) {
    console.error('Failed to get occupied shelves:', error);
    throw new Error('Unable to retrieve shelf information');
  }
}

// Complete shelf assignment flow for multi-item order
async function completeShelfAssignment(locationId: string, orderData: OrderData): Promise<OrderShelfAssignments> {
  // 1. Check if we have enough shelves for all items
  const occupiedShelves = await getOccupiedShelves(locationId);
  const availableCount = 40 - occupiedShelves.length;

  if (!validateShelfAvailability(orderData.items.length, availableCount)) {
    throw new Error(`Not enough shelves available. Need ${orderData.items.length}, have ${availableCount}`);
  }

  // 2. Assign shelves to each item
  const assignments = await assignShelvesToOrderItems(locationId, orderData);

  return assignments;
}

// Generate unique order ID
function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `DP-${timestamp}-${random}`;
}

// Generate unique item ID
function generateItemId(orderId: string, itemIndex: number): string {
  return `${orderId}-ITEM-${itemIndex + 1}`;
}
```

## User Interface Flow

### 1. Initial Capacity Check (First Thing Customer Sees)
```
DROP POINT - [Location Name]

📊 Checking capacity...

✅ Capacity Available: 37/40 shelves empty
🟢 You can proceed with your order

[Start Drop Point Order]
```

### 2. Full Capacity Message (If No Space Available)
```
DROP POINT - [Location Name]

📊 Current Status: 40/40 shelves occupied
🔴 DROP POINT FULL

⚠️ For the drop point at the location [Location Name] is still full
Please come to the store

What would you like to do?
[📍 Find Another Location] [🔄 Check Status Later] [📞 Contact Store]
```

### 3. Order Form (After Capacity Check Passes)
```
DROP POINT ORDER FORM

Location: [Location Name] | Available Shelves: 37/40
📦 Each item gets its own shelf (1 item = 1 shelf)

Customer Information:
┌─────────────────────────────────┐
│ Name: [____________________]    │
│ Phone: [____________________]   │
│ Email: [____________________]   │
└─────────────────────────────────┘

Items to Drop Off (Each item gets separate shelf):
┌─────────────────────────────────┐
│ Item 1: [Shoes Description]     │
│ Color: [Dropdown] Size: [Dropdown] │
│ Service: [Service Selection]     │
└─────────────────────────────────┘
[+ Add Another Item] (Max 37 items)

💡 Tip: Each item will be placed on a different shelf!

Order Summary:
Items: 2 pairs | Total: Rp 150,000
📦 Will occupy: 2 shelves
[Proceed to Payment]
```

### 4. Payment Complete Screen (With Assigned Shelves)
```
✅ Payment Complete!

Order #DP-2024-1234
Payment: Rp 150,000 via QRIS

Your assigned shelves:
📦 Item 1: Nike Air Max → Shelf #2
📦 Item 2: Adidas Ultraboost → Shelf #5
📦 Item 3: Converse Chuck Taylor → Shelf #7

Please place each item on its assigned shelf:
1. 🚶 Go to Shelf #2 and place Nike Air Max
2. 🚶 Go to Shelf #5 and place Adidas Ultraboost
3. 🚶 Go to Shelf #7 and place Converse Chuck Taylor
4. 📱 Take photos of each item on its shelf
5. 🧾 Keep your order confirmation

[🗺️ View Shelf Map] [📋 Show Instructions] [✅ Done]
```

### 5. Shelf Map Display
```
DROP POINT SHELVES - [Location Name]

Your Order Items:
🔴 Shelf 2 (Nike Air Max - Item 1)
🔴 Shelf 5 (Adidas Ultraboost - Item 2)
🔴 Shelf 7 (Converse Chuck Taylor - Item 3)

🟢 Shelf 1 (Available - Empty)
🔴 Shelf 2 (Your Order - Nike Air Max)
🟢 Shelf 3 (Available - Empty)
🟢 Shelf 4 (Available - Empty)
🔴 Shelf 5 (Your Order - Adidas Ultraboost)
🟢 Shelf 6 (Available - Empty)
🔴 Shelf 7 (Your Order - Converse Chuck Taylor)
⚫ Shelf 8 (Other Customer - Nike Pegasus)
⚫ Shelf 9 (Other Customer - Adidas Stan Smith)
...

Legend:
🟢 Available  🔴 Your Items  ⚫ Other Items
```

## Error Handling

### Capacity Full Error (Before Form)
```
⚠️ Drop Point Full

For the drop point at the location [Location Name] is still full
Please come to the store

Current Status: 40/40 items (each item uses 1 shelf)
Estimated Available: Unknown
Capacity: 0 empty shelves

Options:
[📍 Find Another Location] [🔄 Check Later] [📞 Call Store]
```

### Limited Capacity Error (Too Many Items)
```
⚠️ Limited Capacity Available

You want to add 3 items but only 2 shelves are available.
Please remove some items or try another location.

Current Status: 38/40 shelves occupied
Available Shelves: 2
Your Items: 3

Options:
[Remove Item] [Try Another Location] [Continue with 2 Items]
```

### System Error During Capacity Check
```
⚠️ Unable to Check Drop Point Status

We're having trouble checking the drop point capacity.
Please try again in a moment.

Error Code: DP_CAPACITY_CHECK_FAILED
Details: Cannot retrieve current item count

[🔄 Retry] [📞 Get Help]
```

### Shelf Assignment Failed
```
⚠️ Unable to Assign Shelves

Something went wrong while assigning shelves to your items.
Please contact customer support.

Order #DP-2024-1234
Items to assign: 3
Error Code: DP_SHELF_ASSIGN_FAILED
Details: Failed to reserve shelves for your items

[🔄 Retry Payment] [📞 Contact Support]
```

### Concurrent Assignment Conflict
```
⚠️ Shelf Assignment Conflict

Another customer just took some available shelves.
Not enough shelves remain for all your items.

Error Code: DP_CONCURRENT_ASSIGNMENT
Available when you started: 3 shelves
Available now: 1 shelf
Your items need: 3 shelves

[🔄 Try Again] [📞 Contact Store]
```

## Integration Points

### Entry Point Integration (Page Load)
- Check drop point capacity when customer accesses drop-point page
- Show appropriate UI based on capacity status
- Block access to order form if no capacity available

### Payment System Integration
- Assign shelf number during order creation (not after payment)
- Include shelf number in order confirmation
- Reserve shelf to prevent double assignment

### Order Management Integration
- Link shelf number to order in database
- Display shelf assignment in admin dashboard
- Track shelf status changes in real-time

### Notification System
- Send shelf assignment confirmation to customer after order creation
- Notify staff when shelves reach capacity
- Alert system for shelf status changes

## Testing Scenarios

### Test Case 1: Capacity Check with Available Space
- Given: 35 items on shelves (5 empty shelves available)
- When: Customer accesses drop-point page
- Then: Show order form with capacity indicator "35/40 items, 5 shelves available"

### Test Case 2: Capacity Check with No Space
- Given: 40 items on shelves (0 empty shelves available)
- When: Customer accesses drop-point page
- Then: Show "drop point is full" message, block order form

### Test Case 3: Single Item Order
- Given: Shelves #1, #3, #5 occupied (3 existing items)
- When: Customer creates order with 1 item
- Then: Assign shelf #2 to the single item

### Test Case 4: Multi-Item Order Assignment
- Given: Shelves #1, #4, #7 occupied (3 existing items)
- When: Customer creates order with 3 items
- Then: Assign Item 1 → Shelf #2, Item 2 → Shelf #3, Item 3 → Shelf #5

### Test Case 5: Sequential Assignment with Gaps
- Given: Shelves #1, #2, #4 occupied (3 existing items)
- When: Customer creates order with 2 items
- Then: Assign Item 1 → Shelf #3, Item 2 → Shelf #5

### Test Case 6: Large Order Assignment
- Given: Shelves #1-5 occupied (5 existing items)
- When: Customer creates order with 5 items
- Then: Assign Item 1 → Shelf #6, Item 2 → Shelf #7, Item 3 → Shelf #8, Item 4 → Shelf #9, Item 5 → Shelf #10

### Test Case 7: Limited Capacity Scenario
- Given: 38 items on shelves (2 empty shelves available)
- When: Customer tries to create order with 3 items
- Then: Show limited capacity error, suggest reducing items or try another location

### Test Case 8: Concurrent Orders
- Given: Multiple customers create orders simultaneously
- When: Customer A creates order with 2 items, Customer B creates order with 1 item
- Then: Customer A gets shelves #2 and #3, Customer B gets shelf #4 (no conflicts)

### Test Case 9: Capacity Reached Mid-Process
- Given: 38 items on shelves, customer starts order with 2 items (capacity checked and passed)
- When: Another customer completes order with 2 items before first customer finishes
- Then: First customer can still complete (capacity was checked at start, they have reserved shelves)

### Test Case 10: Item-to-Shelf Mapping Example
- Given: Customer order with Nike Air Max, Adidas Ultraboost, Converse Chuck Taylor
- When: Available shelves are #2, #5, #7
- Then: Nike Air Max → Shelf #2, Adidas Ultraboost → Shelf #5, Converse Chuck Taylor → Shelf #7

### Test Case 11: Item Removal and Shelf Availability
- Given: Shelf #3 occupied with Nike Air Max (Item completed/picked up)
- When: System marks item as completed/shelf freed
- Then: Shelf #3 becomes available for next customer's item

### Test Case 12: Database Consistency Check
- Given: System crash during multi-item shelf assignment
- When: System recovers
- Then: Database shows consistent item-to-shelf assignments, no orphaned reservations

### Test Case 13: Maximum Items per Order
- Given: 35 items on shelves (5 shelves available)
- When: Customer tries to create order with 6 items
- Then: Show error "Need 6 shelves, only 5 available"

### Test Case 14: Real-time Shelf Updates
- Given: Customer viewing shelf map showing their items on shelves #2, #5, #7
- When: Another customer picks up item from shelf #3
- Then: Shelf #3 shows as available on next refresh

## Performance Considerations

- Shelf assignment query should be atomic to prevent race conditions (use database transactions)
- Cache shelf status for better performance (with cache invalidation on changes)
- Use database transactions for consistency during shelf assignment
- Implement retry logic for failed assignments due to concurrent access
- Optimize capacity check queries with proper indexing on location_id and status
- Consider connection pooling for high-traffic drop points

## Key Differences from Previous Logic

### Before Update (Incorrect):
- Each shelf held 1 order (can contain multiple items)
- 40 orders maximum capacity
- Customer got shelf number during order creation
- All items in an order went on the same shelf

### After Update (Correct):
- Each shelf holds 1 item
- 40 items maximum capacity
- Customer gets shelf numbers for each item during order creation
- Each item in an order gets its own individual shelf
- Capacity check happens BEFORE form access

### Important Business Rules:
1. **1 shelf = 1 item** (each item needs its own shelf)
2. **Capacity is item count**, not order count
3. **Check capacity before allowing form access**
4. **Assign lowest available shelf numbers to each item**
5. **Multiple items per order go on different shelves**
6. **Shelf assignment depends on availability at time of order creation**

### Example Assignment Logic:
```
Order #12345 with 3 items:
- Item 1 (Nike Air Max) → Shelf #2 (first available)
- Item 2 (Adidas Ultraboost) → Shelf #5 (next available after other occupied shelves)
- Item 3 (Converse Chuck Taylor) → Shelf #7 (next available)
```

The assignment depends entirely on which shelves are empty when the order is created, not on any sequential pattern.

## Shelf Emptying Logic (Order Completion & Customer Pickup)

### Order Lifecycle States
1. **Order Created** → Items assigned to shelves (occupied)
2. **Order Processing** → Items being cleaned/services (shelves still occupied)
3. **Order Completed** → Items ready for pickup (shelves still occupied)
4. **Customer Pickup** → Items picked up (shelves become available)

### Role-Based Shelf Management

#### Who Can Update Shelf Status?

**Staff/Store Personnel:**
- Can mark order as "Completed" (items ready for pickup)
- Can mark order as "Picked Up" (customer collected items)
- Can manually empty shelves for maintenance
- Can override system if needed

**Customer:**
- Can confirm pickup of their items
- Can view their order status
- Cannot directly empty shelves (staff confirmation required)

**System (Automated):**
- Can automatically free shelves after customer confirms pickup
- Can handle timeout scenarios (orders not picked up within time limit)
- Can log all shelf status changes

### Shelf Emptying Process

#### Method 1: Customer Self-Service Pickup Confirmation
```
Customer Flow:
1. Customer receives notification: "Your order #DP-12345 is ready for pickup"
2. Customer scans QR code or enters order number
3. System shows: "Your items are on shelves: #2, #5, #7"
4. Customer picks up items from each shelf
5. Customer confirms: "I have picked up all my items"
6. System frees shelves #2, #5, #7
7. Status: Order #DP-12345 → COMPLETED, Shelves #2, #5, #7 → AVAILABLE
```

#### Method 2: Staff-Assisted Pickup
```
Staff Flow:
1. Staff marks order #DP-12345 as "Ready for Pickup"
2. Customer arrives at store
3. Staff verifies customer identity
4. Staff guides customer to shelves #2, #5, #7
5. Customer picks up items
6. Staff confirms: "Customer has picked up all items"
7. Staff updates system: "Order #DP-12345 PICKED UP"
8. System frees shelves #2, #5, #7
```

#### Method 3: Manual Shelf Emptying (Staff Only)
```
Staff Maintenance Flow:
1. Staff identifies shelf #3 needs to be emptied
2. Staff verifies no active order on shelf #3
3. Staff selects: "Empty Shelf #3"
4. System requires: "Reason for emptying" + "Staff PIN/Authorization"
5. System logs action and frees shelf #3
```

### Technical Implementation (TypeScript)

#### Shelf Status Types
```typescript
enum ShelfStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved'
}

enum OrderStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  PICKED_UP = 'picked_up',
  CANCELLED = 'cancelled'
}

enum UserRole {
  CUSTOMER = 'customer',
  STAFF = 'staff',
  ADMIN = 'admin'
}

interface ShelfStatusUpdate {
  shelfNumber: number;
  orderId: string;
  itemDescription: string;
  newStatus: ShelfStatus;
  updatedBy: string;
  userRole: UserRole;
  timestamp: Date;
  reason?: string;
}

interface PickupConfirmation {
  orderId: string;
  customerConfirmCode: string;
  pickedUpItems: string[];
  pickupTimestamp: Date;
  customerSignature?: string;
}
```

#### Shelf Emptying Functions
```typescript
// Customer confirms pickup (requires staff verification)
async function confirmCustomerPickup(
  orderId: string,
  customerConfirmCode: string,
  customerDeviceId?: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/drop-point/confirm-pickup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        customerConfirmCode,
        customerDeviceId,
        timestamp: new Date().toISOString()
      })
    });

    const apiResponse: ApiResponse<{ success: boolean; freedShelves: number[] }> = await response.json();

    if (!apiResponse.success) {
      throw new Error(apiResponse.error || 'Pickup confirmation failed');
    }

    return apiResponse.data?.success || false;
  } catch (error) {
    console.error('Pickup confirmation failed:', error);
    throw new Error(`Failed to confirm pickup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Staff confirms customer pickup
async function staffConfirmPickup(
  orderId: string,
  staffId: string,
  staffPin: string,
  notes?: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/drop-point/staff-confirm-pickup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getStaffToken()}`
      },
      body: JSON.stringify({
        orderId,
        staffId,
        staffPin,
        notes,
        timestamp: new Date().toISOString()
      })
    });

    const apiResponse: ApiResponse<{ success: boolean; freedShelves: number[] }> = await response.json();

    if (!apiResponse.success) {
      throw new Error(apiResponse.error || 'Staff pickup confirmation failed');
    }

    return apiResponse.data?.success || false;
  } catch (error) {
    console.error('Staff pickup confirmation failed:', error);
    throw new Error(`Failed to confirm pickup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Staff manually empties shelf
async function staffEmptyShelf(
  shelfNumber: number,
  staffId: string,
  staffPin: string,
  reason: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/drop-point/staff-empty-shelf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getStaffToken()}`
      },
      body: JSON.stringify({
        shelfNumber,
        staffId,
        staffPin,
        reason,
        timestamp: new Date().toISOString()
      })
    });

    const apiResponse: ApiResponse<{ success: boolean }> = await response.json();

    if (!apiResponse.success) {
      throw new Error(apiResponse.error || 'Shelf emptying failed');
    }

    return apiResponse.data?.success || false;
  } catch (error) {
    console.error('Shelf emptying failed:', error);
    throw new Error(`Failed to empty shelf: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get shelf status and assignment details
async function getShelfDetails(shelfNumber: number): Promise<ShelfAssignment | null> {
  try {
    const response = await fetch(`/api/drop-point/shelf/${shelfNumber}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: ApiResponse<ShelfAssignment> = await response.json();
    return apiResponse.data || null;
  } catch (error) {
    console.error('Failed to get shelf details:', error);
    throw new Error('Unable to retrieve shelf information');
  }
}
```

### Database Schema Updates
```sql
-- Add shelf status tracking
ALTER TABLE drop_point_shelves ADD COLUMN order_status VARCHAR DEFAULT 'created';
ALTER TABLE drop_point_shelves ADD COLUMN updated_by VARCHAR;
ALTER TABLE drop_point_shelves ADD COLUMN updated_by_role VARCHAR;
ALTER TABLE drop_point_shelves ADD COLUMN pickup_confirmed_at TIMESTAMP;
ALTER TABLE drop_point_shelves ADD COLUMN pickup_confirmed_by VARCHAR;
ALTER TABLE drop_point_shelves ADD COLUMN maintenance_reason VARCHAR;

-- Function to free shelves for pickup
CREATE OR REPLACE FUNCTION free_shelves_for_pickup(
  p_order_id VARCHAR,
  p_confirmed_by VARCHAR,
  p_confirmed_role VARCHAR -- 'customer' or 'staff'
) RETURNS BOOLEAN AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE drop_point_shelves
  SET status = 'available',
      order_status = 'picked_up',
      updated_by = p_confirmed_by,
      updated_by_role = p_confirmed_role,
      pickup_confirmed_at = NOW(),
      order_id = NULL,
      order_item_id = NULL,
      item_description = NULL
  WHERE order_id = p_order_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to manually empty shelf (staff only)
CREATE OR REPLACE FUNCTION staff_empty_shelf(
  p_shelf_number INT,
  p_staff_id VARCHAR,
  p_reason VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  shelf_exists BOOLEAN;
BEGIN
  -- Check if shelf exists and is occupied
  SELECT EXISTS(
    SELECT 1 FROM drop_point_shelves
    WHERE shelf_number = p_shelf_number AND status = 'occupied'
  ) INTO shelf_exists;

  IF NOT shelf_exists THEN
    RETURN FALSE;
  END IF;

  -- Empty the shelf
  UPDATE drop_point_shelves
  SET status = 'available',
      order_status = 'cancelled',
      updated_by = p_staff_id,
      updated_by_role = 'staff',
      maintenance_reason = p_reason,
      order_id = NULL,
      order_item_id = NULL,
      item_description = NULL
  WHERE shelf_number = p_shelf_number;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### User Interface Flows

#### Customer Pickup Confirmation Screen
```
✅ Order Ready for Pickup!

Order #DP-2024-1234
Status: COMPLETED - Ready for Pickup

Your items are located at:
📦 Shelf #2: Nike Air Max (White, Size 42)
📦 Shelf #5: Adidas Ultraboost (Black, Size 41)
📦 Shelf #7: Converse Chuck Taylor (Red, Size 43)

Please:
1. Go to each shelf and collect your items
2. Confirm you have picked up all items
3. Keep your order confirmation

⚠️ Please confirm pickup within 48 hours

[✅ I Have Picked Up All Items] [📞 Need Help]
```

#### Staff Pickup Confirmation Screen
```
👥 Customer Pickup Confirmation

Order #DP-2024-1234
Customer: John Doe (john@example.com)
Items: 3 pairs on shelves #2, #5, #7

Customer Verification:
□ Identity verified
□ All items collected
□ Customer satisfied

Staff PIN: [______]

[✅ Confirm Pickup] [❌ Cancel] [📝 Add Notes]
```

#### Staff Shelf Management Screen
```
🗂️ Shelf Management - [Location Name]

Current Shelf Status:
🟢 Shelf 1: Available
🔴 Shelf 2: Order #DP-1234 (Nike Air Max)
🔴 Shelf 3: Order #DP-1235 (Adidas Ultraboost)
⚫ Shelf 4: Maintenance (Water damage)

Actions:
[🔄 Refresh Status] [📊 View Analytics] [⚙️ Settings]

Manual Shelf Operations:
Shelf #: [____]
Reason: [Dropdown - "Customer pickup", "Maintenance", "System error"]
Staff PIN: [______]

[Empty Shelf] [📋 View History]
```

### Error Handling

#### Customer Pickup Errors
```
⚠️ Pickup Confirmation Failed

Invalid confirmation code or order already picked up.
Please contact staff for assistance.

Error Code: PICKUP_INVALID_CODE
Order: #DP-2024-1234

[🔄 Try Again] [📞 Contact Staff]
```

#### Staff Authorization Errors
```
⚠️ Access Denied

Invalid staff PIN or insufficient permissions.
This action requires staff authorization.

Error Code: STAFF_AUTH_FAILED
Action: Empty Shelf #3

[🔄 Try Again] [📞 Contact Manager]
```

#### Shelf Already Empty Error
```
⚠️ Shelf Already Available

Shelf #3 is already available and not assigned to any order.

No action needed.

[OK] [📋 View Shelf Status]
```

## Complete Shelf Lifecycle Flow

### Full Example: Order from Creation to Pickup

#### Step 1: Order Creation
```
Customer Order #DP-2024-1234 (3 items):
- Item 1: Nike Air Max → Shelf #2 (available → occupied)
- Item 2: Adidas Ultraboost → Shelf #5 (available → occupied)
- Item 3: Converse Chuck Taylor → Shelf #7 (available → occupied)

Status: All 3 shelves now OCCUPIED
Available shelves: 37/40
```

#### Step 2: Order Processing (Staff Updates)
```
Staff processes items:
- Shelf #2: Nike Air Max → Status: PROCESSING
- Shelf #5: Adidas Ultraboost → Status: PROCESSING
- Shelf #7: Converse Chuck Taylor → Status: PROCESSING

Status: Items being cleaned/serviced
Shelves remain OCCUPIED
```

#### Step 3: Order Completion (Staff Updates)
```
Staff marks order as completed:
- Shelf #2: Nike Air Max → Status: COMPLETED
- Shelf #5: Adidas Ultraboost → Status: COMPLETED
- Shelf #7: Converse Chuck Taylor → Status: COMPLETED

Customer receives notification: "Your order is ready for pickup!"
```

#### Step 4: Customer Pickup (Customer or Staff)
```
Customer confirms pickup OR Staff confirms pickup:
- Shelf #2: Nike Air Max → Status: PICKED_UP → AVAILABLE
- Shelf #5: Adidas Ultraboost → Status: PICKED_UP → AVAILABLE
- Shelf #7: Converse Chuck Taylor → Status: PICKED_UP → AVAILABLE

Status: All 3 shelves now AVAILABLE
Available shelves: 40/40
Order #DP-2024-1234 → ARCHIVED
```

### Integration with Existing Systems

#### Order Management System Integration
- Link shelf status to order status changes
- Track shelf assignment history for reporting
- Automated notifications for pickup reminders

#### Staff Dashboard Integration
- Real-time shelf status monitoring
- Order completion workflows
- Pickup confirmation interfaces

#### Customer App Integration
- Order status tracking
- Pickup notifications
- QR code generation for pickup

### Testing Scenarios for Shelf Emptying

#### Test Case 15: Customer Self-Service Pickup
- Given: Order #DP-123 with items on shelves #2, #5, #7, status COMPLETED
- When: Customer confirms pickup with valid confirmation code
- Then: All shelves #2, #5, #7 become AVAILABLE, order status becomes PICKED_UP

#### Test Case 16: Staff-Assisted Pickup
- Given: Order #DP-124 with items on shelves #3, #6
- When: Staff verifies customer identity and confirms pickup
- Then: Shelves #3, #6 become AVAILABLE, order status becomes PICKED_UP

#### Test Case 17: Manual Shelf Emptying
- Given: Shelf #4 has abandoned items, no active order
- When: Staff empties shelf with reason "Abandoned items"
- Then: Shelf #4 becomes AVAILABLE, action logged with staff ID

#### Test Case 18: Pickup Timeout Scenario
- Given: Order #DP-125 completed 7 days ago, not picked up
- When: System automatically processes timeout
- Then: Order marked as ABANDONED, shelves become AVAILABLE, customer notified

#### Test Case 19: Concurrent Pickup Conflicts
- Given: Customer and staff try to confirm same order pickup simultaneously
- When: Both submit pickup confirmation
- Then: First confirmation succeeds, second shows "order already picked up"

### Performance & Security Considerations

#### Performance Optimizations
- Cache shelf status for real-time updates
- Use database transactions for atomic shelf operations
- Optimize pickup confirmation queries

#### Security Measures
- Validate staff PINs for shelf operations
- Log all shelf status changes with user identity
- Prevent unauthorized shelf modifications
- Audit trail for shelf operations

#### Data Integrity
- Ensure shelf assignments don't get lost during updates
- Backup critical shelf operation data
- Handle system crashes during pickup process

### Key Success Metrics

#### Shelf Utilization
- Average shelf occupancy time
- Pickup confirmation rate
- Shelf turnover frequency

#### Customer Experience
- Time from order completion to pickup
- Customer pickup confirmation success rate
- Support tickets related to shelf issues

#### Operational Efficiency
- Staff time spent on pickup confirmations
- Manual shelf emptying frequency
- System automation coverage