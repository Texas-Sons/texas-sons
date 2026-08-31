-- Client accounts: who, besides the operator, may manage a project's content.
--
-- Until now the client portal was one unguessable link and nothing else. That
-- works for a single owner and fails the moment a salon has staff: a shared link
-- cannot be revoked for one stylist without revoking it for everyone, and it
-- cannot say who uploaded what.
--
-- Membership is keyed on EMAIL, not on a user id, deliberately. Access is
-- granted before the person has ever signed in — the operator adds a stylist,
-- and she authenticates with Google whenever she gets round to it. Keying on
-- auth.users(id) would need a nullable column plus a binding step on first
-- login, and a binding step is a race waiting to be lost.
--
-- The token link is NOT removed by this migration. It keeps working alongside,
-- because breaking the flow that works to ship the one that is better is how you
-- end up with neither.

create table if not exists public.client_users (
  id          uuid primary key default gen_random_uuid(),
  project_id  text not null,

  -- Lowercased on write and compared lowercased. Google hands back whatever
  -- casing the user typed, and 'Annie@x.com' must not be a second account.
  email       text not null,

  -- 'owner'  may manage access as well as content
  -- 'member' may manage content only
  role        text not null default 'member' check (role in ('owner', 'member')),

  /** The operator who granted this. Kept for the audit trail, not for auth. */
  invited_by  uuid references auth.users(id) on delete set null,

  created_at  timestamptz not null default now(),
  last_seen_at timestamptz
);

-- One row per person per project. Re-inviting someone updates rather than
-- duplicating, and duplicates would make role resolution ambiguous.
create unique index if not exists client_users_project_email_idx
  on public.client_users (project_id, lower(email));

create index if not exists client_users_email_idx
  on public.client_users (lower(email));

-- RLS: the operator who owns the project manages its roster. Client users never
-- reach this table directly — the server resolves membership with the
-- service-role client after verifying their session, exactly as the portal
-- already does for client_media. So `anon` and ordinary `authenticated` users
-- need no policy here at all.
alter table public.client_users enable row level security;

drop policy if exists "operators manage their project rosters" on public.client_users;
create policy "operators manage their project rosters" on public.client_users
  for all to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = client_users.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = client_users.project_id and p.owner_id = auth.uid()
    )
  );

-- Report rather than assume. Same check the client_media migration makes: a
-- stray anon policy here would expose every client's roster.
do $$
declare
  anon_policies int;
begin
  select count(*) into anon_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'client_users' and 'anon' = any(roles);

  if anon_policies > 0 then
    raise warning 'client_users has % anon policy/policies — membership is resolved server-side and needs none.', anon_policies;
  end if;
end $$;
