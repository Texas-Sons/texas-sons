-- URGENT v2: restore inbound lead capture. Supersedes 20260828020000.
--
-- Why a v2:
-- The first attempt ended with an assertion that RAISED if anon still had a
-- SELECT policy. If such a policy existed, that raise aborted the transaction
-- and rolled back the anon INSERT policy the migration had just created — the
-- guard undid the repair. Verified still broken afterwards:
--
--   POST /rest/v1/leads (anon) -> 42501 new row violates row-level security policy
--
-- This version repairs instead of refusing: it clears every existing policy on
-- `leads` and rebuilds the documented contract from scratch, so it converges on
-- the right state no matter what was there before.
--
-- Contract (AGENTS.md):
--   anon          -> INSERT only, never SELECT
--   authenticated -> INSERT + SELECT

-- Step 1: report what is there now, so the run is not a black box.
do $$
declare
  r record;
  found boolean := false;
begin
  raise notice '--- existing policies on public.leads ---';
  for r in
    select policyname, cmd, roles::text as roles
    from pg_policies
    where schemaname = 'public' and tablename = 'leads'
    order by policyname
  loop
    found := true;
    raise notice 'policy: % | cmd: % | roles: %', r.policyname, r.cmd, r.roles;
  end loop;
  if not found then
    raise notice '(none — RLS was on with no policies, which denies everything)';
  end if;
end $$;

-- Step 2: clear the slate. Whatever combination existed, it was not working.
do $$
declare
  r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'leads'
  loop
    execute format('drop policy if exists %I on public.leads', r.policyname);
    raise notice 'dropped policy: %', r.policyname;
  end loop;
end $$;

-- Step 3: rebuild the contract.
alter table public.leads enable row level security;

-- Live client sites post here with no session.
create policy "anon can submit leads" on public.leads
  for insert to anon with check (true);

-- A signed-in operator testing a live form must not be rejected.
create policy "authenticated can submit leads" on public.leads
  for insert to authenticated with check (true);

-- Operators read the pipeline. anon deliberately gets NO select policy.
create policy "authenticated can read leads" on public.leads
  for select to authenticated using (true);

-- Step 4: verify, and report rather than silently pass.
do $$
declare
  anon_insert boolean;
  anon_select boolean;
  auth_select boolean;
begin
  select exists (select 1 from pg_policies where schemaname='public' and tablename='leads'
                 and cmd='INSERT' and 'anon' = any(roles)) into anon_insert;
  select exists (select 1 from pg_policies where schemaname='public' and tablename='leads'
                 and cmd in ('SELECT','ALL') and 'anon' = any(roles)) into anon_select;
  select exists (select 1 from pg_policies where schemaname='public' and tablename='leads'
                 and cmd in ('SELECT','ALL') and 'authenticated' = any(roles)) into auth_select;

  raise notice '--- final state ---';
  raise notice 'anon can INSERT      : %  (must be true)',  anon_insert;
  raise notice 'anon can SELECT      : %  (must be false)', anon_select;
  raise notice 'authenticated SELECT : %  (must be true)',  auth_select;

  -- Only the insert path is fatal: without it, client sites stay broken, which
  -- is the problem this migration exists to solve.
  if not anon_insert then
    raise exception 'leads: anon INSERT policy missing — client site forms will still fail';
  end if;

  -- A leftover anon read is a real problem, but do NOT roll back the repair over
  -- it. Step 2 should have removed any such policy; warn loudly if one survived.
  if anon_select then
    raise warning 'leads: anon can still SELECT — inbound contact details are publicly readable. Investigate immediately.';
  end if;
end $$;
