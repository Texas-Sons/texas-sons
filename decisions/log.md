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

---

## 2026-08-28 — Texas Sons OS: kernel + shells architecture

**Decision:** The OS is not the React app and not Claude Code — it is a kernel (Supabase + the gated `/api`) with multiple shells on top. The Studio is shell #1. Claude Code skills become shell #2 later, calling the same API rather than reimplementing logic. Phone and any future client portal are further shells.

**Why:** The question was framed as "is the React app the OS, or is Claude Code the OS." Both are wrong. Claude Code-as-OS makes the business a personal power-tool that only works at one desk, cannot be delegated, and cannot be sold. App-as-OS means every capability is hand-built UI. Kernel + shells is the same work sequenced so it compounds: build a capability once in the API, expose it in whichever shell needs it.

**The blocker this exposed:** business data lived in the operator's browser `localStorage`, which meant no other shell could ever exist — not a phone, not an agent, not a cron job. The migration was therefore a prerequisite, not a parallel nice-to-have.

**Phasing:** 0) RLS hardening (blocker, delegated to Antigravity). 1) Kernel — all business state into Supabase behind `src/store/`. 2) Automation — lead alerts, client asset-submission portal, deploy health checks, follow-up nudges. This is what makes it *feel* like an OS, and it targets the manual asset-gathering bottleneck named in `aios-intake.md` Q7. 3) Second shell — `CLAUDE.md` + `.claude/skills/` calling the API, with the existing `context/`, `references/`, and `voice.md` as its context layer.

**Phase 2 before Phase 3 is deliberate:** automation is what creates the OS feel; a second shell is leverage for building more. They are independent once Phase 1 lands.

**Alternatives considered:** (a) Claude Code as the operating layer — rejected, see above. (b) App-as-OS with markdown as pure docs — viable but every capability stays hand-built UI and agents can never drive it.

**What would change my mind:** If the Studio ever needs to serve clients directly (not just Morgan), the flat owner-scoped model becomes a role model, and that is a schema change rather than a patch.

**Owner:** Morgan Valdez

---

## 2026-08-28 — Phase 1: repository layer, Supabase as source of truth

**Decision:** Added `src/store/` — one repo per entity — and moved all 8 business-data `localStorage` keys behind it. Supabase is authoritative; `localStorage` is demoted to a write-through cache. UI preferences (current view, form prefill, last search terms, model selection) stay local by design.

**Why:** 61 `localStorage` call sites across 8 files, with `projects` and `client_intakes` written to *both* Supabase and `localStorage` in parallel and free to diverge. Blueprints — the core artifact of the whole product — existed only in one browser profile.

**Why a repository layer rather than editing components directly:** `AgentBuilderStudio.tsx` is ~2,400 lines and `ClientIntakeView.tsx` ~1,500. Swapping call sites to a repo is mechanical and reviewable; rewriting those components is a week of regression-chasing. It also means a future backing-store change is one file per entity.

**Design notes:** Reads fall back to cache on failure, because RLS failures and dropped connections both surface as empty result sets and a blank "no clients" screen is worse than stale data. Writes never fall back — a swallowed write is data loss, and several `catch {}` blocks were hiding exactly that. Studio state saves are debounced 1.5s; without it, a colour-picker drag fired a write per frame. Backfill never deletes local data, skips entities that already have server rows, and records progress per entity so a partial failure resumes.

**Verification:** `npm run verify` green. Audited: zero `supabase.from(` calls and zero business-data `localStorage` keys outside `src/store/`. Dev server boots, admin page 200s, all modules resolve.

**Still to confirm with real data:** the backfill has not yet run against Morgan's actual browser profile — see the checklist in the handoff.

**Owner:** Morgan Valdez

## 2026-08-28 ?" Row Level Security (RLS) hardening

**Decision:** Enforced strict Row Level Security (RLS) on all core tables (\projects\, \invoices\, \client_intakes\, and \leads\). Removed permissive \USING (true)\ policies. Bound data exclusively to \uth.uid() = owner_id\ for authenticated users, completely cutting off \non\ access to sensitive tables. Allowed \non\ to perform INSERT-only operations on \leads\ to support deployed client sites' forms.

**Why:** The \VITE_SUPABASE_ANON_KEY\ is embedded in the frontend bundle. While API routes were secured by \equireAdmin\, without robust RLS policies, an attacker could directly query Supabase REST endpoints using the anon key to dump all tables (blueprints, leads, invoices). Hardening RLS ensures the database boundary matches the API boundary.

**Alternatives considered:** Modifying \equireAdmin\ to be more granular. However, the true vulnerability was direct database access via the public anon key. RLS is the proper defense against client-side key abuse.

**Owner:** Antigravity
