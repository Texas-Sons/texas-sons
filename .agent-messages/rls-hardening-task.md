# TASK — Row Level Security audit + hardening (Supabase)

**Assigned to:** Antigravity
**Filed by:** claude-code, 2026-08-28
**Priority:** Blocker. Nothing ships to a real client until this is closed.
**Lane note:** This is a cross-lane task (data/security). Take `.agent-lock` before editing.

---

## Why this matters

As of 2026-08-28 every `/api` route is gated server-side by `requireAdmin`
(`lib/auth.ts`), which verifies the Supabase session JWT and checks the email
against `ADMIN_EMAILS`. That closed the API hole.

**It does not close the database hole.** `VITE_SUPABASE_ANON_KEY` is compiled
into the browser bundle and is therefore public to anyone who views source on a
deployed client site. If RLS is disabled or permissive on our tables, an attacker
skips our API entirely and talks to Supabase directly:

```
curl 'https://<project>.supabase.co/rest/v1/projects?select=*' \
  -H "apikey: <the anon key from our bundle>"
```

If that returns rows, every client blueprint, contact, contract, and invoice we
hold is public. RLS is the second half of the boundary. The API gate is worthless
without it.

---

## Scope — four tables

| Table | Holds | Owner column |
|---|---|---|
| `projects` | client sites + full `blueprint` JSON | `owner_id` ✅ |
| `invoices` | amounts, client names, due dates | `owner_id` ✅ |
| `client_intakes` | contacts, phones, emails, contracts | **missing — see step 3** |
| `leads` | inbound form submissions from live sites | n/a (public insert) |

---

## Steps

### 1. Audit current state

For each of the four tables report:
- Is RLS **enabled**? (`select relname, relrowsecurity from pg_class where relname in (...)`)
- What policies exist? (`select * from pg_policies where schemaname = 'public'`)
- Any policy using `USING (true)` or granting `anon` more than it needs

Post the findings on the board **before** changing anything. If RLS turns out to
be enabled and correct, say so and stop — do not churn working policies.

### 2. Write the policies

Target state:

- **`projects`, `invoices`** — RLS enabled. Authenticated users may
  select/insert/update/delete **only rows where `auth.uid() = owner_id`**.
  `anon` gets nothing.
- **`client_intakes`** — same, once step 3 gives it an owner column.
- **`leads`** — `anon` may **insert only** (live client sites post here with no
  session). `authenticated` may select. `anon` must **not** be able to select —
  verify this specifically, since a public read on `leads` leaks every inbound
  prospect's contact details.

Deliver as a committed migration file, not dashboard-only clicks:
`supabase/migrations/<timestamp>_enable_rls.sql`. Dashboard-only changes are
invisible to the repo and get lost on a project rebuild.

### 3. `client_intakes` has no owner column

Confirmed from `src/components/ClientIntake/ClientIntakeView.tsx:423` — the
upsert writes `id, business_name, client_contact, email, phone, address, domain,
category, tier, status, theme, tagline, description, data, updated_at`. No
`owner_id`.

Add `owner_id uuid references auth.users(id)`, backfill existing rows to Morgan's
user id, then apply the same owner-scoped policy. Update the upsert in
`ClientIntakeView.tsx` to write `owner_id` on save, or the policy will reject
every new intake.

### 4. Verify like an attacker

Do not test through the app — the app has a session, so it proves nothing.
Test with the raw anon key, exactly as an attacker would:

```bash
# Each of these MUST return an empty array or a permission error.
curl 'https://<project>.supabase.co/rest/v1/projects?select=*'       -H "apikey: $ANON"
curl 'https://<project>.supabase.co/rest/v1/invoices?select=*'       -H "apikey: $ANON"
curl 'https://<project>.supabase.co/rest/v1/client_intakes?select=*' -H "apikey: $ANON"
curl 'https://<project>.supabase.co/rest/v1/leads?select=*'          -H "apikey: $ANON"

# This MUST still succeed — live client sites depend on it.
curl -X POST 'https://<project>.supabase.co/rest/v1/leads' \
  -H "apikey: $ANON" -H 'Content-Type: application/json' \
  -d '{"business_name":"rls test","name":"test","email":"t@example.com"}'
```

Paste the actual output in the board note. "Looks fine" is not verification.

### 5. Regression-check the app

RLS breaks silently — reads return `[]` rather than erroring, so the UI just
looks empty. After applying, confirm in the running app:
- Dashboard and Projects still list existing projects
- Billing still lists invoices
- Client Intake still saves and reloads a client
- A form submit on a **deployed** `pages.dev` site still lands in `leads`

If projects vanish from the dashboard, the likely cause is existing rows with a
null or mismatched `owner_id` — backfill them rather than loosening the policy.

---

## Definition of done

- [ ] Audit findings posted on the board
- [ ] `supabase/migrations/<timestamp>_enable_rls.sql` committed
- [ ] `owner_id` added to `client_intakes` + `ClientIntakeView.tsx` writes it
- [ ] Step 4 curl output pasted on the board, all reads empty/denied, lead insert working
- [ ] Step 5 app regression check passes
- [ ] `AGENTS.md` "Project facts" documents the schema + RLS policy for all four tables (only `leads` is documented today)
- [ ] `decisions/log.md` entry recording what the policies are and why
- [ ] `npm run verify` green, `.agent-lock` cleared

## Do not

- Do not use the service-role key in any client-side or `VITE_`-prefixed variable.
  It bypasses RLS entirely. It belongs server-side only, if at all.
- Do not "fix" a broken read by loosening a policy to `USING (true)`.
- Do not weaken `requireAdmin` in `lib/auth.ts` — that gate and RLS are two
  independent layers and both need to hold.
