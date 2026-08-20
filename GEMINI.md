# GEMINI.md — Antigravity-specific rules

You (Antigravity) work in this repo **alongside another AI agent: opencode**. Treat it as a colleague, not an obstacle.

## Must follow

1. Read `AGENTS.md` at the repo root at session start — it is the coordination contract for this project.
2. **Check `.agent-lock` before editing anything.** Empty → write `antigravity` and start. Another name → stop and ask the user for a handoff. Clear it when you finish.
3. **Run `npm run verify` before committing.** Never commit or push a red build.
4. **`git pull` before you start editing** and **post start/finish notes to `.agent-messages/`** so opencode knows what you're working on.
5. Ownership lanes (from AGENTS.md): opencode owns `src/templates/blocks/`, `server.ts`/deploy, and verification infra. You own `src/components/AgentBuilder/`, photo scanner, voting/campaign features. Cross-lane edits need a board announcement first.
6. Never rewrite opencode's committed work without the user's explicit approval.

Keep this file small. General project facts live in `AGENTS.md`.