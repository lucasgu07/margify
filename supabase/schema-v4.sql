-- Margify v4 — Inventory management tables
-- Run in Supabase → SQL Editor after schema-v3.sql

create extension if not exists "uuid-ossp";

-- ─── Manual stock levels per product ─────────────────────────────────────────
-- Stores current stock quantity and reorder settings per product per user.
-- Can be populated manually or synced from Shopify/TiendaNube.
create table if not exists public.inventory_stock (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  -- Matches Order.product_name — the join key across the system
  product_name text not null,
  -- Current units on hand
  current_stock integer not null default 0,
  -- Stock level that should trigger a reorder notification
  reorder_point integer not null default 10,
  -- Suggested quantity to reorder when reorder_point is reached
  reorder_quantity integer not null default 50,
  -- Days from order to receiving stock from supplier
  supplier_lead_days integer not null default 7,
  -- Cost per unit (overrides the % estimate from order data when set)
  cost_per_unit numeric,
  -- Optional: external SKU from platform (Shopify variant ID, etc.)
  external_sku text,
  -- Optional: variant label e.g. "Talle M / Color Negro"
  variant_label text,
  -- Source of the last stock update
  stock_source text default 'manual',   -- 'manual' | 'shopify' | 'tiendanube' | 'mercadolibre'
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_name)
);

create index if not exists idx_inventory_stock_user
  on public.inventory_stock (user_id);

create index if not exists idx_inventory_stock_product
  on public.inventory_stock (user_id, product_name);

-- ─── Inventory event log ──────────────────────────────────────────────────────
-- Audit trail of every stock change (sales, restocks, manual adjustments).
create table if not exists public.inventory_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  product_name text not null,
  event_type text not null,   -- 'sale' | 'restock' | 'adjustment' | 'sync'
  quantity_delta integer not null,  -- positive = stock added, negative = stock removed
  quantity_after integer,
  note text,
  source text default 'system',     -- 'system' | 'manual' | 'shopify' | 'tiendanube'
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_events_user_product
  on public.inventory_events (user_id, product_name, created_at desc);

create index if not exists idx_inventory_events_user_date
  on public.inventory_events (user_id, created_at desc);
