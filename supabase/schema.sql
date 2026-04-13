-- Margify — esquema inicial (Supabase / PostgreSQL)
-- Ejecutá esto en el SQL Editor de Supabase o como migración.

create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text,
  created_at timestamptz default now(),
  plan text default 'starter',
  whatsapp_number text
);

create table if not exists public.stores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  platform text not null,
  store_url text,
  api_token text,
  connected_at timestamptz default now(),
  status text default 'connected'
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores (id) on delete cascade,
  external_id text,
  date date not null,
  revenue numeric not null default 0,
  product_name text,
  product_cost numeric default 0,
  shipping_cost numeric default 0,
  payment_commission numeric default 0,
  channel text,
  status text default 'completed'
);

create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores (id) on delete cascade,
  platform text,
  campaign_name text,
  spend numeric default 0,
  attributed_revenue numeric default 0,
  roas_platform numeric,
  roas_real numeric,
  status text,
  date date
);

create table if not exists public.costs_config (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  product_cost_percent numeric default 40,
  payment_commission_percent numeric default 3.5,
  shipping_cost_fixed numeric default 5,
  agency_fee_percent numeric default 0,
  unique (user_id)
);

create table if not exists public.alerts_config (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  alert_type text not null,
  threshold numeric,
  channel text,
  active boolean default true
);

create table if not exists public.alerts_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  alert_type text,
  message text,
  triggered_at timestamptz default now(),
  read boolean default false
);

create index if not exists idx_stores_user on public.stores (user_id);
create index if not exists idx_orders_store_date on public.orders (store_id, date desc);
create index if not exists idx_campaigns_store on public.campaigns (store_id);

alter table public.orders
  add column if not exists ads_spend_attributed numeric default 0;

-- Nota: en la app Next.js, mapeá `auth.users` con `public.users` vía trigger o
-- insertá filas en `public.users` al registrarse (Edge Function / webhook).
