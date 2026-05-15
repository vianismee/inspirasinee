# Membership Program Implementation Guide for Admin Project

## 1. Overview
This document outlines the technical implementation requirements for integrating the **Membership Program** into the Admin Dashboard. The goal is to allow administrators to configure membership tiers, manage benefits, and view customer progress.

**Reference Documents:**
The following files in the `ProjectUpdate` directory provide the foundation for this guide:

1.  **[Membership Rules](./membership-rules.md)**
    *   **Context:** This is the detailed "Business Logic" document.
    *   **Content:** It defines the exact math for points (e.g., 1 pt = Rp. 1000), the thresholds for leveling up (Bronze → Silver needs 3 transactions), and the specific benefits for each tier.
    *   **For Admin Devs:** Use this to understand *what* you are configuring. The default values in your Admin forms should match the rules defined here.

2.  **[Existing Schema](./existing-schema.md)**
    *   **Context:** This is the "Database Implementation" plan.
    *   **Content:** It contains the raw SQL commands to create the tables (`customer_memberships`, `membership_benefits`, etc.) and the automated triggers that handle level-ups.
    *   **For Admin Devs:** Use this to ensure your API calls match the actual database structure. You will be reading from these tables.

---

## 2. Architecture & Database
The Admin Project interacts with the shared database that supports the User App (`shine-app`).
Ensure the following tables exist and are accessible to the Admin API.

### 2.1 Core Tables
The Admin project primarily manages these tables:

1.  **`customer_membership_levels`**: Configuration of tiers (Bronze, Silver, Gold).
    -   Fields: `name`, `level_index`, `points_multiplier`, `discount_percent`, `discount_max_amount`, `is_active`.
2.  **`membership_benefits`**: CMS content for benefits shown to users.
    -   Fields: `membership_level_id`, `icon_name`, `title`, `description`, `display_order`.
3.  **`customer_memberships`**: Operational data (Read-Only for Admin mostly).
    -   Fields: `customer_id`, `membership_level_id`, `progress_percent`, `transactions_to_next_level`.

### 2.2 Schema Reference
> Refer to `existing-schema.md` for full DDL and Trigger definitions.

---

## 3. Admin Features & Functional Requirements

The Admin Dashboard requires the following modules:

### 3.1 Membership Configuration (Settings)
**Goal:** Allow admins to tweak the rules of the program without redeploying code.

-   **View All Levels:** Table showing Bronze, Silver, Gold configs.
-   **Edit Level Rules:** form to update:
    -   `points_multiplier` (e.g., 1.5)
    -   `discount_percent` (e.g., 10)
    -   `discount_max_amount` (e.g., 10000)
    -   *Note: Level names and thresholds (transactions needed) are currently hardcoded in triggers/logic (`LEVEL_REQUIREMENTS` in app). If these need to be dynamic, update `trigger_update_membership_progress` function to read transaction thresholds from a table.*

### 3.2 Benefit Management (CMS)
**Goal:** Manage the visual benefits list displayed to users in the app.

-   **List Benefits:** Filter by Level (Bronze/Silver/Gold).
-   **Add/Edit Benefit:**
    -   **Icon Selector:** Dropdown to select Lucide icon name (e.g., `Flame`, `Percent`, `Sparkles`).
    -   **Title:** e.g., "Priority Service".
    -   **Description:** e.g., "Get served faster".
    -   **Display Order:** Numeric input for sorting.
-   **Delete Benefit:** Soft delete or physical delete.

### 3.3 Customer Membership View
**Goal:** View a specific customer's status for support/debugging.

-   **Customer Detail Page:**
    -   Show current Badge (Bronze/Silver/Gold).
    -   Show `shine_points` balance.
    -   Show `total_transactions` and progress to next level.
    -   Show History Log (`membership_level_history` table) to see when they upgraded.

---

## 4. API Requirements (Backend)
The Admin Frontend will need these endpoints.

### 4.1 Configuration Endpoints
-   `GET /admin/membership/levels`: List all levels with current config.
-   `PUT /admin/membership/levels/{id}`: Update multiplier, discount rules.

### 4.2 Benefits Management
-   `GET /admin/membership/benefits?level={id}`: List benefits.
-   `POST /admin/membership/benefits`: Create new benefit.
-   `PUT /admin/membership/benefits/{id}`: Update benefit.
-   `DELETE /admin/membership/benefits/{id}`: Remove benefit.

### 4.3 Customer Support
-   `POST /admin/customers/{id}/recalculate-membership`: (Optional) Trigger a manual re-run of the level-up logic in case of data sync issues.

---

## 5. Logic & Discrepancy Notes
**Critical Implementation Details:**

1.  **Transaction Counting:**
    -   **Frontend Rule:** The User App currently calculates level based on `orders.length` (Total Orders).
    -   **Backend Rule (Source of Truth):** The `trigger_update_membership_progress` in the database counts `total_transactions` where `status = 'finished'`.
    -   **Requirement:** The Admin Project must rely on the **database columns** (`customer_memberships.total_transactions`), NOT a raw count of orders, to ensure consistency with the trigger logic.

2.  **Level Up Logic:**
    -   Logic is handled by Database Trigger `update_membership_progress`.
    -   Admin does **not** need to implement level-up logic in application code, but should monitor `membership_level_history` for audit trails.

3.  **Icons:**
    -   The Admin App needs a mapping of String -> Icon Component for the Benefit CMS to work visually.
    -   Supported Icons (from `lib/customer-data.ts`): `Flame`, `Percent`, `Sparkles`, `Cake`, `Gift`, `Crown`.

4.  **Discount Calculation Logic:**
    -   The system uses a **Percentage with Cap** model.
    -   **Formula:** `calculated_discount = MIN( transaction_total * (discount_percent / 100), discount_max_amount )`
    -   **Example Case:**
        -   **Config:** Discount = 20%, Max Cap = Rp. 10.000.
        -   **Transaction:** Rp. 100.000.
        -   **Calculation:** 20% of 100.000 is 20.000.
        -   **Result:** Since 20.000 > 10.000 (Max Cap), the final discount applied is **Rp. 10.000**.
    -   *The Admin Dashboard must clearly label these fields so admins understand that `discount_max_amount` is the "hard limit" for the discount.*


---

## 6. Frontend UI Guidelines (Admin)
For the Admin UI, follow the design system of the Admin Project but ensure these specific data points are visualized:

-   **Level Indicators:** Use the same color coding as the User App for consistency if possible:
    -   **Bronze:** Orange/Amber
    -   **Silver:** Gray/Slate
    -   **Gold:** Yellow/Gold
-   **Progress Bars:** Visualize `progress_percent` from `customer_memberships` table.
