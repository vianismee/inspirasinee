-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.add_on_services (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  description text,
  price integer NOT NULL,
  trigger_condition text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT add_on_services_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text DEFAULT 'admin'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.banners (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  image_url text NOT NULL,
  image_ratio text NOT NULL,
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  name text,
  CONSTRAINT banners_pkey PRIMARY KEY (id)
);
CREATE TABLE public.customer_membership_levels (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  level_index integer NOT NULL UNIQUE CHECK (level_index > 0),
  points_multiplier numeric NOT NULL DEFAULT 1.0 CHECK (points_multiplier > 0::numeric),
  points_per_transaction integer NOT NULL DEFAULT 1 CHECK (points_per_transaction > 0),
  discount_percent integer NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_max_amount integer NOT NULL DEFAULT 0 CHECK (discount_max_amount >= 0),
  transaction_threshold integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customer_membership_levels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.customer_memberships (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id text NOT NULL UNIQUE,
  membership_level_id bigint NOT NULL,
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  total_transactions integer NOT NULL DEFAULT 0 CHECK (total_transactions >= 0),
  shine_points integer NOT NULL DEFAULT 0 CHECK (shine_points >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customer_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT customer_memberships_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT customer_memberships_membership_level_id_fkey FOREIGN KEY (membership_level_id) REFERENCES public.customer_membership_levels(id)
);
CREATE TABLE public.customer_points (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id text NOT NULL UNIQUE,
  current_balance integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  total_redeemed integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customer_points_pkey PRIMARY KEY (id),
  CONSTRAINT customer_points_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);
CREATE TABLE public.customers (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id text UNIQUE,
  username text,
  email text,
  whatsapp text UNIQUE,
  alamat text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dashboard_access_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  phone character varying,
  hash character varying,
  ip_address character varying,
  user_agent text,
  action character varying NOT NULL,
  success boolean NOT NULL,
  error_reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dashboard_access_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dashboard_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hash character varying NOT NULL UNIQUE,
  phone character varying NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  dashboard_session_expires timestamp with time zone NOT NULL,
  ip_address character varying,
  user_agent text,
  used boolean DEFAULT false,
  accessed_at timestamp with time zone,
  access_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dashboard_sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.discount (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  label text,
  amount integer,
  percent numeric,
  CONSTRAINT discount_pkey PRIMARY KEY (id)
);
CREATE TABLE public.drop_point_customer_markers (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id text NOT NULL,
  drop_point_id bigint NOT NULL,
  marker_id text NOT NULL UNIQUE,
  total_orders integer NOT NULL DEFAULT 1,
  total_items integer NOT NULL DEFAULT 0,
  first_order_date timestamp with time zone DEFAULT now(),
  last_order_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT drop_point_customer_markers_pkey PRIMARY KEY (id),
  CONSTRAINT fk_markers_customer FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT fk_markers_drop_point FOREIGN KEY (drop_point_id) REFERENCES public.drop_points(id)
);
CREATE TABLE public.drop_point_shelves (
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
  CONSTRAINT fk_shelves_drop_point FOREIGN KEY (drop_point_id) REFERENCES public.drop_points(id),
  CONSTRAINT fk_shelves_order FOREIGN KEY (order_invoice_id) REFERENCES public.orders(invoice_id)
);
CREATE TABLE public.drop_points (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  max_capacity integer NOT NULL DEFAULT 40 CHECK (max_capacity > 0),
  current_capacity integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT drop_points_pkey PRIMARY KEY (id)
);
CREATE TABLE public.membership_benefits (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  membership_level_id bigint NOT NULL,
  icon_name text NOT NULL,
  title text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT membership_benefits_pkey PRIMARY KEY (id),
  CONSTRAINT membership_benefits_membership_level_id_fkey FOREIGN KEY (membership_level_id) REFERENCES public.customer_membership_levels(id)
);
CREATE TABLE public.membership_level_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id text NOT NULL,
  from_level_id bigint,
  to_level_id bigint NOT NULL,
  changed_at timestamp with time zone DEFAULT now(),
  trigger_reason text,
  CONSTRAINT membership_level_history_pkey PRIMARY KEY (id),
  CONSTRAINT membership_level_history_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT membership_level_history_from_level_id_fkey FOREIGN KEY (from_level_id) REFERENCES public.customer_membership_levels(id),
  CONSTRAINT membership_level_history_to_level_id_fkey FOREIGN KEY (to_level_id) REFERENCES public.customer_membership_levels(id)
);
CREATE TABLE public.order_discounts (
  order_invoice_id text NOT NULL,
  discount_code text NOT NULL,
  discounted_amount integer NOT NULL,
  CONSTRAINT order_discounts_pkey PRIMARY KEY (order_invoice_id, discount_code),
  CONSTRAINT order_discounts_order_invoice_id_fkey FOREIGN KEY (order_invoice_id) REFERENCES public.orders(invoice_id)
);
CREATE TABLE public.order_item (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  invoice_id text,
  shoe_name text,
  amount integer,
  service text,
  color text,
  size text,
  item_number integer,
  has_white_treatment boolean DEFAULT false,
  custom_shoe_name text,
  CONSTRAINT order_item_pkey PRIMARY KEY (id),
  CONSTRAINT order_item_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.orders(invoice_id)
);
CREATE TABLE public.order_item_add_ons (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  order_item_id bigint NOT NULL,
  add_on_service_id bigint NOT NULL,
  applied_at timestamp with time zone DEFAULT now(),
  is_automatic boolean NOT NULL DEFAULT false,
  trigger_reason text,
  CONSTRAINT order_item_add_ons_pkey PRIMARY KEY (id),
  CONSTRAINT fk_add_ons_order_item FOREIGN KEY (order_item_id) REFERENCES public.order_item(id),
  CONSTRAINT fk_add_ons_service FOREIGN KEY (add_on_service_id) REFERENCES public.add_on_services(id)
);
CREATE TABLE public.orders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  invoice_id text UNIQUE,
  customer_id text,
  subtotal integer,
  payment text,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  status text,
  referral_code character varying,
  referral_discount_amount numeric DEFAULT 0,
  points_awarded integer DEFAULT 0,
  points_used integer DEFAULT 0,
  total_price integer,
  points_discount_amount numeric DEFAULT 0,
  fulfillment_type text DEFAULT 'standard'::text CHECK (fulfillment_type = ANY (ARRAY['standard'::text, 'drop-point'::text])),
  drop_point_id bigint,
  customer_marking text,
  drop_point_capacity_used integer DEFAULT 0,
  membership_discount_amount numeric DEFAULT 0,
  membership_level_id bigint,
  shine_points_discount_amount numeric DEFAULT 0,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT orders_membership_level_id_fkey FOREIGN KEY (membership_level_id) REFERENCES public.customer_membership_levels(id)
);
CREATE TABLE public.points_transactions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id text NOT NULL,
  transaction_type text NOT NULL,
  points_change integer NOT NULL,
  balance_after integer NOT NULL,
  reference_type text NOT NULL,
  reference_id text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT points_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT points_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);
CREATE TABLE public.referral_settings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  referral_discount_amount integer NOT NULL DEFAULT 0,
  referrer_points_earned integer NOT NULL DEFAULT 0,
  points_redemption_minimum integer NOT NULL DEFAULT 50,
  points_redemption_value integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  shine_points_redemption_value integer NOT NULL DEFAULT 1000,
  shine_points_redemption_minimum integer NOT NULL DEFAULT 50,
  CONSTRAINT referral_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.referral_usage (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  referral_code text NOT NULL,
  referrer_customer_id text NOT NULL,
  referred_customer_id text NOT NULL,
  order_invoice_id text NOT NULL,
  discount_applied integer NOT NULL,
  points_awarded integer NOT NULL,
  used_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referral_usage_pkey PRIMARY KEY (id),
  CONSTRAINT referral_usage_referrer_fkey FOREIGN KEY (referrer_customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT referral_usage_referred_fkey FOREIGN KEY (referred_customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT referral_usage_order_fkey FOREIGN KEY (order_invoice_id) REFERENCES public.orders(invoice_id)
);
CREATE TABLE public.service_catalog (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text,
  amount integer NOT NULL,
  category_id bigint,
  CONSTRAINT service_catalog_pkey PRIMARY KEY (id),
  CONSTRAINT fk_service_catalog_category FOREIGN KEY (category_id) REFERENCES public.service_category(id)
);
CREATE TABLE public.service_category (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT service_category_pkey PRIMARY KEY (id)
);