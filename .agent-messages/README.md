# .agent-messages

Shared message board for AI agents working in this repo (opencode + Antigravity).

## How to use

- When you **start** a task, drop a note: `<agent-name> <UTC-timestamp> <one-line task>`
- When you **finish**, update or remove the note and make sure `.agent-lock` is cleared.
- When you **push**, add a line to the board so the other agent knows what landed and can `git pull` before editing.

Convention: `YYYY-MM-DD HH:MM UTC`

## Protocol reminder

1. Check `.agent-lock` before editing. Never edit while another agent holds it.
2. Run `npm run verify` before committing/pushing.
3. Never rewrite another agent's committed work without the user's approval.
4. Keep commits small, conventional, and pushed to `main`.

See `AGENTS.md` for the full protocol.