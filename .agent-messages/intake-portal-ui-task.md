# TASK — Client intake portal UI

**Assigned to:** Antigravity (this is your lane: admin UX + client-facing pages)
**Filed by:** claude-code, 2026-08-28
**Backend status:** done and committed. This task is the UI half only.

---

## What this replaces

`ClientIntakeView.tsx` around line 1313 has a "Share Intake Questionnaire" modal
that generates copy-paste **email and SMS text** asking the client to *reply with*
their logo, top services, and photos. That manual round-trip is the bottleneck
Morgan named in `aios-intake.md` Q7 as the biggest drain on his week.

Replace it with a link the client fills in themselves.

---

## Step 0 — prerequisite (do this first)

Apply `supabase/migrations/20260828040000_intake_portal.sql`. Until it runs, the
portal routes return 404 because `client_intakes.share_token` does not exist.

Verify:

```sql
select column_name from information_schema.columns
where table_schema='public' and table_name='client_intakes'
  and column_name in ('share_token','share_token_revoked');

select count(*) from public.intake_submissions;
```

Post the result on the board before building.

---

## Backend already in place — do not rebuild it

| Route | Auth | Purpose |
|---|---|---|
| `GET /api/intake/:token` | public | returns `{ businessName, contactName, category }` — nothing else |
| `POST /api/intake/:token` | public | body `{ payload: {...} }`, 8MB cap, writes an `intake_submissions` row |
| `POST /api/intake-link` | **admin** | body `{ intakeId }` mints a link, `{ intakeId, revoke: true }` kills it |

Token format is validated server-side, submissions are size-capped, and the
public GET deliberately exposes only business name and contact — never the
dossier, pricing, or notes. Keep it that way.

---

## Part 1 — the public portal page

Route: `/intake/<token>`. The server's catch-all already serves `index.html` for
non-API paths, so no server change is needed.

**Rendering without auth is the tricky part.** `App.tsx` currently renders
`LandingPage` whenever there is no user, so the portal would show a login screen.
Branch *before* the auth check — cleanest is in `src/main.tsx`:

```tsx
const isPortal = window.location.pathname.startsWith('/intake/');
createRoot(...).render(
  <StrictMode>{isPortal ? <IntakePortal /> : <App />}</StrictMode>
);
```

Put the component in `src/components/IntakePortal/`.

Requirements:

- Read the token from the path, `GET /api/intake/:token` to load the business name.
- A dead or revoked link must show a friendly message, not a crash or a login form.
- **Use plain `fetch`, not `apiFetch`.** The client has no session; `apiFetch`
  would sign them out on a 401. `AGENTS.md` documents this exception.
- Collect: logo, hero/feature photos, tagline, description, services (name +
  description + optional price), hours, address, phone, email, social links, and
  a free-text notes field. Mirror the fields the current email asks for.
- **Resize images client-side before upload.** The server caps a submission at
  8MB and will reject more with a 413. Phone photos are 3–8MB each, so raw
  uploads will fail on the second photo. Downscale to ~1600px on the long edge
  and re-encode as JPEG. `src/utils/colorExtractor.ts` shows the existing
  canvas-based image handling.
- Show upload progress and a clear success state. This page is a client's first
  impression of Texas Sons — it should look like the Cyber-Western Studio, not a
  raw form.
- Mobile first. Most clients will open this on a phone from a text message.

## Part 2 — the Studio side

In `ClientIntakeView.tsx`, rework the existing share modal:

- **Generate link** button → `POST /api/intake-link` → show the URL with a copy
  button, and a QR code if that's easy.
- Keep the email and SMS templates, but rewrite them to send *the link* instead
  of a list of things to reply with.
- **Revoke** button → `POST /api/intake-link` with `revoke: true`.
- Show submission count and latest submission time per client.
- A review view: see a submission's fields and photos, and a one-click **apply to
  intake** that merges chosen fields into the `ClientIntake` record.

**Merging is deliberate.** A public form must never silently overwrite a curated
client record — that is why submissions are a separate table. Morgan chooses what
lands.

---

## Constraints — do not regress these

Both are documented in `AGENTS.md` with the reasoning:

1. **All business data goes through `src/store/`.** No `supabase.from(...)` in a
   component, no business data in `localStorage`. Add a repo (e.g.
   `src/store/submissions.ts`) rather than querying inline.
2. **Admin API calls use `apiFetch`/`apiJson` from `src/api.ts`.** The public
   portal page is the exception — plain `fetch`, no session.
3. **Never swallow a write failure.** A failed read may fall back to cache; a
   failed write is data loss and must surface. Several `catch {}` blocks were
   hiding exactly this and were removed on 2026-08-28.

---

## Definition of done

- [ ] Migration applied, verification output posted on the board
- [ ] `/intake/<token>` renders for a signed-out visitor in a clean browser profile
- [ ] A revoked or bogus token shows a friendly message
- [ ] A real submission with 3+ phone photos succeeds (proves client-side resizing works)
- [ ] Submission appears in the Studio and can be applied to the intake
- [ ] Generate / copy / revoke all work
- [ ] `npm run verify` green, `.agent-lock` cleared, decision logged

## Known gaps — leave them, do not half-fix

- **No rate limiting** on `/api/intake/:token` or `/api/lead`. A known token can
  be submitted to repeatedly. Worth doing, but as its own task with a real
  approach (not an in-memory counter that resets on every deploy).
- **No lead or submission alerting.** Nothing tells Morgan when something lands.
  That is the next task after this one.

## Please actually test the path, not the configuration

The RLS work on 2026-08-28 was reported green while `/api/lead` returned HTTP 500
on every single submission from every live client site. The audit confirmed a
policy existed without ever exercising the insert path. For this task that means:
submit the real form in a real browser as a signed-out user. "The component
renders" is not the same as "a client can submit photos."
