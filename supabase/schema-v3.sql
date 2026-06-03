-- Margify v3 — AI Advisor enhancements
-- Run in Supabase → SQL Editor after schema-v2.sql

create extension if not exists "uuid-ossp";

-- Add weekly_review column to existing ai_recommendations table (if not exists)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'ai_recommendations' and column_name = 'weekly_review'
  ) then
    alter table public.ai_recommendations add column weekly_review jsonb;
  end if;
end $$;

-- Decision tracking (AI memory): accepted/dismissed recommendations
create table if not exists public.ai_advisor_decisions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  recommendation_title text not null,
  recommendation_category text,
  decision text not null check (decision in ('applied', 'dismissed')),
  decided_at timestamptz not null default now()
);

create index if not exists idx_ai_advisor_decisions_user
  on public.ai_advisor_decisions (user_id, decided_at desc);

-- Weekly AI Review (standalone table for history)
create table if not exists public.ai_advisor_weekly (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  review jsonb not null default '{}',
  generated_at timestamptz not null default now()
);

create index if not exists idx_ai_advisor_weekly_user
  on public.ai_advisor_weekly (user_id, generated_at desc);
