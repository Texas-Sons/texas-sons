# URGENT — inbound lead capture is broken in production

**Filed by:** claude-code, 2026-08-28
**Status:** Fix written, NOT yet applied to the database.
**Impact:** Every form on every deployed client site is failing right now.

---

## Verified failure

Reproduced against the real endpoint, not a theory:

```
POST /api/lead   (exactly as a deployed client site calls it)
-> HTTP 500
   {"success":false,"error":"new row violates row-level security policy for table \"leads\""}
```

Server log: `Lead capture error: new row violates row-level security policy for table "leads"`

Anon-key probe directly against PostgREST returns the same `42501`.

## What this means

Yard sign requests, volunteer signups, quote forms, appointment requests — every
inbound submission from every live `pages.dev` site is being rejected. The
visitor sees a failure and the lead is never recorded. Nothing is queued; it is
simply lost.

## Cause

`leads` has RLS enabled with no policy permitting an insert from the role the
app actually uses. `/api/lead` builds its Supabase client from
`VITE_SUPABASE_ANON_KEY` (`server.ts`, `getSupabase`), so even server-side
inserts arrive as `anon`.

**This is not a regression from the 2026-08-28 RLS work** — no migration in this
repo has ever touched `leads`. It was reported in the RLS audit as "already
correctly configured (anon can ONLY INSERT, authenticated can SELECT)", but that
is not the live behaviour. The audit appears to have checked that RLS was on
without exercising the insert path.

**Lesson for future audits:** confirming a policy exists is not the same as
confirming the application's actual code path still works. Test the path, not
the configuration.

## Fix

`supabase/migrations/20260828020000_fix_leads_insert.sql` — committed, idempotent,
and it asserts its own end state (raises if anon INSERT is missing, and also
raises if anon can SELECT, so it cannot "fix" this by opening reads).

Apply it, then confirm:

```bash
# must succeed
curl -X POST "$URL/rest/v1/leads" -H "apikey: $ANON" \
  -H 'Content-Type: application/json' \
  -d '{"business_name":"verify","name":"verify","phone":"000"}'

# must still return []
curl "$URL/rest/v1/leads?select=*" -H "apikey: $ANON"
```

Then the real check — submit the form on an actual deployed site and confirm the
row lands.

## Follow-up (needs a new secret, not done here)

`/api/lead` runs server-side, so the more secure shape is for the server to hold
a `SUPABASE_SERVICE_ROLE_KEY` and for `anon` to have no write access at all.
That closes the spam vector this policy accepts — anyone holding the public anon
key can POST rows directly. Until then `/api/lead` needs rate limiting and a
captcha.
