-- Margify v2 — tablas usadas por la app Next.js (auth.users.id como user_id)
-- Ejecutá en Supabase → SQL Editor después de schema.sql (o standalone).

create extension if not exists "uuid-ossp";

-- OAuth / tokens por usuario (servidor; RLS desactivado, solo service role)
create table if not exists public.user_integrations (
  user_id uuid not null,
  provider text not null,
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

create index if not exists idx_user_integrations_user on public.user_integrations (user_id);

-- Costos por usuario (reemplaza cookie margify_user_costs)
create table if not exists public.user_costs (
  user_id uuid primary key,
  product_cost_percent numeric not null default 40,
  payment_commission_percent numeric not null default 3.5,
  shipping_cost_fixed numeric not null default 5,
  agency_fee_percent numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- Cuota Margify AI por mes
create table if not exists public.ai_usage (
  user_id uuid not null,
  month_key text not null,
  query_count integer not null default 0,
  primary key (user_id, month_key)
);

-- Reglas de alertas
create table if not exists public.user_alerts_config (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  alert_type text not null,
  title text not null default '',
  description text not null default '',
  threshold numeric not null default 0,
  channel text not null default 'email',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_alerts_config_user on public.user_alerts_config (user_id);

-- Historial de alertas disparadas
create table if not exists public.user_alerts_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  alert_type text not null,
  message text not null,
  channel text not null default 'email',
  triggered_at timestamptz not null default now(),
  read boolean not null default false
);

create index if not exists idx_user_alerts_history_user on public.user_alerts_history (user_id, triggered_at desc);
