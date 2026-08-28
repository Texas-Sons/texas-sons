# AGENTS.md — Texas Sons Builder

Project instructions for ALL AI agents working in this repository (opencode, Google Antigravity, etc.).

## Coordination protocol (read this first)

Multiple agents may work here. Follow these rules so we never clobber each other.

1. **Lock before editing.** Read `.agent-lock`:
   - empty → write your agent name, then start.
   - your name → you hold the lock; proceed.
   - someone else's name → STOP. Do not edit. Ask the user for a handoff.
   Clear the file when you finish.
2. **Post on the board.** When starting and finishing a task, leave a note in `.agent-messages/` (see `.agent-messages/README.md`).
3. **Pull before you edit, push after.** Always `git pull` at the start of a session so you're working on the latest `main`.
4. **Verify before you ship.** Run `npm run verify` (lint → test → build) before committing. Never commit or push a red build. CI enforces this on GitHub.
5. **Never rewrite another agent's committed work** without the user's explicit approval.
6. **Small conventional commits** pushed to `main` (`fix:`, `feat:`, `chore:`, `style:`, `docs:`).

## Ownership lanes

- **opencode**: client-site block system (`src/templates/blocks/`), deploy pipeline (`server.ts`, deploy scripts), verification infra (`npm run verify`, CI), SEO/perf work.
- **Antigravity**: AI Studio UI (`src/components/AgentBuilder/`), photo scanner, voting/campaign features, admin UX.
- **Either**: anything the user explicitly assigns.

Cross-lane edits are allowed but must be announced on the board first.

## Project facts

- Node/Express + Vite 6 + React 19 + Tailwind v4 + TypeScript (ESM). Admin entry `index.html`, deployed client-site entry `client.html`.
- Scripts: `npm run dev` (tsx server.ts), `npm run build`, `npm run start` (prod, serves `dist/`), `npm run lint` (tsc --noEmit), `npm test` (SSR smoke test of ClientApp), `npm run verify` (lint+test+build).
- `dist/` is gitignored but required by `npm start`; rebuild with `npm run build`.
- Secrets live in `.env.local` (gitignored). See `.env.example` for the full list and what each one powers. Env vars: GEMINI_API_KEY, APP_URL, ADMIN_EMAILS, VITE_GOOGLE_MAPS_PLATFORM_KEY, STRIPE_SECRET_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, GITHUB_ACCESS_TOKEN.

## API auth contract (do not regress this)

- **Every `/api` route requires a valid Supabase session** whose email is on the `ADMIN_EMAILS` allowlist. Enforced by `requireAdmin` in `lib/auth.ts`, mounted in `server.ts` before any route is defined.
- **Two public exceptions**, both deliberate: `/api/health` (liveness) and `/api/lead` (form posts from deployed client sites, which have no session). Adding a third requires a decision log entry.
- **Frontend must call `apiFetch`/`apiJson` from `src/api.ts`**, never bare `fetch`, for admin routes — the helper attaches the Bearer token and signs out on 401. `ClientApp.tsx` uses bare `fetch` for `/api/lead` on purpose.
- The email allowlist in `src/App.tsx` / Settings is **cosmetic only** (localStorage, user-editable). It is not a security boundary.
- **Never fetch a user-supplied URL with bare `fetch`.** Use `safeFetchText` from `lib/safeFetch.ts`, which blocks private/reserved addresses (incl. cloud metadata) on every redirect hop and caps time + response size. `scripts/smoke-security.ts` enforces this in CI.
- **Supabase Schema & RLS Policies**:
  - `projects`, `invoices`, `client_intakes`: RLS enabled. Policies restrict ALL operations (SELECT, INSERT, UPDATE, DELETE) to `authenticated` users where `auth.uid() = owner_id`. `anon` access is fully denied.
  - `leads`: RLS enabled. `anon` can ONLY `INSERT` (needed for `/api/lead` client-site form submissions). `authenticated` can `SELECT`.
- Client sites render via `window.__TXSONS_BLUEPRINT__` injected by `/api/deploy`; design tokens are CSS vars `--ts-*` applied on the `data-ts-site` root by `ClientApp`.

## Data access contract (do not regress this)

- **All business data goes through `src/store/`.** Components must not call
  `supabase.from(...)` directly and must not read/write business data in
  `localStorage`. Import a repo: `listBlueprints`, `saveIntake`, `saveProject`, etc.
- **Supabase is the source of truth; `localStorage` is a write-through cache.**
  Repos serve cached data when a read fails — RLS failures and dropped connections
  both look like empty result sets, and silently rendering "you have no clients" is
  worse than rendering slightly stale ones.
- **`localStorage` is still correct for UI preference**: current view, form prefill,
  last search terms, selected model. Those are per-browser by design. The rule is
  about business data only.
- **Never swallow a write failure.** A failed read can fall back to cache; a failed
  write is data loss and must surface to the user. Several `catch {}` blocks used to
  hide exactly this.
- Studio state (`saveCurrentProject` / `saveHistory`) is debounced 1.5s. Do not
  replace it with a direct write — it fires on every keystroke and colour drag.
- Schema lives in `supabase/migrations/`. Dashboard-only changes get lost; commit
  the SQL.

## Gotchas

- The dev server WebSocket prints "Port 24678 is already in use" during tests — harmless.
- If you change `server.ts`, the running dev server needs a restart.
- `dist/` is stale until `npm run build`; the production server serves from `dist/`.
