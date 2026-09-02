# TASK — five fixes so the next client site builds faster

**For:** DeepSeek (IDE extension)
**From:** claude-code, 2026-09-02
**Base commit:** `b4afe08`. **Pull first** — `git pull --rebase --autostash`. Two
commits landed today that you build on top of.

You are new to this repository, so read `AGENTS.md` before you touch anything.
The parts that will bite you are the lanes table, the hard rules about staging
explicit paths, and the section titled *Name every consumer of every file you
touch*.

---

## Your lane

You own these files for this task. Nothing else.

```
src/components/IntakePortal/IntakePortal.tsx
src/components/ClientIntake/ClientIntakeView.tsx
src/components/AgentBuilder/BlueprintFormPanel.tsx
src/components/AgentBuilder/SiteAuditModal.tsx
src/components/SectionsEditor.tsx          (new — yours to create)
src/templates/blocks/TestimonialsBlock.tsx
src/templates/SiteRenderer.tsx             (task 5 only, one prop)
```

**claude-code is concurrently editing** `server.ts`, `lib/`, `scripts/`,
`supabase/migrations/`, and the git index. Do not touch those. If a task looks
like it needs a server change, stop and write what you need into
`.agent-messages/deepseek-blocked.md` instead of editing.

Run `npm run verify` before you commit. It must be green — lint, twelve smoke
suites, build. Never push red.

---

## Task 1 — the intake asks for things the site cannot render

`IntakePortal.tsx` collects social media as one free-text box labelled
*"Facebook, Instagram, etc."*. It is written to the payload and read by
**nothing** — grep `socialLinks` and you get three hits, all inside the form
itself. That is why the operator has been pasting Instagram URLs by hand.

`BusinessProfile` in `src/templates/blocks/types.ts` already renders four things
the intake never asks for properly: `instagramUrl`, `giftCardUrl`, `bookingUrl`,
and per-service booking links.

**Do:**

1. Replace the single `socialLinks` text field with real ones: Instagram URL,
   gift card URL, booking URL. Keep them optional and validate loosely — a
   client will paste a full URL or a bare handle, and rejecting either is worse
   than storing what they typed.
2. Add a per-service booking link field to the services rows already in that
   form.

**The part that is easy to miss.** The route that receives this
(`POST /api/intake/:token`) stores the payload as an opaque jsonb blob, so no
server change is needed — but the payload does not reach the client dossier by
itself either. It is applied by the **"Merge & Apply to Intake Record"** button
in `ClientIntakeView.tsx` around line 1658, which is a **hand-written field
list**:

```js
tagline: reviewSubmission.payload.tagline || shareModalClient.tagline,
description: ..., hours: ..., email: ..., phone: ..., address: ...,
```

Anything you add to the form and not to that list is collected forever and
never used, which is exactly the bug you are fixing. **Add every new field
there too.**

While you are in that merge: it currently does `heroImage = payload.photos[0]`
and drops every other photo the client uploaded. Carry the rest onto
`galleryImages`.

---

## Task 2 — every new project starts as a political campaign

`BlueprintFormPanel.tsx`, `DEFAULT_FORM` (~line 157) and `snapshotToForm`
(~line 197) start every project on:

```
theme: 'campaign-navy'
selectedArchetype: 'civic'
selectedFeature: 'voting-guide'
category: snap.profile.category || 'Campaign & Leadership'
```

Four things to undo before building a salon.

**Do:** derive the defaults from the category, which the intake already
captures and which `defaultArchetype` in `src/templates/sections.ts` already
uses to pick a layout. "Beauty & Wellness" should land on a beauty theme and
feature, not a campaign one. Keep the campaign defaults for the campaign
category.

**Do not** change the *structural* fallbacks when category is genuinely unknown
— a blank new blueprint with no category set must keep behaving as it does now,
because `lib/siteKind.ts` treats an absent category as "look at the theme" and
live campaign sites depend on that.

---

## Task 3 — sections cannot be turned off

`blueprint.sections` exists, and `resolveSections` in
`src/templates/sections.ts` honours it. **Nothing writes it.** So the beauty
archetype always ships "Shop the Studio" and "The Transformation", whether or
not the client has products or before-afters.

**Do:** build `src/components/SectionsEditor.tsx` and mount it on a tab in
`BlueprintFormPanel`. It should list the resolved sections in order, allow
reorder and allow toggling one off, and write the result to
`snapshot.sections`.

Model the drag interaction on `src/components/GalleryEditor.tsx`, which already
solves this exact problem — pointer events, `setPointerCapture`,
`touch-action: none`, and a FLIP slide in `useLayoutEffect`. Reuse its approach
rather than inventing a second one, and do not reach for a drag-and-drop
library.

When `sections` is absent the site must still fall back to its archetype. Do
not write a sections array into every blueprint just because the editor was
opened — every site deployed to date has no `sections` key and must keep
rendering identically.

---

## Task 4 — the pre-flight audit only knows how to check campaigns

`SiteAuditModal.tsx` checks treasurer disclosure, voting-information sections,
"policy pillars" and a candidate portrait. For a salon it verifies almost
nothing that matters. Everything wrong with the Opalescent site this month was
found by opening the live site and looking at it.

**Do:** add a non-campaign checklist, gated on `isCampaignSite(project)` from
`lib/siteKind.ts` (already imported in that file — claude-code wired it today).

Worth checking for a service business:

- a booking URL is set, and the primary CTA actually points at it
- every service has a price, or the menu deliberately has none — mixed is the
  tell that one was missed
- opening hours exist
- at least one real photograph, not a stock placeholder
  (`isPlaceholderImage` in `lib/clientMedia.ts` already identifies these)
- a logo is set
- contact phone and address are present
- no section renders empty

**While you are in this file:** delete the dead `fixAction` closures. Auto-fix
was disabled at line 410 and they are unreachable, but they still contain a real
candidate's actual campaign pillars as hardcoded "suggestions", which is the
last of a family of fabricated defaults that has been swept out of this
repository six times.

---

## Task 5 — the seventh campaign detector

There were six definitions of "is this a campaign". `lib/siteKind.ts` is now
the only one — except `TestimonialsBlock.tsx` has a seventh:

```js
const isCampaign = (theme === 'campaign-navy' || theme === 'campaign-judicial')
  || accentColor === '#C5A059'
  || title.toLowerCase().includes('endorse')
  || title.toLowerCase().includes('judicial');
```

`#C5A059` is Texas Sons' own default gold. So **any** client left on the default
accent gets campaign-styled testimonials, complete with "Judicial Bench
Endorsement" and "Law Enforcement Coalition" badges asserted over their real
customers' reviews.

**Do:** pass an explicit `isCampaign` prop from `SiteRenderer.tsx`, which knows
the category, and delete the sniffing. Note that `SiteRenderer` has **two**
consumers — `ClientApp` (deployed sites) and `AgentBuilderStudio` (the preview)
— and one test will not cover both. Check the block renders correctly in the
Studio preview *and* on a deployed site.

---

## Reporting

Write findings and anything you could not do to
`.agent-messages/deepseek-2026-09-02-findings.md`.

Report only what you verified. Three reports on 2026-08-28 described work that
did not match the tree. Before you say a task is done, re-read the file you
claim to have changed and exercise the path rather than the configuration.

Commit each task separately, conventional messages, explicit paths — never
`git add -A`. There are untracked scratch files in this working directory and a
private Obsidian vault nested inside it.
