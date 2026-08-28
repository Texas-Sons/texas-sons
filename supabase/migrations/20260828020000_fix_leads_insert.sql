-- URGENT: restore inbound lead capture.
--
-- Verified broken on 2026-08-28. Every form on every deployed client site was
-- returning HTTP 500:
--
--   POST /api/lead
--   -> {"success":false,"error":"new row violates row-level security policy
--       for table \"leads\""}
--
-- Cause: `leads` had RLS enabled with no policy permitting an insert from the
-- role the application actually uses. `/api/lead` builds its Supabase client
-- from VITE_SUPABASE_ANON_KEY (server.ts, getSupabase), so server-side inserts
-- arrive as `anon` — the same role a client site would use. With no anon INSERT
-- policy, every submission was rejected.
--
-- No migration in this repo had ever touched `leads`, so this predates the
-- 2026-08-28 RLS work rather than being caused by it. It was simply never
-- exercised end to end.
--
-- Intended contract (documented in AGENTS.md):
--   anon          -> INSERT only. Cannot read.
--   authenticated -> SELECT. The Studio reads lead counts and lists.

alter table public.leads enable row level security;

-- anon may submit, and only submit.
drop policy if exists "anon can submit leads" on public.leads;
create policy "anon can submit leads" on public.leads
  for insert
  to anon
  with check (true);

-- Authenticated submissions too, so a signed-in operator testing a live form
-- is not rejected.
drop policy if exists "authenticated can submit leads" on public.leads;
create policy "authenticated can submit leads" on public.leads
  for insert
  to authenticated
  with check (true);

-- Operators read the pipeline. anon deliberately gets no SELECT policy, so
-- inbound contact details stay unreadable with the public key.
drop policy if exists "authenticated can read leads" on public.leads;
create policy "authenticated can read leads" on public.leads
  for select
  to authenticated
  using (true);

-- Assert the end state rather than assuming it.
do $$
declare
  has_anon_insert boolean;
  has_anon_select boolean;
begin
  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads'
      and cmd = 'INSERT' and 'anon' = any(roles)
  ) into has_anon_insert;

  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads'
      and cmd in ('SELECT', 'ALL') and 'anon' = any(roles)
  ) into has_anon_select;

  if not has_anon_insert then
    raise exception 'leads: anon INSERT policy missing — client site forms will still fail';
  end if;

  if has_anon_select then
    raise exception 'leads: anon can SELECT — inbound contact details would be publicly readable';
  end if;
end $$;

-- FOLLOW-UP (not done here, needs a new secret):
-- Because /api/lead runs server-side, the more secure shape is for the server to
-- hold a service-role key and for anon to have NO write access at all. That
-- removes the spam vector this policy accepts — anyone holding the public anon
-- key can currently POST rows directly. Until then, /api/lead needs rate
-- limiting and a captcha.
