# TASK — responsive audit: find what gets cut off

**For:** Antigravity
**From:** claude-code, 2026-08-31
**Deliverable:** a findings file. **Fix nothing.**

Morgan is zooming out to use his own app. The Deploy button in the 1-Click
Studio is cut off, and he reports the same on other pages. That is not one bug,
it is a pattern repeated across files, and until we can see how many there are
we do not know whether the fix is four edits or forty.

You get this job because you already built a Puppeteer/CDP device-emulation
harness for the comparison slider, and it was genuinely rigorous. This is the
same tool pointed at a bigger surface.

---

## Why this needs you rather than a test

Nothing in this repo can see a layout that overflows. Nine smoke suites, ESLint,
`tsc`, a production build — all green while a primary action sits off-screen.
Every gate here tests behaviour or types. None of them has a viewport.

So the deliverable is **screenshots with measurements**, not an assurance.

---

## Part 0 — the thing that will block you first

The admin app is behind Google OAuth and Puppeteer cannot complete that flow
headlessly. Do not spend hours on it and do not ask Morgan for credentials.

Launch Chrome with a persistent profile:

```js
puppeteer.launch({ headless: false, userDataDir: './.audit-profile' })
```

Sign in **once**, by hand, in that window. Every later run reuses the session.
Add `.audit-profile/` to `.gitignore` in the same commit — a browser profile
directory contains session tokens and must never be committed.

If that still fights you, audit the four surfaces that need no session
(`/intake/<token>`, `/portal/<token>`, `/dashboard` signed out, and a deployed
client site) and say plainly in your report that the admin app was not covered.
A partial audit that says so is worth far more than a complete-sounding one that
guessed.

---

## Part 1 — what to visit

Run `npm run dev` and drive `http://localhost:3000`.

**Admin app** — each sidebar view: Dashboard, 1-Click Studio, Insights, Clients,
Lead Finder, Billing & Invoices, Settings.

**Modals**, which is where I expect most of this to live. They are the hardest
thing to see because they need opening:

- Client settings (project card → **Client**) — long, several sections
- Proposal & contracts (project card → the document icon) — three tabs
- Site audit, Photo scanner, Custom domain, Deployment history (all in the Studio)
- Generate invoice
- The intake dossier form (Clients → Add Client → Enter their details)

**Token surfaces:** `/intake/<token>`, `/portal/<token>`, `/dashboard`.
Ask Morgan for a live portal token, or mint one from the Clients tab.

**A deployed client site** — Opalescent, at her `pages.dev` URL.

## Part 2 — widths

`375×667` (iPhone SE — the narrowest phone that still matters), `390×844`
(iPhone 14), `768×1024` (iPad portrait), `1280×800`, `1440×900`.

Use real device emulation with touch for the two phone sizes, not just a resized
window. `hasTouch` and `isMobile` change how things lay out and which media
queries apply.

## Part 3 — what counts as a finding

**1. The page scrolls sideways.**

```js
document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
```

Report the widest element. Usually one child, not the page:

```js
[...document.querySelectorAll('*')]
  .filter(el => el.getBoundingClientRect().right > window.innerWidth + 1)
  .map(el => ({ tag: el.tagName, cls: el.className, right: Math.round(el.getBoundingClientRect().right) }))
```

**2. A control is unreachable.** The one that matters most. For every `button`,
`a`, `input`, `select` and `textarea`: is any part outside the viewport, or
clipped by an ancestor with `overflow: hidden`? A control clipped by a scrollable
ancestor is fine — the user can scroll to it. A control clipped by
`overflow-hidden` is *gone*, and that is the Deploy button symptom.

Walk up the ancestors and check `getComputedStyle(el).overflow` before calling it.

**3. A modal is taller than the screen with nothing to scroll.** Common shape:
`max-w-*` with no `max-h` and no `overflow-y-auto`. The bottom — where Save and
Deploy live — is simply unreachable.

**4. Text overlapping or truncated** to the point of being unreadable.

**5. Tap targets under 32px** on the two phone widths. Note them; they are lower
priority than anything above.

## Part 4 — the report

Write `.agent-messages/antigravity-responsive-findings.md`:

| Page / modal | Width | Kind | Element | What is wrong |
|---|---|---|---|---|

Save screenshots to `./.audit-shots/` — **gitignored, not committed**. Reference
them by filename. A repo does not want a hundred PNGs.

Then, and this is the part I actually need: **group the findings by cause.** If
eleven modals overflow because they share one wrapper class, that is one finding
with eleven instances, not eleven findings. Whether this is four fixes or forty
is the decision the report has to inform.

---

## Do not

- **Do not fix anything.** Findings only. I am fixing these in one pass so the
  patterns come out consistent, and a half-fixed layout is harder to audit than
  a broken one.
- **Do not commit screenshots or `.audit-profile/`.**
- **Do not change component code**, including "while I was in there" tidying.
- **Do not report a page as clean that you did not load.** Say which you skipped.

## Report what you verified

Say which surfaces you actually loaded, at which widths, and which you could not
reach. Four bugs this month shipped green because nothing exercised the real
path — including a booking button tested thoroughly on a deployed site and never
once in the Studio, where it turned out to cover the editor's own chrome.

If the admin app defeated the sign-in, say so at the top. That is a useful
finding by itself.

## Repo rules

- Stage explicit paths — never `git add -A`
- One conventional commit for the findings file plus the two `.gitignore` lines
- Pull with `--rebase --autostash`; leave the tree clean
