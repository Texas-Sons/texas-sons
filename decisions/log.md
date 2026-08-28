# Decisions Log

Append-only record of meaningful decisions and why they were made. `/level-up` Phase 2 (Method interview) writes scoped automation specs here. You can also append manually whenever you decide something worth remembering.

**Format per entry:**

```
## YYYY-MM-DD — Short title

**Decision:** what was decided.

**Why:** the reasoning, constraints, and what would change your mind.

**Alternatives considered:** what else was on the table.

**Owner:** who's accountable.
```

Keep it terse. Future-you will thank present-you for capturing the *why*, not just the *what*.

---

## 2026-08-25 — Texas Sons AIOS Day-1 Onboarding

**Decision:** Formally initialized the AIOS architecture for Texas Sons with 3 core 90-day priorities: (1) Deploy first 10 active campaign/commercial portals, (2) Automate client blueprint & Supabase lead capture pipelines, (3) Build 1-click site builder engine.

**Why:** Centralize context, voice registers, and technical connections so autonomous agents and site generation workflows can operate with high fidelity and zero context loss.

**Alternatives considered:** Ad-hoc manual prompts and fragmented task tracking across notes.

**Owner:** Morgan Valdez

---

## 2026-08-25 — 1-Click Custom Domains & Live Deployment Edge Hub

**Decision:** Implemented automated Cloudflare Pages custom domain provisioning with Namecheap DNS copy-paste helpers and live deployment history tracking in Texas Sons Studio.

**Why:** Enables seamless connection of client domains (bought on Namecheap or client-owned) with automated SSL certification and real-time DNS status checks directly from the Studio interface.

**Alternatives considered:** Manual Cloudflare dashboard administration for every client domain attachment.

**Owner:** Morgan Valdez

---

## 2026-08-28 — Server-side auth gate + SSRF hardening on the API

**Decision:** All `/api` routes now require a verified Supabase session on the server (`lib/auth.ts`, `requireAdmin`), with `/api/health` and `/api/lead` as the only deliberate public exceptions. User-supplied URLs are fetched through `lib/safeFetch.ts`, which refuses private/reserved addresses on every redirect hop and caps time and response size. Frontend admin calls go through `apiFetch` in `src/api.ts`.

**Why:** The API was fully unauthenticated. The only access control was an email allowlist in `localStorage`, which is client-side and editable from devtools — anyone who found the deployed URL could deploy sites to the Cloudflare account, generate Stripe invoices, and burn Gemini and Maps quota. Separately, `/api/scrape-site` fetched arbitrary user-supplied URLs server-side, so it could be pointed at cloud metadata (`169.254.169.254`) or internal services. Both are pre-revenue blockers: they must be closed before the API is exposed to real client money or client data.

**What would change my mind:** If the Studio ever needs to serve non-admin users (e.g. clients logging in to manage their own site), `requireAdmin` needs to become role-aware rather than a flat allowlist. That's a schema change, not a patch.

**Alternatives considered:** (a) Network-level restriction such as Cloudflare Access in front of the whole app — fewer code changes, but it doesn't protect local dev, doesn't give per-request identity, and couples auth to a specific deploy topology. (b) A shared static API key — simpler, but no identity, no revocation, and it would end up committed somewhere.

**Verification:** `npm run verify` green. Runtime-confirmed: no token → 401, bogus token → 401 (rejected by Supabase, not just shape-checked), `/api/health` → 200. `scripts/smoke-security.ts` added to `npm test` and CI to prevent regression.

**Owner:** Morgan Valdez
