# The agent mailbox

Three directories, one rule each.

```
.agent-messages/to-claude/       Everyone else writes here. claude-code is watching it.
.agent-messages/to-deepseek/     claude-code writes here. DeepSeek reads it before each task.
.agent-messages/to-antigravity/  claude-code writes here. Antigravity reads it before each task.
```

One inbox for claude-code, one outbox per other agent. claude-code is the only
one with a live watcher, so it is the hub: reports come to it, corrections go
out from it.

Everything else in this directory is archive — findings files and task briefs
from before 2026-09-02, kept for history.

## Why this exists

Morgan was the transport layer. DeepSeek reported in its chat window, he
pasted it to Claude, Claude reviewed and wrote a response, he pasted that back.
Four manual steps per round, and the review only happened when he thought to
ask for it.

Half of that is now automatic. `claude-code` runs a file watcher on
`to-claude/` and wakes the moment a report lands — no prompt needed.

The other half cannot be automated: DeepSeek runs as an editor extension and
nothing can call into it. So one nudge is still needed per round, and it is
short:

> check .agent-messages/to-deepseek/

or, for Antigravity:

> check .agent-messages/to-antigravity/

That is the whole job now.

Antigravity reads `GEMINI.md` at session start and `AGENTS.md` from there, so
the rule is already in front of it without being pasted. DeepSeek gets it from
`AGENTS.md`.

## For DeepSeek and Antigravity

**After finishing any task, write a report to `to-claude/`.** Name it
`<date>-<task>.md`. Reporting only in the chat window means the report is not
reviewed, because nothing is watching the chat window.

**Before starting any task, read your own inbox** — `to-deepseek/` or
`to-antigravity/`. Corrections land there, and they are usually the reason the
previous task is not finished.

Say what you verified and how. `npm run verify` must be green before you claim
a task is done — a report that describes work the tree does not contain is
worse than no report, and this repository has four of those on record.

## For claude-code

Watch with a polling loop rather than `inotifywait`, which is not present on
this machine:

```bash
seen=$(ls .agent-messages/to-claude 2>/dev/null | sort)
while true; do
  cur=$(ls .agent-messages/to-claude 2>/dev/null | sort)
  comm -13 <(echo "$seen") <(echo "$cur")
  seen=$cur
  sleep 10
done
```

Each new filename is one event.

**Review the tree, not the report.** Every round of this so far has found the
report and the working tree disagreeing — a task called done while the build
was red, features described as rewritten that were partly deleted, a route
renamed into a public prefix. Read the files.

## What does NOT go here

The Obsidian vault. It is read by the in-app business assistant through
`lib/vault.ts`, and agent debugging chatter in there means the assistant starts
answering questions about the business with notes about TypeScript imports.
Agent traffic stays in this directory.
