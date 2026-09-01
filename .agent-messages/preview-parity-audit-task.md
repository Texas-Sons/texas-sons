# TASK — find every way the Studio preview differs from the deployed site

**For:** DeepSeek (IDE extension)
**From:** claude-code, 2026-09-01
**Deliverable:** a findings file. **Change no code.**

The Studio preview is supposed to show what the client will receive. It keeps
not doing that, and each time the cause has been different:

- the preview rendered a hardcoded list of nine blocks while the deployed site
  rendered a section array, so three blocks were live and invisible here
- `/api/deploy` merged `client_media` into the blueprint and the preview did
  not, so every photo a client uploaded through her portal was on her site and
  missing from the editor
- the preview was a `<div>`, so Tailwind breakpoints measured the browser window
  rather than the preview panel and the phone view rendered desktop layout
- the theme's CSS custom properties were applied with `Object.assign`, which
  silently does nothing for `--*` keys, so the preview had no theme at all

Four causes, four separate discoveries, all found by a human noticing the
picture was wrong. I want the rest of the list before the next one is found that
way.

---

## The two paths to compare

**Deploy** — `server.ts`: `app.post("/api/deploy")` → `blueprintWithClientMedia`
→ `publishBlueprint`. That function reads `dist/client.html`, injects
`window.__TXSONS_BLUEPRINT__` and `window.__TXSONS_API__`, gathers `dist/`, and
uploads. The page then boots `src/ClientApp.tsx`, which renders
`src/templates/SiteRenderer.tsx`.

**Preview** — `src/components/AgentBuilder/AgentBuilderStudio.tsx`: the
`activeTab === 'preview'` branch renders `PreviewFrame` containing
`SiteRenderer` with a locally merged snapshot.

Read both ends and list everything that differs.

## Specifically worth checking

**What wraps the renderer.** `ClientApp` does work around `SiteRenderer` that
the Studio does not — view modes, hash routes, the theme root, the lead
handler, sub-pages. Anything visual it contributes is missing from the preview.

**Fonts.** The deployed entry is `client.html`; the Studio runs under
`index.html`. If they load different font links, the preview renders in a
typeface the client will never see. `PreviewFrame` clones the host's
stylesheets, so what the host loads is what the frame gets.

**The data.** The preview uses the Studio's working snapshot; the deployed site
carries whatever was last published. That difference is legitimate and must not
be "fixed" — but say whether anything makes it *look* like they should match.

**Anything else the deploy does to the HTML** between reading `client.html` and
uploading. Every transformation there is a difference the preview does not have.

**Assets by relative path.** `logoUrl` is `/clients/opalescent-logo.png`. Does
that resolve the same way inside the preview iframe as on a Pages deployment?
Say what you can verify from the code and mark the rest unverified.

## What NOT to report

- Layout and responsive bugs on the site itself — a different task
- Code style, naming, refactors, typing
- Anything about auth, Supabase, or the portal routes
- Differences that are correct by design, unless something misleads the operator
  into expecting otherwise

## The report

Write `.agent-messages/deepseek-preview-parity-findings.md`:

| Difference | Deploy does | Preview does | Visible? | Confidence |
|---|---|---|---|---|

Cite `file:line` for both sides of every row. A difference I cannot locate is a
difference I cannot fix.

**Visible?** matters most: sort by whether the operator would SEE it. A missing
`<meta>` tag is real and invisible. A missing font is real and obvious. If you
are not sure, say so rather than guessing — mark it **unverified**.

## Hard rules

- **Do not edit, create or delete any file** except your findings file
- Do not run the app, install anything, or touch git beyond that one commit
- Cite lines rather than pasting blocks

## One warning

Plenty of code here looks wrong and is deliberate, with the reason written
directly above it — `client_media` being a separate table, the preview being
merged for display only and never into `project`. Read the comment before
reporting the thing it explains. Disagreeing with a stated reason is a fair
finding; not noticing it is noise.
