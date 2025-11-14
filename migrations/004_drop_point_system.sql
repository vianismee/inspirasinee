-- Migration: Drop-Point Order System
-- This migration adds support for drop-point fulfillment with item numbering,
-- color-based add-ons, QRIS-only payments, and capacity management
-- Run this in your Supabase SQL editor or migration tool

-- =====================================================
-- STEP 1: Add Drop-Point Columns to Existing Tables
-- =====================================================

-- Add drop-point specific columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS fulfillment_type text DEFAULT 'standard' CHECK (fulfillment_type IN ('standard', 'drop-point')),
ADD COLUMN IF NOT EXISTS drop_point_id bigint,
ADD COLUMN IF NOT EXISTS customer_marking text,
ADD COLUMN IF NOT EXISTS drop_point_capacity_used integer DEFAULT 0;

-- Add color, size, and item numbering to order_item table
ALTER TABLE public.order_item
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS item_number integer,
ADD COLUMN IF NOT EXISTS has_white_treatment boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_shoe_name text;

-- =====================================================
-- STEP 2: Create New Drop-Point Tables
-- =====================================================

-- Drop-point locations table
CREATE TABLE IF NOT EXISTS public.drop_points (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  max_capacity integer NOT NULL DEFAULT 40,
  current_capacity integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT drop_points_pkey PRIMARY KEY (id),
  CONSTRAINT drop_points_capacity_check CHECK (current_capacity <= max_capacity),
  CONSTRAINT drop_points_max_capacity_check CHECK (max_capacity > 0)
);

-- Drop-point shelf management table
CREATE TABLE IF NOT EXISTS public.drop_point_shelves (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  drop_point_id bigint NOT NULL,
  shelf_number integer NOT NULL,
  order_invoice_id text,
  item_number integer,
  is_occupied boolean NOT NULL DEFAULT false,
  customer_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT drop_point_shelves_pkey PRIMARY KEY (id),
  CONSTRAINT fk_shelves_drop_point FOREIGN KEY (drop_point_id) REFERENCES public.drop_points(id) ON DELETE CASCADE,
  CONSTRAINT fk_shelves_order FOREIGN KEY (order_invoice_id) REFERENCES public.orders(invoice_id) ON DELETE SET NULL,
  CONSTRAINT unique_shelf_per_location UNIQUE (drop_point_id, shelf_number)
);

-- Add-on services table (for automatic add-ons like White Treatment)
CREATE TABLE IF NOT EXISTS public.add_on_services (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  description text,
  price integer NOT NULL,
  trigger_condition text NOT NULL, -- 'color:white', 'service:premium', etc.
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT add_on_services_pkey PRIMARY KEY (id)
);

-- Order item add-ons table (links add-ons to specific order items)
CREATE TABLE IF NOT EXISTS public.order_item_add_ons (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  order_item_id bigint NOT NULL,
  add_on_service_id bigint NOT NULL,
  applied_at timestamp with time zone DEFAULT now(),
  is_automatic boolean NOT NULL DEFAULT false,
  trigger_reason text,
  CONSTRAINT order_item_add_ons_pkey PRIMARY KEY (id),
  CONSTRAINT fk_add_ons_order_item FOREIGN KEY (order_item_id) REFERENCES public.order_item(id) ON DELETE CASCADE,
  CONSTRAINT fk_add_ons_service FOREIGN KEY (add_on_service_id) REFERENCES public.add_on_services(id) ON DELETE CASCADE
);

-- Drop-point customer markers table (for tracking drop-point customers)
CREATE TABLE IF NOT EXISTS public.drop_point_customer_markers (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id text NOT NULL,
  drop_point_id bigint NOT NULL,
  marker_id text NOT NULL UNIQUE, -- Unique identifier for the customer
  total_orders integer NOT NULL DEFAULT 1,
  total_items integer NOT NULL DEFAULT 0,
  first_order_date timestamp with time zone DEFAULT now(),
  last_order_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT drop_point_customer_markers_pkey PRIMARY KEY (id),
  CONSTRAINT fk_markers_customer FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE,
  CONSTRAINT fk_markers_drop_point FOREIGN KEY (drop_point_id) REFERENCES public.drop_points(id) ON DELETE CASCADE
);

-- =====================================================
-- STEP 3: Create Performance Indexes
-- =====================================================

-- Drop-point related indexes
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_type ON public.orders(fulfillment_type);
CREATE INDEX IF NOT EXISTS idx_orders_drop_point_id ON public.orders(drop_point_id);
CREATE INDEX IF NOT EXISTS idx_order_item_color ON public.order_item(color);
CREATE INDEX IF NOT EXISTS idx_order_item_size ON public.order_item(size);
CREATE INDEX IF NOT EXISTS idx_order_item_item_number ON public.order_item(item_number);
CREATE INDEX IF NOT EXISTS idx_order_item_has_white_treatment ON public.order_item(has_white_treatment);

-- Drop-point location indexes
CREATE INDEX IF NOT EXISTS idx_drop_points_active ON public.drop_points(is_active);
CREATE INDEX IF NOT EXISTS idx_drop_points_capacity ON public.drop_points(current_capacity, max_capacity);

-- Shelf management indexes
CREATE INDEX IF NOT EXISTS idx_shelves_drop_point ON public.drop_point_shelves(drop_point_id);
CREATE INDEX IF NOT EXISTS idx_shelves_occupied ON public.drop_point_shelves(is_occupied);
CREATE INDEX IF NOT EXISTS idx_shelves_order ON public.drop_point_shelves(order_invoice_id);
CREATE INDEX IF NOT EXISTS idx_shelves_customer ON public.drop_point_shelves(customer_id);

-- Add-on services indexes
CREATE INDEX IF NOT EXISTS idx_add_ons_active ON public.add_on_services(is_active);
CREATE INDEX IF NOT EXISTS idx_add_ons_trigger ON public.add_on_services(trigger_condition);
CREATE INDEX IF NOT EXISTS idx_order_item_add_ons_item ON public.order_item_add_ons(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_add_ons_service ON public.order_item_add_ons(add_on_service_id);

-- Customer marker indexes
CREATE INDEX IF NOT EXISTS idx_customer_markers_customer ON public.drop_point_customer_markers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_markers_drop_point ON public.drop_point_customer_markers(drop_point_id);
CREATE INDEX IF NOT EXISTS idx_customer_markers_marker ON public.drop_point_customer_markers(marker_id);

-- =====================================================
-- STEP 4: Create Drop-Point Functions and Triggers
-- =====================================================

-- Function to generate customer marker for drop-point orders
CREATE OR REPLACE FUNCTION generate_drop_point_marker()
RETURNS text AS $$
DECLARE
  marker_prefix text := 'DP';
  random_suffix text;
  marker_text text;
  attempts integer := 0;
  max_attempts integer := 10;
BEGIN
  -- Try up to 10 times to generate a unique marker
  WHILE attempts < max_attempts LOOP
    random_suffix := upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 6));
    marker_text := marker_prefix || random_suffix;

    -- Check if marker is unique
    IF NOT EXISTS (SELECT 1 FROM public.drop_point_customer_markers WHERE marker_id = marker_text) THEN
      RETURN marker_text;
    END IF;

    attempts := attempts + 1;
  END LOOP;

  -- If we can't generate a unique marker after 10 attempts, use timestamp
  random_suffix := upper(substring(extract(epoch from now())::text, 7, 6));
  RETURN marker_prefix || random_suffix;
END;
$$ LANGUAGE plpgsql;

-- Function to assign shelf to drop-point order
CREATE OR REPLACE FUNCTION assign_drop_point_shelf(p_drop_point_id bigint, p_order_invoice_id text, p_item_number integer, p_customer_id text)
RETURNS bigint AS $$
DECLARE
  assigned_shelf_id bigint;
BEGIN
  -- Find the first available shelf at the specified drop-point
  UPDATE public.drop_point_shelves
  SET
    is_occupied = true,
    order_invoice_id = p_order_invoice_id,
    item_number = p_item_number,
    customer_id = p_customer_id,
    updated_at = now()
  WHERE id = (
    SELECT id FROM public.drop_point_shelves
    WHERE drop_point_id = p_drop_point_id AND is_occupied = false
    ORDER BY shelf_number
    LIMIT 1 FOR UPDATE SKIP LOCKED
  )
  RETURNING id INTO assigned_shelf_id;

  -- Update drop-point capacity
  IF assigned_shelf_id IS NOT NULL THEN
    UPDATE public.drop_points
    SET current_capacity = current_capacity + 1,
        updated_at = now()
    WHERE id = p_drop_point_id;
  END IF;

  RETURN assigned_shelf_id;
END;
$$ LANGUAGE plpgsql;

-- Function to release shelf when order is completed
CREATE OR REPLACE FUNCTION release_drop_point_shelf(p_order_invoice_id text, p_item_number integer DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
  released_shelves_count integer := 0;
  drop_point_id bigint;
BEGIN
  -- Get drop_point_id before releasing shelves
  SELECT drop_point_id INTO drop_point_id
  FROM public.drop_point_shelves
  WHERE order_invoice_id = p_order_invoice_id
  LIMIT 1;

  -- Release specific shelf or all shelves for the order
  IF p_item_number IS NOT NULL THEN
    UPDATE public.drop_point_shelves
    SET is_occupied = false,
        order_invoice_id = NULL,
        item_number = NULL,
        customer_id = NULL,
        updated_at = now()
    WHERE order_invoice_id = p_order_invoice_id AND item_number = p_item_number;

    GET DIAGNOSTICS released_shelves_count = ROW_COUNT;
  ELSE
    UPDATE public.drop_point_shelves
    SET is_occupied = false,
        order_invoice_id = NULL,
        item_number = NULL,
        customer_id = NULL,
        updated_at = now()
    WHERE order_invoice_id = p_order_invoice_id;

    GET DIAGNOSTICS released_shelves_count = ROW_COUNT;
  END IF;

  -- Update drop-point capacity if shelves were released
  IF released_shelves_count > 0 AND drop_point_id IS NOT NULL THEN
    UPDATE public.drop_points
    SET current_capacity = GREATEST(0, current_capacity - released_shelves_count),
        updated_at = now()
    WHERE id = drop_point_id;
  END IF;

  RETURN released_shelves_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically apply White Treatment add-on
CREATE OR REPLACE FUNCTION apply_white_treatment_add_on()
RETURNS trigger AS $$
BEGIN
  -- Check if the item color is white and white treatment is not already applied
  IF NEW.color = 'white' AND COALESCE(NEW.has_white_treatment, false) = false THEN
    -- Find the White Treatment add-on service
    DECLARE
      white_treatment_id bigint;
    BEGIN
      SELECT id INTO white_treatment_id
      FROM public.add_on_services
      WHERE name = 'White Treatment' AND is_active = true
      LIMIT 1;

      -- If White Treatment service exists, apply it
      IF white_treatment_id IS NOT NULL THEN
        NEW.has_white_treatment := true;

        -- Add the add-on to the order_item_add_ons table
        INSERT INTO public.order_item_add_ons (order_item_id, add_on_service_id, is_automatic, trigger_reason)
        VALUES (NEW.id, white_treatment_id, true, 'color:white');
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: Create Triggers
-- =====================================================

-- Trigger to automatically apply White Treatment add-on
CREATE TRIGGER trigger_apply_white_treatment
  BEFORE INSERT OR UPDATE ON public.order_item
  FOR EACH ROW
  EXECUTE FUNCTION apply_white_treatment_add_on();

-- =====================================================
-- STEP 6: Initialize Default Data
-- =====================================================

-- Insert default drop-point locations if none exist
INSERT INTO public.drop_points (name, address, max_capacity)
VALUES
  ('NEW ORDER', 'Jl.B.S. Riadi No.29B, Oro-oro dowo, Malang', 30)
ON CONFLICT DO NOTHING;

-- Create default shelves for the drop-point (1-40)
INSERT INTO public.drop_point_shelves (drop_point_id, shelf_number)
SELECT
  dp.id,
  generate_series(1, dp.max_capacity)
FROM public.drop_points dp
WHERE NOT EXISTS (
  SELECT 1 FROM public.drop_point_shelves dps
  WHERE dps.drop_point_id = dp.id
)
LIMIT 1;

-- Insert default White Treatment add-on service
INSERT INTO public.add_on_services (name, description, price, trigger_condition)
VALUES
  ('White Treatment', 'Special treatment for white shoes to maintain brightness', 15000, 'color:white')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- STEP 7: Update Existing Data for Backward Compatibility
-- =====================================================

-- Set default fulfillment_type for existing orders
UPDATE public.orders
SET fulfillment_type = 'standard'
WHERE fulfillment_type IS NULL;

-- =====================================================
-- STEP 8: Add Useful Views
-- =====================================================

-- View for drop-point orders with details
CREATE OR REPLACE VIEW public.drop_point_orders_view AS
SELECT
  o.*,
  dp.name as drop_point_name,
  dp.address as drop_point_address,
  dpcm.marker_id as customer_marker,
  CASE
    WHEN dp.current_capacity >= dp.max_capacity THEN 'Full'
    WHEN dp.current_capacity >= (dp.max_capacity * 0.8) THEN 'High'
    WHEN dp.current_capacity >= (dp.max_capacity * 0.5) THEN 'Medium'
    ELSE 'Low'
  END as capacity_level
FROM public.orders o
LEFT JOIN public.drop_points dp ON o.drop_point_id = dp.id
LEFT JOIN public.drop_point_customer_markers dpcm ON o.customer_id = dpcm.customer_id AND o.drop_point_id = dpcm.drop_point_id
WHERE o.fulfillment_type = 'drop-point';

-- View for drop-point capacity status
CREATE OR REPLACE VIEW public.drop_point_capacity_view AS
SELECT
  dp.*,
  COUNT(CASE WHEN dps.is_occupied = true THEN 1 END) as occupied_shelves,
  COUNT(CASE WHEN dps.is_occupied = false THEN 1 END) as available_shelves,
  ROUND((COUNT(CASE WHEN dps.is_occupied = true THEN 1 END) * 100.0 / dp.max_capacity), 2) as occupancy_percentage
FROM public.drop_points dp
LEFT JOIN public.drop_point_shelves dps ON dp.id = dps.drop_point_id
GROUP BY dp.id, dp.name, dp.address, dp.max_capacity, dp.current_capacity, dp.is_active, dp.created_at, dp.updated_at;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Notes:
-- 1. This migration adds comprehensive drop-point functionality with:
--    - Drop-point locations with capacity management
--    - Shelf assignment system (1 item = 1 shelf)
--    - Color-based automatic add-ons (White Treatment)
--    - Customer marking system for drop-point tracking
--    - Item numbering and customization options
-- 2. The system enforces QRIS-only payments through application logic
-- 3. All new functionality is backward compatible with existing orders
-- 4. Views provide easy access to drop-point status and capacity information
-- 5. Indexes optimize performance for drop-point operations
-- 6. Functions and triggers automate common drop-point workflows