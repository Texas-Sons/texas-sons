-- Phase 1 "kernel": give every piece of business data a home in Postgres.
--
-- Before this, blueprints / prospects / studio history / settings existed ONLY in
-- the operator's browser localStorage, which meant no multi-device access, no
-- agent access, and permanent loss on a cache clear.
--
-- Written to be idempotent (IF NOT EXISTS everywhere) so it can be applied in any
-- order relative to the RLS hardening work in .agent-messages/rls-hardening-task.md.

-- ---------------------------------------------------------------------------
-- Ownership columns on existing tables
-- ---------------------------------------------------------------------------

-- client_intakes was created without an owner column, so owner-scoped RLS had
-- nothing to match on. See .agent-messages/rls-hardening-task.md step 3.
alter table if exists public.client_intakes
  add column if not exists owner_id uuid references auth.users(id);

alter table if exists public.projects
  add column if not exists owner_id uuid references auth.users(id);

alter table if exists public.invoices
  add column if not exists owner_id uuid references auth.users(id);

-- ---------------------------------------------------------------------------
-- New tables
-- ---------------------------------------------------------------------------

-- The blueprint library: reusable site definitions not yet tied to a project.
create table if not exists public.blueprints (
  id          text primary key,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Prospect pipeline: saved leads and dismissed places from the Maps search.
-- status distinguishes them so one table covers both localStorage keys.
create table if not exists public.prospects (
  id          text primary key,          -- Google Places place_id
  owner_id    uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'saved' check (status in ('saved', 'dismissed')),
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Studio working state: generation history plus the in-progress project.
create table if not exists public.studio_snapshots (
  id          text primary key,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  kind        text not null default 'history' check (kind in ('history', 'current')),
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- One settings row per operator.
create table if not exists public.user_settings (
  owner_id    uuid primary key references auth.users(id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists blueprints_owner_idx        on public.blueprints (owner_id);
create index if not exists prospects_owner_status_idx  on public.prospects (owner_id, status);
create index if not exists studio_snapshots_owner_idx  on public.studio_snapshots (owner_id, kind);
create index if not exists client_intakes_owner_idx    on public.client_intakes (owner_id);
create index if not exists projects_owner_idx          on public.projects (owner_id);
create index if not exists invoices_owner_idx          on public.invoices (owner_id);

-- ---------------------------------------------------------------------------
-- RLS on the new tables
--
-- The anon key ships in the browser bundle, so these policies are the real
-- boundary — not the API gate in lib/auth.ts, which is an independent layer.
-- Every policy is owner-scoped: you see your rows, nobody else's, and anon
-- sees nothing at all.
-- ---------------------------------------------------------------------------

alter table public.blueprints       enable row level security;
alter table public.prospects        enable row level security;
alter table public.studio_snapshots enable row level security;
alter table public.user_settings    enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['blueprints', 'prospects', 'studio_snapshots', 'user_settings']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_owner_rw', t);
    execute format(
      'create policy %I on public.%I
         for all
         to authenticated
         using (auth.uid() = owner_id)
         with check (auth.uid() = owner_id)',
      t || '_owner_rw', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array['blueprints', 'prospects', 'user_settings']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format(
      'create trigger %I before update on public.%I
         for each row execute function public.touch_updated_at()',
      t || '_touch', t
    );
  end loop;
end $$;
