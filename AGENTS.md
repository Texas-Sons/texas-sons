# AGENTS.md — Texas Sons Builder

Project instructions for ALL AI agents working in this repository (opencode, Google Antigravity, etc.).

## Coordination protocol (read this first)

Several agents work in this repo, in **one shared working directory** — one
filesystem, one git index, one `dist/`, one port 3000. That sharing, not "whose
turn is it", is where the real collisions come from.

There is deliberately **no global lock**. A lock file serialises the agents while
leaving every actual hazard untouched: it cannot stop `git add -A` sweeping up
another agent's files, or one agent's build running over another's half-finished
edit. Lanes and hygiene do.

### Lanes — edit these freely, in parallel

| Agent | Owns |
|---|---|
| **claude-code** | `server.ts`, `lib/`, `src/store/`, `scripts/`, `supabase/`, CI |
| **Antigravity** | `src/components/**`, `src/templates/blocks/`, `src/templates/sections.ts` |
| **opencode** | `public/templates/`, deploy pipeline, SEO/perf |
| **DeepSeek** | `src/components/IntakePortal/`, `src/components/ClientIntake/`, audit + form panels when assigned |

**Announce on the board before touching** — these are shared and a silent edit
here is how two agents disagree about a type: `src/types.ts`, `package.json`,
`AGENTS.md`, `.env.example`, `src/App.tsx`.

Anything the user explicitly assigns overrides the table.

### The mailbox — read before you start, write when you finish

```
.agent-messages/to-<you>/      corrections and briefs addressed to you
.agent-messages/to-<them>/     what you send back
```

**Before starting a task, read your inbox.** Corrections land there and are
usually the reason the last task is not actually finished.

**When you finish a task, write a report to the other agent'''s directory** —
`<date>-<task>.md`. Reporting only in your chat window means nobody reviews it,
because nothing watches chat windows. claude-code runs a file watcher on
`to-claude/` and wakes when a file appears there.

Reports are checked against the working tree, not taken at face value. See
*Report only what you verified* below — there are four reports on record that
described work the tree did not contain.

Full protocol: `.agent-messages/README.md`.

### Hard rules

1. **Stage explicit paths. Never `git add -A` or `git add .`.**
   The directory contains other agents' scratch files and half-finished work.
   `git add -A` swept ten stray debug scripts into a commit on 2026-08-28.
   Write `git add server.ts lib/ scripts/foo.ts` — name what you changed.
2. **Leave the working tree clean.** Commit or stash before you stop. Uncommitted
   changes broke `git pull --rebase` for another agent twice on 2026-08-28.
3. **Pull with `git pull --rebase --autostash`.** Survives a dirty tree instead of
   aborting.
4. **One agent runs builds at a time.** `npm run verify`, `npm run build` and
   `npm run dev` all write `dist/` or bind port 3000. Say on the board when you
   start a long build; check the board before you start one.
5. **Verify before you commit.** `npm run verify` (lint → test → build) must be
   green. Never push red. CI enforces it.
6. **Never rewrite another agent's committed work** without the user's approval.
7. **Small conventional commits** pushed to `main` (`fix:`, `feat:`, `chore:`,
   `style:`, `docs:`).

### One fault per edit, and verify after each one

Fix one thing, run `npm run verify`, fix the next. Do not batch four fixes into
one pass and verify at the end.

The reason is not tidiness. When you change four things and the build breaks,
you cannot tell which change broke it, and the usual response is to keep going
— which is how a red build survives several rounds of "progress".

**An additive change must produce an additive diff.** If you were asked to add
three fields and the diff deletes six hundred lines, you rewrote the file
instead of editing it, and the deletions are things nobody asked you to remove.
Check `git diff --stat` on your own work before you report. A deletion count
far larger than the task is the signal.

**Re-read the lines either side of every edit.** Edits that extend a block are
the dangerous ones: the replacement lands slightly wide and silently eats what
followed.

Four examples, all real, all from agents working carefully:

- 2026-09-02: extending a `lucide-react` import to add two icons deleted the
  three `import` lines beneath it. Build went from 4 errors to 22, and the next
  two progress reports were written against a tree that did not compile.
- 2026-09-02: a rewrite of `ClientIntakeView.tsx` to add three fields to one
  merge produced 378 insertions and 636 deletions, renamed a database column in
  the UI only, and moved two admin routes under a public prefix.
- 2026-09-02: `git rm --cached` staged eleven removals, then `git commit` with
  explicit paths committed the whole index anyway — `git commit` takes the
  index, not your argument list. The message described half of what shipped.
- 2026-08-30: a fix verified with a rigorous Puppeteer harness still shipped two
  bugs, because the harness tested the feature that was built rather than the
  file that was changed.

The last one is the general case, and it has its own section below.

### Report only what you verified

Say what you actually checked, and how. Three reports on 2026-08-28 described
work that did not match the tree — an RLS audit that confirmed a policy existed
while the code path returned HTTP 500 on every request, and an import reported as
including a file that was never written. Before reporting done: re-read the files
you claim to have created, and exercise the path rather than the configuration.

### Name every consumer of every file you touch

Before you report done, list who else renders or imports what you changed, and
check each one. Not the feature you built — the *file* you edited.

The booking FAB on 2026-08-30 was tested with a genuinely rigorous Puppeteer
harness on emulated iPhone touch, and still shipped two bugs, because the harness
tested what was built (a button on a deployed site) rather than what was changed
(`SiteRenderer`, which the Studio renders too). `position: fixed` escaped the
Studio's preview panel and floated over the editor's own chrome, where clicking
it opened the client's live booking page.

`SiteRenderer` and the blocks under `src/templates/` have **two** consumers —
`ClientApp` (deployed sites) and `AgentBuilderStudio` (the preview). They are
never both covered by one test. The same applies to any modal in
`src/components/`: some are mounted conditionally by their parent and some are
mounted unconditionally with an `isOpen` prop, and those two behave differently
enough that a component can be correct from one caller and broken from the other.

## Project facts

- Node/Express + Vite 6 + React 19 + Tailwind v4 + TypeScript (ESM). Admin entry `index.html`, deployed client-site entry `client.html`.
- Scripts: `npm run dev` (tsx server.ts), `npm run build`, `npm run start` (prod, serves `dist/`), `npm run lint` (`tsc --noEmit && eslint .`), `npm test` (six smoke suites), `npm run verify` (lint+test+build).
- **`react-hooks/rules-of-hooks` is an error and blocks the build.** A hook below
  an early return is type-correct, so the typecheck never saw it and the fault
  shipped four times — twice into modals mounted unconditionally by the Studio,
  where it throws on open. Do not disable the rule to get a commit through; move
  the early return below the hooks. Config and history: `eslint.config.js`.
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

## Server-side Supabase clients

- `getSupabase()` uses the **anon key** and is subject to RLS, exactly like a browser.
- `getSupabaseAdmin()` uses `SUPABASE_SERVICE_ROLE_KEY` and **bypasses RLS**. Use it
  for trusted server paths that have no user session — `/api/lead` (form posts from
  deployed client sites) and the client intake portal.
- Why: the server was writing with the anon key, so server-side writes were hostage
  to whatever policy the table happened to have. That is how lead capture broke
  silently. Granting `anon` write policies instead would hand the same access to
  anyone who reads the key out of the browser bundle.
- **The service-role key must never carry a `VITE_` prefix** — Vite inlines `VITE_*`
  into the client bundle. `scripts/smoke-security.ts` fails the build if a
  service-role env var is VITE_-prefixed, or if the key value appears in `dist/`.

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
