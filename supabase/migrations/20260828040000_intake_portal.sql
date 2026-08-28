-- Phase 2: client intake portal.
--
-- Replaces the copy-paste "please reply to this email with your logo and photos"
-- flow in ClientIntakeView with a tokenised link the client fills in themselves.
-- Manual asset gathering is the bottleneck named in aios-intake.md Q7.
--
-- Access model: the portal is public (clients have no account), and the server
-- reads and writes it with the service-role client. anon therefore needs NO
-- policies on these tables at all — which is stricter than the `leads` approach
-- and closes the spam vector that an anon INSERT policy would open.

-- Per-client share token. Unguessable, revocable, one per intake.
alter table if exists public.client_intakes
  add column if not exists share_token text;

alter table if exists public.client_intakes
  add column if not exists share_token_revoked boolean not null default false;

create unique index if not exists client_intakes_share_token_idx
  on public.client_intakes (share_token)
  where share_token is not null;

-- What clients submit. Kept separate from client_intakes on purpose: a
-- submission is raw client input, not curated agency data. Morgan reviews and
-- merges it rather than letting a public form overwrite a live record.
create table if not exists public.intake_submissions (
  id          uuid primary key default gen_random_uuid(),
  intake_id   text not null references public.client_intakes(id) on delete cascade,
  payload     jsonb not null default '{}'::jsonb,
  reviewed    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists intake_submissions_intake_idx
  on public.intake_submissions (intake_id, created_at desc);

-- RLS: operators read submissions for intakes they own. No anon policy exists,
-- so the public key cannot read or write this table under any circumstance —
-- the portal reaches it only through the server's service-role client.
alter table public.intake_submissions enable row level security;

drop policy if exists "owners read their intake submissions" on public.intake_submissions;
create policy "owners read their intake submissions" on public.intake_submissions
  for select to authenticated
  using (
    exists (
      select 1 from public.client_intakes ci
      where ci.id = intake_submissions.intake_id
        and ci.owner_id = auth.uid()
    )
  );

drop policy if exists "owners update their intake submissions" on public.intake_submissions;
create policy "owners update their intake submissions" on public.intake_submissions
  for update to authenticated
  using (
    exists (
      select 1 from public.client_intakes ci
      where ci.id = intake_submissions.intake_id
        and ci.owner_id = auth.uid()
    )
  );

-- Verify, warning rather than raising: this migration must not be able to abort
-- its own repair the way the leads fix did on 2026-08-28.
do $$
declare
  anon_policies int;
begin
  select count(*) into anon_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'intake_submissions'
    and 'anon' = any(roles);

  if anon_policies > 0 then
    raise warning 'intake_submissions has % anon policy/policies — the portal does not need any; investigate.', anon_policies;
  end if;
end $$;
