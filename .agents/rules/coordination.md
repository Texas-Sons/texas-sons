# Coordination with opencode (Always On)

This workspace has TWO AI agents: you (Antigravity) and opencode (CLI). Follow these rules on every task.

1. **Lock first.** Before ANY file edit, read `.agent-lock`:
   - empty → write your name (`antigravity`), then proceed.
   - your name → you hold it; proceed.
   - another name → STOP and ask the user for a handoff.
   Clear the file when done.
2. **Verify before shipping.** After edits, run `npm run verify` (lint → test → build). A red build must never be committed or pushed. CI on GitHub enforces this.
3. **Sync with git.** `git pull` at session start; small conventional commits; push to `main`.
4. **Announce.** Leave a start note in `.agent-messages/` when you pick up a task and update it when done, so opencode knows what's in flight.
5. **Respect lanes.** opencode owns `src/templates/blocks/`, `server.ts`/deploy, verification infra. You own `src/components/AgentBuilder/`, photo scanner, voting/campaign features. Don't rewrite the other agent's committed work without user approval.

Full contract: `AGENTS.md`.