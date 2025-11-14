-- Migration: Drop-Point System Functions
-- This migration adds stored procedures and functions for drop-point order processing
-- Run this in your Supabase SQL editor or migration tool

-- =====================================================
-- STEP 1: Create Drop-Point Order Creation Function
-- =====================================================

CREATE OR REPLACE FUNCTION create_drop_point_order(
  p_invoice_id text,
  p_customer_id text,
  p_customer_name text,
  p_customer_whatsapp text,
  p_drop_point_id bigint,
  p_customer_marking text,
  p_items jsonb, -- Array of item objects
  p_total_price integer,
  p_payment_method text,
  p_payment_status text
)
RETURNS jsonb AS $$
DECLARE
  v_order_id bigint;
  v_item_count integer := 0;
  v_result jsonb;
  v_shelf_assignment_result bigint;
  v_marker_id text;
BEGIN
  -- Start transaction
  -- Create the main order record
  INSERT INTO public.orders (
    invoice_id,
    customer_id,
    subtotal,
    total_price,
    payment,
    fulfillment_type,
    drop_point_id,
    customer_marking,
    drop_point_capacity_used,
    created_at,
    status,
    payment_status
  ) VALUES (
    p_invoice_id,
    p_customer_id,
    p_total_price,
    p_total_price,
    p_payment_method,
    'drop-point',
    p_drop_point_id,
    p_customer_marking,
    jsonb_array_length(p_items),
    now(),
    'confirmed',
    p_payment_status
  ) RETURNING id INTO v_order_id;

  -- Process each item
  FOR v_item_count IN 0..jsonb_array_length(p_items) - 1 LOOP
    DECLARE
      v_item jsonb := p_items[v_item_count];
      v_order_item_id bigint;
    BEGIN
      -- Insert order item
      INSERT INTO public.order_item (
        invoice_id,
        shoe_name,
        custom_shoe_name,
        color,
        size,
        item_number,
        amount,
        has_white_treatment
      ) VALUES (
        p_invoice_id,
        v_item->>'shoe_name',
        COALESCE(v_item->>'custom_shoe_name', v_item->>'shoe_name'),
        v_item->>'color',
        v_item->>'size',
        (v_item->>'item_number')::integer,
        (v_item->>'total_price')::integer,
        (v_item->>'has_white_treatment')::boolean
      ) RETURNING id INTO v_order_item_id;

      -- Add add-ons if any
      IF v_item->>'has_white_treatment' = 'true' THEN
        INSERT INTO public.order_item_add_ons (order_item_id, add_on_service_id, is_automatic, trigger_reason)
        SELECT v_order_item_id, id, true, 'color:white'
        FROM public.add_on_services
        WHERE name = 'White Treatment' AND is_active = true
        LIMIT 1;
      END IF;

      -- Assign shelf for this item
      SELECT assign_drop_point_shelf(p_drop_point_id, p_invoice_id, (v_item->>'item_number')::integer, p_customer_id)
      INTO v_shelf_assignment_result;

      IF v_shelf_assignment_result IS NULL THEN
        RAISE EXCEPTION 'Failed to assign shelf for item %', v_item->>'item_number';
      END IF;

    END;
  END LOOP;

  -- Create or update customer marker
  v_marker_id := p_customer_marking;

  INSERT INTO public.drop_point_customer_markers (
    customer_id,
    drop_point_id,
    marker_id,
    total_items,
    total_orders,
    first_order_date,
    last_order_date
  ) VALUES (
    p_customer_id,
    p_drop_point_id,
    v_marker_id,
    jsonb_array_length(p_items),
    1,
    now(),
    now()
  )
  ON CONFLICT (customer_id, drop_point_id)
  DO UPDATE SET
    total_items = drop_point_customer_markers.total_items + jsonb_array_length(p_items),
    total_orders = drop_point_customer_markers.total_orders + 1,
    last_order_date = now(),
    marker_id = v_marker_id;

  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'invoice_id', p_invoice_id,
    'customer_marker', v_marker_id,
    'items_count', jsonb_array_length(p_items),
    'total_price', p_total_price,
    'drop_point_id', p_drop_point_id,
    'created_at', now()
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 2: Create Drop-Point Shelf Assignment Function (Already exists from migration 4)
-- =====================================================

-- Note: assign_drop_point_shelf function already exists in migration 004

-- =====================================================
-- STEP 3: Create Drop-Point Shelf Release Function (Already exists from migration 4)
-- =====================================================

-- Note: release_drop_point_shelf function already exists in migration 004

-- =====================================================
-- STEP 4: Create Function to Generate Customer Marker (Already exists from migration 4)
-- =====================================================

-- Note: generate_drop_point_marker function already exists in migration 004

-- =====================================================
-- STEP 5: Create Function for Drop-Point Order Status Updates
-- =====================================================

CREATE OR REPLACE FUNCTION update_drop_point_order_status(
  p_invoice_id text,
  p_new_status text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_order_record public.orders%ROWTYPE;
  v_shelves_released boolean := false;
BEGIN
  -- Get current order record
  SELECT * INTO v_order_record
  FROM public.orders
  WHERE invoice_id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Validate status transition
  IF p_new_status NOT IN ('confirmed', 'processing', 'ready', 'completed', 'cancelled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid status');
  END IF;

  -- Update order status
  UPDATE public.orders
  SET
    status = p_new_status,
    updated_at = now(),
    notes = COALESCE(p_notes, orders.notes)
  WHERE invoice_id = p_invoice_id;

  -- If order is completed or cancelled, release shelves
  IF p_new_status IN ('completed', 'cancelled') THEN
    PERFORM release_drop_point_shelf(p_invoice_id);
    v_shelves_released := true;
  END IF;

  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', p_invoice_id,
    'old_status', v_order_record.status,
    'new_status', p_new_status,
    'shelves_released', v_shelves_released,
    'updated_at', now()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 6: Create Function to Get Drop-Point Capacity Status
-- =====================================================

CREATE OR REPLACE FUNCTION get_drop_point_capacity_status(p_drop_point_id bigint)
RETURNS jsonb AS $$
DECLARE
  v_drop_point_info public.drop_points%ROWTYPE;
  v_occupied_shelves integer := 0;
  v_available_shelves integer := 0;
  v_occupancy_percentage numeric;
  v_capacity_level text;
BEGIN
  -- Get drop-point basic info
  SELECT * INTO v_drop_point_info
  FROM public.drop_points
  WHERE id = p_drop_point_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Drop-point not found or inactive');
  END IF;

  -- Count occupied shelves
  SELECT COUNT(*) INTO v_occupied_shelves
  FROM public.drop_point_shelves
  WHERE drop_point_id = p_drop_point_id AND is_occupied = true;

  -- Calculate available shelves
  v_available_shelves := v_drop_point_info.max_capacity - v_occupied_shelves;

  -- Calculate occupancy percentage
  v_occupancy_percentage := (v_occupied_shelves::numeric / v_drop_point_info.max_capacity::numeric) * 100;

  -- Determine capacity level
  IF v_occupancy_percentage >= 100 THEN
    v_capacity_level := 'Full';
  ELSIF v_occupancy_percentage >= 80 THEN
    v_capacity_level := 'High';
  ELSIF v_occupancy_percentage >= 50 THEN
    v_capacity_level := 'Medium';
  ELSE
    v_capacity_level := 'Low';
  END IF;

  -- Return capacity status
  RETURN jsonb_build_object(
    'success', true,
    'drop_point_id', p_drop_point_id,
    'drop_point_name', v_drop_point_info.name,
    'max_capacity', v_drop_point_info.max_capacity,
    'current_capacity', v_occupied_shelves,
    'available_capacity', v_available_shelves,
    'occupancy_percentage', ROUND(v_occupancy_percentage, 2),
    'capacity_level', v_capacity_level,
    'is_available', v_available_shelves > 0,
    'last_updated', now()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: Create Function for Customer Drop-Point History
-- =====================================================

CREATE OR REPLACE FUNCTION get_customer_drop_point_history(
  p_customer_id text,
  p_drop_point_id bigint DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_customer_orders jsonb := '[]'::jsonb;
  v_customer_markers jsonb := '[]'::jsonb;
  v_order_record RECORD;
BEGIN
  -- Get customer orders (drop-point orders only)
  FOR v_order_record IN
    SELECT
      o.*,
      dp.name as drop_point_name,
      dp.address as drop_point_address,
      oi.item_count
    FROM public.orders o
    LEFT JOIN public.drop_points dp ON o.drop_point_id = dp.id
    LEFT JOIN (
      SELECT invoice_id, COUNT(*) as item_count
      FROM public.order_item
      GROUP BY invoice_id
    ) oi ON o.invoice_id = oi.invoice_id
    WHERE o.customer_id = p_customer_id
      AND o.fulfillment_type = 'drop-point'
      AND (p_drop_point_id IS NULL OR o.drop_point_id = p_drop_point_id)
    ORDER BY o.created_at DESC
  LOOP
    v_customer_orders := v_customer_orders || jsonb_build_object(
      'invoice_id', v_order_record.invoice_id,
      'created_at', v_order_record.created_at,
      'status', v_order_record.status,
      'total_price', v_order_record.total_price,
      'payment_method', v_order_record.payment,
      'drop_point_name', v_order_record.drop_point_name,
      'drop_point_address', v_order_record.drop_point_address,
      'items_count', v_order_record.item_count,
      'customer_marking', v_order_record.customer_marking
    );
  END LOOP;

  -- Get customer markers
  SELECT jsonb_agg(jsonb_build_object(
    'marker_id', dpcm.marker_id,
    'drop_point_id', dpcm.drop_point_id,
    'drop_point_name', dp.name,
    'total_orders', dpcm.total_orders,
    'total_items', dpcm.total_items,
    'first_order_date', dpcm.first_order_date,
    'last_order_date', dpcm.last_order_date
  )) INTO v_customer_markers
  FROM public.drop_point_customer_markers dpcm
  JOIN public.drop_points dp ON dpcm.drop_point_id = dp.id
  WHERE dpcm.customer_id = p_customer_id
    AND (p_drop_point_id IS NULL OR dpcm.drop_point_id = p_drop_point_id);

  -- Return customer history
  RETURN jsonb_build_object(
    'success', true,
    'customer_id', p_customer_id,
    'orders', v_customer_orders,
    'markers', v_customer_markers,
    'total_orders', jsonb_array_length(v_customer_orders),
    'total_markers', COALESCE(jsonb_array_length(v_customer_markers), 0),
    'retrieved_at', now()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 8: Grant Execute Permissions
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_drop_point_order TO authenticated;
GRANT EXECUTE ON FUNCTION update_drop_point_order_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_drop_point_capacity_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_drop_point_history TO authenticated;
GRANT EXECUTE ON FUNCTION assign_drop_point_shelf TO authenticated;
GRANT EXECUTE ON FUNCTION release_drop_point_shelf TO authenticated;
GRANT EXECUTE ON FUNCTION generate_drop_point_marker TO authenticated;

-- Grant execute permissions to service role (for backend operations)
GRANT EXECUTE ON FUNCTION create_drop_point_order TO service_role;
GRANT EXECUTE ON FUNCTION update_drop_point_order_status TO service_role;
GRANT EXECUTE ON FUNCTION get_drop_point_capacity_status TO service_role;
GRANT EXECUTE ON FUNCTION get_customer_drop_point_history TO service_role;
GRANT EXECUTE ON FUNCTION assign_drop_point_shelf TO service_role;
GRANT EXECUTE ON FUNCTION release_drop_point_shelf TO service_role;
GRANT EXECUTE ON FUNCTION generate_drop_point_marker TO service_role;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Notes:
-- 1. This migration adds comprehensive stored procedures for drop-point order management
-- 2. Functions include proper error handling and transaction management
-- 3. Security is implemented with SECURITY DEFINER and proper permissions
-- 4. All functions return JSON responses for easy API integration
-- 5. Functions support both single and multi-item order processing
-- 6. Customer marking and shelf management are fully automated
-- 7. Capacity management and status tracking are included