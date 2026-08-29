-- The event log: append-only record of what actually happened.
--
-- Everything the app stored until now was *current state* — a project's Status,
-- an intake's IntakeStatus. State cannot answer the questions Morgan actually
-- wants answered:
--
--   Which verticals convert? How long from prospect found to site live?
--   Which outreach template gets replies? Where do deals die?
--   How many prospects did I research and never contact?
--   What did each demo cost to produce?
--
-- Those are all questions about history, so history has to be recorded.
--
-- Append-only by design: rows are never updated or deleted. A funnel computed
-- from mutable rows is a funnel you cannot trust.

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,

  kind        text not null,

  -- Denormalised links. Kept as plain text with no foreign keys on purpose:
  -- an event describing a deleted prospect is still a true fact about what
  -- happened, and the funnel would be wrong if it vanished.
  intake_id   text,
  project_id  text,
  prospect_id text,

  -- Denormalised so "conversion rate by vertical" is one query with no joins,
  -- and stays correct even if the client's category is edited later.
  vertical    text,

  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Funnel queries scan by owner and time; segment queries add kind or vertical.
create index if not exists events_owner_time_idx     on public.events (owner_id, created_at desc);
create index if not exists events_owner_kind_idx     on public.events (owner_id, kind, created_at desc);
create index if not exists events_owner_vertical_idx on public.events (owner_id, vertical, created_at desc);
create index if not exists events_intake_idx         on public.events (intake_id, created_at) where intake_id is not null;

alter table public.events enable row level security;

-- Insert and read only. No update or delete policy exists, which is what makes
-- the log append-only for anything using the anon or authenticated key.
drop policy if exists "owners read their events" on public.events;
create policy "owners read their events" on public.events
  for select to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "owners record their events" on public.events;
create policy "owners record their events" on public.events
  for insert to authenticated
  with check (auth.uid() = owner_id);

do $$
declare
  can_update boolean;
begin
  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'events'
      and cmd in ('UPDATE', 'DELETE', 'ALL')
  ) into can_update;

  if can_update then
    raise warning 'events has an UPDATE/DELETE policy — the log is meant to be append-only.';
  end if;
end $$;
