# TASK — read every form and say what is wrong with it

**For:** DeepSeek (IDE extension)
**From:** claude-code, 2026-08-31
**Deliverable:** a findings file. **Change no code.**

This is a reading job. You are new to this repository, so you get breadth rather
than authority: produce a list of candidate problems for a human to judge. Your
output is leads, not fixes.

Antigravity is separately auditing layout and overflow at various screen widths.
**Do not look at layout, spacing, responsiveness or styling** — that is covered,
and duplicate findings cost more to sort than they are worth.

---

## What to read

Every form and every input the operator or a client touches:

```
src/components/ClientIntake/ClientIntakeView.tsx     the dossier form (large)
src/components/IntakePortal/IntakePortal.tsx         what a client fills in once
src/components/ClientPortal/MediaManager.tsx         photo, pair and product entry
src/components/ClientPortal/ClientPortal.tsx
src/components/ClientDashboard/ClientDashboard.tsx   sign-in, salon picker, tabs
src/components/ClientAccess/AccessPanel.tsx          adding people by email
src/components/ServicesEditor.tsx                    services, prices, links
src/components/ClientSettingsModal.tsx
src/components/ProjectProposalModal.tsx              proposals and contracts
src/components/GenerateInvoiceModal.tsx
src/components/SettingsView.tsx
src/components/AgentBuilder/BlueprintFormPanel.tsx
```

## What to look for

**Data loss.** The worst category and the reason this task exists. A form that
discards what someone typed: no unsaved-changes warning before closing, state
reset by a re-render, a failed save that clears the form, a `catch {}` that
swallows an error and lets the user believe it worked. A client uploading a photo
and being told it saved when it did not is the failure this project has already
had.

**Validation that is absent or wrong.** Required fields that are not enforced;
enforcement so strict it rejects real input. Real examples to have in mind: a
phone number with an extension, an apostrophe in a business name, a price
written "Custom" or "Enquire" rather than a number, a service duration written
"1 hr 30 min".

**Dead or misleading controls.** A button whose handler does nothing, a link to
a route that no longer exists, a label describing something other than what the
control does, a disabled state that never becomes enabled.

**Error handling.** Failures shown to the user versus logged and hidden. Does a
failed request leave a spinner running forever? Does the message say what to do
next, or only that something went wrong?

**Labels and accessibility.** Inputs with no associated label, icon-only buttons
with no accessible name, `aria-label` text that differs from a visible label
(that breaks voice control — the accessible name must contain the visible text).

**Copy that will confuse a salon owner.** Some of these forms are used by
clients, not by developers. "Blueprint", "snapshot", "archetype" and "dossier"
are our words. Flag anywhere a client-facing screen uses them.

## What NOT to report

- Layout, spacing, overflow, responsive behaviour — Antigravity has it
- Code style, naming, file organisation, refactoring opportunities
- Anything about `lib/`, `server.ts`, `supabase/` — not this task
- TypeScript typing improvements
- "Consider adding tests"

## The report

Write `.agent-messages/deepseek-forms-findings.md`:

| File:line | Category | What happens | Why it matters |
|---|---|---|---|

One row per finding. Cite `file:line` for every one — a finding I cannot locate
is a finding I cannot act on.

Sort by severity, worst first, and be honest about confidence. Mark anything you
are unsure of as **unverified** rather than dropping it or overstating it. A
maybe I can check in thirty seconds is useful; a confident claim that turns out
to be wrong costs far more than it saved.

## Hard rules

- **Do not edit, create or delete any file** except your findings file
- **Do not run the app, install anything, or touch git** beyond committing that
  one file
- **Do not paste large blocks of code** into the report — cite the line

## One warning

Some code here looks wrong and is deliberate, with the reason written directly
above it. Before reporting something as broken, read the surrounding comment. If
a comment explains the choice and you still disagree, say so and quote it —
that is a fair finding. Reporting it as an oversight when the reasoning is three
lines up is not.
