-- Client-owned media, kept deliberately outside the blueprint.
--
-- On 2026-08-30 the Studio overwrote a server-side blueprint edit: it holds a
-- cached copy and saves the whole object, so anything changed elsewhere while it
-- is open gets clobbered. If a client's portfolio lived on the blueprint, the
-- same thing would silently delete her photos every time the Studio saved.
--
-- So her content lives here instead. She writes client_media, the operator
-- writes projects, and neither can destroy the other's work. The deploy step
-- merges the two. This sidesteps the conflict rather than trying to manage it.

create table if not exists public.client_media (
  id          uuid primary key default gen_random_uuid(),
  project_id  text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,

  -- 'portfolio'  a single image for the gallery
  -- 'beforeAfter' a pair; data carries before + after
  -- 'product'    a retail item
  kind        text not null check (kind in ('portfolio', 'beforeAfter', 'product')),

  data        jsonb not null default '{}'::jsonb,
  /** Lower sorts first. Lets her reorder without rewriting rows. */
  sort_order  int not null default 0,
  /** Soft delete: she can remove an item without losing the audit trail. */
  hidden      boolean not null default false,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists client_media_project_idx
  on public.client_media (project_id, kind, sort_order)
  where hidden = false;

-- The portal token lives on the project, not the intake. The project is what
-- actually gets deployed, and nothing reliably links an intake to its project —
-- handleLaunchStudioFromClient mints a fresh id rather than carrying one over.
alter table if exists public.projects
  add column if not exists portal_token text;

alter table if exists public.projects
  add column if not exists portal_token_revoked boolean not null default false;

create unique index if not exists projects_portal_token_idx
  on public.projects (portal_token)
  where portal_token is not null;

-- RLS: operators read and manage their own clients' media. The portal itself
-- reaches this only through the server's service-role client, authenticated by
-- an unguessable token — so `anon` needs no policy at all, same as the intake
-- portal and stricter than the leads table.
alter table public.client_media enable row level security;

drop policy if exists "owners manage their client media" on public.client_media;
create policy "owners manage their client media" on public.client_media
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create or replace function public.touch_client_media()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists client_media_touch on public.client_media;
create trigger client_media_touch before update on public.client_media
  for each row execute function public.touch_client_media();

-- Report rather than assume.
do $$
declare
  anon_policies int;
begin
  select count(*) into anon_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'client_media' and 'anon' = any(roles);

  if anon_policies > 0 then
    raise warning 'client_media has % anon policy/policies — the portal reaches it via service role and needs none.', anon_policies;
  end if;
end $$;
