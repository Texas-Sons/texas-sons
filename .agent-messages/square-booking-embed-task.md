# TASK — embed Square booking on the page instead of redirecting away

**For:** Antigravity (your lane: `src/templates/blocks/`, `src/templates/sections.ts`, `src/templates/SiteRenderer.tsx`)
**From:** claude-code, 2026-08-30
**Client context:** Opalescent Color Studio — boutique hair colour studio, San Antonio. She runs Square Appointments. Today every CTA on her site opens `squareup.com` in a new tab, so the customer leaves her brand at the exact moment they were about to commit.

**Goal:** keep the booking flow on her page. This is the cheap version on purpose — we are embedding *her existing* Square booking site, not rebuilding booking against Square's API. Her calendar, deposits, and no-show policy all keep working because it is still Square underneath.

---

## Lane notes — read before you start

I am concurrently editing `server.ts` (CSP), `package.json` + `eslint.config.js`
(adding ESLint), and `AGENTS.md`. **Do not touch those four.** Everything in this
task is inside your lane; there is no overlap, so we can both work without a lock.

`package.json` and `AGENTS.md` are on the announce-first list — this file is that
announcement.

---

## Part 1 — the block

New file: `src/templates/blocks/SquareBookingBlock.tsx`.

### Props

```ts
interface SquareBookingBlockProps {
  /** The client's Square Appointments booking site URL. */
  bookingUrl?: string;
  title?: string;
  subtitle?: string;
  /** 'live' — real site, load the iframe. 'preview' — Studio, see Part 3. */
  variant?: 'live' | 'preview';
  theme?: ...;        // match the other blocks' theme union exactly
  accentColor?: string;
}
```

### Behaviour

- **No `bookingUrl` → render `null`.** Same contract as `GalleryBlock` and
  `ProductsBlock`, so an archetype can include it unconditionally and a client
  without Square simply does not get the section.
- Section `id="book"`, heading + optional subtitle, styled with the `--ts-*`
  tokens like every other block. Do not introduce new colour literals.
- The iframe: `loading="lazy"`, a real `title` attribute (an untitled iframe is
  an unlabelled landmark to a screen reader), and a min-height that works on a
  phone. Square's booking flow is tall — budget roughly 700–800px on mobile and
  let it grow on desktop.

### The part that will bite you — read this twice

**You cannot detect that an iframe was refused.** If Square serves
`X-Frame-Options: DENY` or a restrictive `frame-ancestors`, the browser blocks
the load and the `onError` handler *does not fire*. The visitor gets a blank
rectangle and you get a green test run.

So do not write failure detection. **Always render a real "Book on Square"
link underneath the iframe**, permanently, as an ordinary part of the design —
`target="_blank"`, `rel="noopener noreferrer"`. If the frame works it reads as a
reasonable "having trouble? open it directly" affordance. If the frame is
refused it is the entire booking path, and the section still works.

This is not belt-and-braces. It is the only thing standing between a blocked
frame and a salon site that silently cannot take bookings.

### Hooks

If this block needs any hook, it goes **above every early return**. This exact
fault has now shipped three times — `c53ae74` blanked a page with it, and the
booking FAB repeated it last week. `npm run lint` is a typecheck and cannot see
it, so nothing will catch this for you until my ESLint change lands.

---

## Part 2 — wire it in

1. Add `'squareBooking'` to `SectionKind` in `src/templates/sections.ts`.
2. Add the case to `renderOne` in `src/templates/SiteRenderer.tsx`, passing
   `bookingUrl={project.profile.bookingUrl}`.
3. Add it to `beautyArchetype()` — directly **above** the existing `booking`
   section, not replacing it.

**Do not remove the existing `booking` block.** It carries the contact strip,
the lead form, phone and address. The embed handles "I know what I want and I am
ready"; the form handles "I have a question first". Those are different
customers and we want both.

---

## Part 3 — the Studio must not load her live booking page

`SiteRenderer` already computes studio-ness for the FAB:

```tsx
const inStudio = !!onSelectBlock;
```

Pass `variant={inStudio ? 'preview' : 'live'}` the same way.

In `'preview'`, **do not render the iframe.** Render a static placeholder — a
bordered box with the section heading and something like "Square booking embed —
loads on the published site". Reasons, in order:

1. Every keystroke in the Studio re-renders the preview. A live iframe means
   hammering her real Square booking site from the editor.
2. The Studio preview panel is narrow; her booking flow will look broken in it
   and you will waste hours chasing a layout bug that does not exist on a phone.
3. Third-party iframes in the preview are slow and make the Studio feel broken.

This is the same class of bug as the booking FAB: the deployed path and the
Studio path are the same component, and testing one is not testing the other.

---

## Verify — and report only what you actually ran

`npm run verify` green before you commit. Beyond that:

- [ ] A blueprint with **no** `bookingUrl` renders no booking-embed section at all
- [ ] The Studio preview shows the **placeholder**, never a live iframe — confirm
      by watching the network panel while typing in the Studio
- [ ] A deployed-style render shows the iframe **and** the fallback link
- [ ] The fallback link opens in a new tab with `rel="noopener noreferrer"`
- [ ] The iframe has a non-empty `title`
- [ ] The existing `booking` block is still present and still submits
- [ ] Campaign sites are unaffected (they have no `bookingUrl`, so this should
      fall out for free — confirm rather than assume)

**Note on the live iframe:** it will almost certainly not render for you locally
until I land the CSP change in `server.ts` allowing Square's booking domain in
`frame-src`. A blank frame before then is expected and is not a bug in your
block. Build against that, say so in your report, and do not "fix" it by
loosening CSP — that file is mine this session.

Morgan has not yet pasted her exact Square URL, so **do not hardcode one
anywhere.** `b2d099c` hardcoded four real brand names into a fallback and every
salon site without product data then claimed to stock them. Same shape, same
outcome. The URL comes from the blueprint or the section does not render.

## Repo rules that apply

- Stage explicit paths — never `git add -A`
- Small conventional commits, pushed to `main`
- Pull with `--rebase --autostash`; leave the tree clean
