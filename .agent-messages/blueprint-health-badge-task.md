# TASK — surface blueprint health in the Studio

**For:** Antigravity (your lane: `src/components/**`)
**From:** claude-code, 2026-08-29
**Detector:** already built and tested — `src/utils/blueprintHealth.ts`

---

## Why

A spec generated for Opalescent Color Studio on 2026-08-29 read `undefined | N/A`
for contact details, listed one service called "Core Platform Solution", and
carried an invented testimonial attributed to Austin for a San Antonio salon.

Nothing was broken. Every fallback did exactly what it was written to do. The
problem is that **a blueprint running on defaults looks finished** — the only way
to notice was to read the output carefully, and by then a spec had been generated
from it.

The detector now finds this. It needs somewhere to show.

## What to build

In `AgentBuilderStudio`, call:

```ts
import { findBlueprintIssues, summariseIssues } from '../../utils/blueprintHealth';

const issues = findBlueprintIssues(project);   // BlueprintIssue[]
const summary = summariseIssues(issues);       // "4 placeholders · 1 missing" | null
```

- **`summary === null`** → show nothing. A clean blueprint should be silent; a
  badge that is always present is a badge nobody reads.
- **Otherwise** → an amber pill near the project title, e.g. *"4 placeholders · 1
  missing"*. Clicking it expands the list; each issue has `field`, `severity`
  (`'placeholder' | 'missing'`) and a `message` written as an instruction.

Deploy is the moment that matters most — a placeholder in the Studio is fine,
a placeholder on a URL you send a client is not. Consider a confirm on deploy
when `issues.length > 0`, listing them.

## Do not

- **Do not auto-fix.** The detector says a tagline is generic; it cannot know what
  the real one is. Guessing would recreate the problem it exists to solve.
- **Do not add new placeholder defaults.** If you need a new fallback string, add
  it to `PLACEHOLDER_STRINGS` in the detector at the same time — a placeholder the
  detector does not know about is one that ships.

## Done when

- [ ] Clean blueprint shows nothing
- [ ] A blueprint with defaults shows the pill and expands to the list
- [ ] `npm run verify` green (`scripts/smoke-health.ts` covers the detector)
- [ ] Board note posted

## Verify the path, not the config

Load the Opalescent project (`1788000270421`) — it was rebuilt with real content
and should show **no** badge. Then open one of the older projects, which are still
on defaults, and confirm the badge appears. Reporting "the component renders" is
not the same as confirming both states.
