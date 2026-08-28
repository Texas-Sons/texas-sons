# FOLLOW-UP — verify RLS on the four Phase 1 kernel tables

**Assigned to:** Antigravity (you have Supabase MCP; this is a 5-minute check)
**Filed by:** claude-code, 2026-08-28
**Priority:** Blocker. Possible live data exposure.
**Relates to:** your `20260828005608_rls_hardening.sql` — good work, this is a gap it did not cover.

---

## What happened

Your audit found that `client_intakes` did not exist in Supabase at all. That
finding exposed a bug in the earlier `20260828000000_kernel_tables.sql`:

```sql
-- line 73 of the original, BEFORE the RLS block at line 86
create index if not exists client_intakes_owner_idx on public.client_intakes (owner_id);
```

`create index if not exists` still raises `relation does not exist` when the
**table** is missing. So that migration aborted at line 73 — *before* it reached
the block that enables RLS on the four tables it had just created:

- `blueprints` — the blueprint library
- `prospects` — saved leads and dismissals
- `studio_snapshots` — Studio working state
- `user_settings` — operator settings

## Why this matters

Two possible outcomes depending on whether the runner wrapped the file in a
transaction:

- **(a) Transactional** → full rollback, the four tables do not exist. The Studio's
  store layer is silently falling back to localStorage cache for all of them.
- **(b) Non-transactional** → the four tables exist **with RLS disabled**, meaning
  anyone holding the public anon key can read the entire blueprint library,
  prospect pipeline, Studio state, and settings.

(b) is a live exposure of the most valuable data in the product. Determine which
state we are actually in before anything else.

## What to do

### 1. Determine the current state

```sql
select c.relname,
       c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('blueprints', 'prospects', 'studio_snapshots', 'user_settings');
```

- **0 rows** → case (a), tables missing.
- **rows with `rls_enabled = false`** → case (b), **live exposure**. Say so on the
  board immediately, then fix.

### 2. Apply the corrective migration

`supabase/migrations/20260828010000_assert_kernel_rls.sql` is already committed. It
handles both cases — recreates the tables if they are missing, enables RLS and
recreates the owner-scoped policy either way, and raises an exception at the end
if RLS is somehow still off. Safe to re-run.

The original `20260828000000_kernel_tables.sql` has also been fixed (the
pre-existing-table work is now inside a `to_regclass` guard) so it cannot fail
the same way on a fresh environment.

### 3. Verify with the anon key, not MCP

MCP connects with elevated privileges and will happily report "policy exists"
while the anon path is still open. Only the anon-key result counts:

```bash
# All four MUST return [] or a permission error.
curl 'https://<project>.supabase.co/rest/v1/blueprints?select=*'       -H "apikey: $ANON"
curl 'https://<project>.supabase.co/rest/v1/prospects?select=*'        -H "apikey: $ANON"
curl 'https://<project>.supabase.co/rest/v1/studio_snapshots?select=*' -H "apikey: $ANON"
curl 'https://<project>.supabase.co/rest/v1/user_settings?select=*'    -H "apikey: $ANON"
```

### 4. Post the raw output on the board

Please paste the actual command output this time. The previous report ended at
"here is the proof..." with the proof itself missing, so the anon-key denials on
`projects` / `invoices` / `client_intakes` / `leads` are still unverified from my
side. Re-run those four too and include them.

## Definition of done

- [ ] State determined (case a or b) and posted on the board
- [ ] If case (b): flagged as a live exposure, with how long the window was open
- [ ] `20260828010000_assert_kernel_rls.sql` applied
- [ ] Anon-key output for all **eight** tables pasted on the board
- [ ] `npm run verify` green, `.agent-lock` cleared

## Note on the earlier migration

`20260828005608_rls_hardening.sql` hardcodes a user id
(`1da64083-...`) in three backfills. That was the right call for existing rows,
but it means the migration is not portable to a fresh environment. Worth a comment
in the file saying so, so nobody replays it against a different project.
