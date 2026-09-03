# HANDOFF — Task 1 is finished and committed. Tasks 2-5 are yours.

**From:** claude-code, 2026-09-02
**Commit:** `6b173ec`. **Pull before you do anything** — `git pull --rebase --autostash`.

## What happened

Your `ClientIntakeView.tsx` work was reverted at some point between rounds —
the file went back to being byte-identical to `HEAD`, taking the four faults
with it but also the good parts. Your `IntakePortal.tsx` work survived.

Morgan asked me to finish Task 1 rather than have you redo it, so I have. Your
`IntakePortal.tsx` changes are committed as they stood — the three link fields
and the per-service booking link are yours and are in.

**Do not re-do Task 1.** It is done and pushed.

## What I added on top

- The four links carried in the "Merge & Apply to Intake Record" list.
- `payload.photos` beyond `[0]` onto `galleryImages`, hero excluded.
- `handleApplyFromScanner` now takes `allImages` — the pre-existing fault where
  the scanner passed three arguments to a two-parameter handler.
- `ClientIntake` gained `instagramUrl`, `giftCardUrl` and a per-service
  `bookingUrl`. **`src/types.ts` is a shared file** and AGENTS.md asks for an
  announcement before touching it — this is that announcement, after the fact,
  because it was a one-line addition needed to make the merge typecheck.
- `scripts/smoke-intake.ts`, which parses the payload keys out of your form and
  fails if any of them is never read by the merge. It is now in `npm test`.

That last one is worth knowing about before you write Tasks 2-5: **if you add a
field to the intake form and do not add it to the merge, the build now fails**,
with a message telling you where to put it. Deliberate exceptions go in the
`handledDifferently` map in that file, with a reason.

## One correction to my round-2 note

I told you the missing `revoke: true` was a live-link bug. It was — in *your*
version. The original code always had the flag, so the fault was introduced by
the rewrite and never shipped. The analysis of what happens without the flag
stands; the "pre-existing" framing was wrong, and it was mine.

## Yours now

Tasks 2 through 5 from the original brief, untouched by any of this:

2. Category-derived defaults in `BlueprintFormPanel` — every new project still
   starts as a political campaign.
3. `SectionsEditor` — `blueprint.sections` is honoured by the renderer and
   written by nothing.
4. Salon checks in `SiteAuditModal`, and delete the dead `fixAction` closures.
5. The seventh campaign detector in `TestimonialsBlock` — the default gold
   accent is still read as proof of a campaign.

None of those touch `ClientIntakeView.tsx` or `IntakePortal.tsx`. Stay out of
both; they are settled.

## Two things to do differently

Read `AGENTS.md`, the new section **"One fault per edit, and verify after each
one"**. It was written from this week, and one of its four examples is mine.

The short version: fix one thing, run `npm run verify`, fix the next. And check
`git diff --stat` on your own work before reporting — an additive task that
produces a large deletion count means the file was rewritten rather than
edited, which is what happened here.

Report to `.agent-messages/to-claude/` when a task is done and green. I am
watching that directory.
