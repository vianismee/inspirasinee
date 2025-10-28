-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE dev.customers (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id text UNIQUE,
  username text,
  email text,
  whatsapp text UNIQUE,
  alamat text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE dev.discount (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  label text,
  amount integer,
  percent numeric,
  CONSTRAINT discount_pkey PRIMARY KEY (id)
);
CREATE TABLE dev.order_discounts (
  order_invoice_id text NOT NULL,
  discount_code text NOT NULL,
  discounted_amount integer NOT NULL,
  CONSTRAINT order_discounts_pkey PRIMARY KEY (order_invoice_id, discount_code),
  CONSTRAINT order_discounts_order_invoice_id_fkey FOREIGN KEY (order_invoice_id) REFERENCES dev.orders(invoice_id)
);
CREATE TABLE dev.order_item (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  invoice_id text,
  shoe_name text,
  amount integer,
  service text,
  CONSTRAINT order_item_pkey PRIMARY KEY (id),
  CONSTRAINT order_item_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES dev.orders(invoice_id)
);
CREATE TABLE dev.orders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  invoice_id text UNIQUE,
  customer_id text,
  subtotal integer,
  total_price integer,
  payment text,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  status text,
  referral_code character varying,
  referral_discount_amount numeric DEFAULT 0,
  points_awarded integer DEFAULT 0,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES dev.customers(customer_id)
);
CREATE TABLE dev.service_catalog (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text,
  amount integer NOT NULL,
  category_id bigint,
  CONSTRAINT service_catalog_pkey PRIMARY KEY (id),
  CONSTRAINT fk_service_catalog_category FOREIGN KEY (category_id) REFERENCES dev.service_category(id)
);
CREATE TABLE dev.service_category (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT service_category_pkey PRIMARY KEY (id)
);