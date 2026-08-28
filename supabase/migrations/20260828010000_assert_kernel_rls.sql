-- Corrective migration: guarantee RLS is on for the Phase 1 kernel tables.
--
-- Why this exists:
-- 20260828000000_kernel_tables.sql created blueprints / prospects /
-- studio_snapshots / user_settings and THEN enabled RLS on them. Between those
-- two steps it ran `create index ... on public.client_intakes`, and that table
-- did not exist yet (the app had only ever cached intakes in localStorage —
-- confirmed by the RLS audit on 2026-08-28). `create index if not exists` still
-- errors on a missing table, so the migration aborted before reaching the RLS
-- block.
--
-- Depending on whether the runner wrapped the file in a transaction, the result
-- was either (a) full rollback, so the tables do not exist, or (b) the tables
-- exist with RLS DISABLED — meaning the blueprint library, prospect pipeline,
-- studio state and settings were readable by anyone holding the public anon key.
--
-- This migration is safe to run in either state, and safe to re-run. It ends by
-- asserting the end state rather than assuming it.

-- Recreate the tables if the rollback case happened. No-ops otherwise.
create table if not exists public.blueprints (
  id          text primary key,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.prospects (
  id          text primary key,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'saved' check (status in ('saved', 'dismissed')),
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.studio_snapshots (
  id          text primary key,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  kind        text not null default 'history' check (kind in ('history', 'current')),
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.user_settings (
  owner_id    uuid primary key references auth.users(id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create index if not exists blueprints_owner_idx       on public.blueprints (owner_id);
create index if not exists prospects_owner_status_idx on public.prospects (owner_id, status);
create index if not exists studio_snapshots_owner_idx on public.studio_snapshots (owner_id, kind);

-- Enable RLS and (re)create the owner-scoped policy on each.
do $$
declare
  t text;
begin
  foreach t in array array['blueprints', 'prospects', 'studio_snapshots', 'user_settings']
  loop
    execute format('alter table public.%I enable row level security', t);
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

-- Assert the end state. If RLS somehow is not on, fail the migration rather than
-- reporting success over an open table.
do $$
declare
  unprotected text;
begin
  select string_agg(c.relname, ', ')
    into unprotected
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('blueprints', 'prospects', 'studio_snapshots', 'user_settings')
    and c.relrowsecurity = false;

  if unprotected is not null then
    raise exception 'RLS is still disabled on: %', unprotected;
  end if;
end $$;
