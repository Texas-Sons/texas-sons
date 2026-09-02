-- Every version of a site that ever went live, so a bad save is recoverable.
--
-- `projects.published_blueprint` holds exactly one version: the last one. Four
-- separate times during the Opalescent build an edit replaced a client's live
-- site with something materially worse — an AI edit that dropped the services
-- it was not asked about, a form that rebuilt the blueprint from the fields it
-- happened to show, a photo upload that republished a stale row, and a "Save &
-- Edit in Studio" that started over from the intake. Every one of those causes
-- is now fixed. None of them was recoverable while it was happening: the
-- operator restored the site by hand, from memory.
--
-- Fixing four causes does not make the fifth impossible. This is the safety
-- net, and it is deliberately independent of them.
--
-- Append-only. Nothing updates or deletes a row here except the retention trim
-- in the server, which drops the oldest beyond a cap. A history that could be
-- edited would be no history at all.

create table if not exists public.blueprint_versions (
  id          uuid primary key default gen_random_uuid(),
  project_id  text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,

  -- The exact blueprint that was published. Stored pre-merge, matching
  -- published_blueprint: client media is re-merged fresh on every publish, and
  -- storing the merged copy would bake one moment's photos in permanently.
  blueprint   jsonb not null,

  -- What the operator was doing. Free text, written by the server.
  label       text,

  created_at  timestamptz not null default now()
);

-- The only query this table serves: one project's versions, newest first.
create index if not exists blueprint_versions_project_idx
  on public.blueprint_versions (project_id, created_at desc);

create index if not exists blueprint_versions_owner_idx
  on public.blueprint_versions (owner_id);

-- ---------------------------------------------------------------------------
-- RLS
--
-- The anon key ships in the browser bundle, so this policy is the real
-- boundary, not the API gate in lib/auth.ts. Owner-scoped like every other
-- table here: you see your rows, nobody else's, and anon sees nothing.
--
-- A client's whole site history is in this table. A salon owner must never
-- reach another salon's, and neither must anyone holding the anon key.
-- ---------------------------------------------------------------------------

alter table public.blueprint_versions enable row level security;

drop policy if exists blueprint_versions_owner_rw on public.blueprint_versions;
create policy blueprint_versions_owner_rw on public.blueprint_versions
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

comment on table public.blueprint_versions is
  'Append-only history of published blueprints. Written by /api/deploy, read by the restore UI.';
comment on column public.blueprint_versions.blueprint is
  'The exact blueprint published, before client media was merged in.';
