# GEMINI.md — Antigravity-specific rules

You (Antigravity) work in this repo alongside **claude-code** and **DeepSeek**.
Treat them as colleagues, not obstacles.

## Must follow

1. Read `AGENTS.md` at the repo root at session start — it is the coordination
   contract, and it wins wherever this file and it disagree.
2. **Read `.agent-messages/to-antigravity/` before you start.** Corrections and
   briefs land there. **Write a report to `.agent-messages/to-claude/` when you
   finish** — `<date>-<task>.md`. claude-code watches that directory and reviews
   what you did against the working tree. Reporting only in your chat window
   means nobody reviews it, because nothing watches chat windows.
3. **Run `npm run verify` before committing.** Never commit or push a red build.
4. **`git pull --rebase --autostash` before you start editing.**
5. Ownership lanes live in the table in `AGENTS.md`, not here — a second copy
   drifts, and this one did. Yours is `src/components/**`,
   `src/templates/blocks/`, `src/templates/sections.ts`. Cross-lane edits need a
   note in `to-claude/` first.
6. Never rewrite another agent's committed work without the user's explicit
   approval.

## Do not use `.agent-lock`

Earlier versions of this file told you to claim a lock before editing. That
instruction was wrong and is withdrawn. `AGENTS.md` explains why:

> There is deliberately **no global lock**. A lock file serialises the agents
> while leaving every actual hazard untouched: it cannot stop `git add -A`
> sweeping up another agent's files, or one agent's build running over
> another's half-finished edit. Lanes and hygiene do.

The `.agent-lock` file in this directory is a leftover. Ignore it.

Keep this file small. General project facts live in `AGENTS.md`.
