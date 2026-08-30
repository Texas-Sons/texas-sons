# TASK — mobile scroll fix, remove the admin badge, add a booking button

**For:** Antigravity (your lane: `src/templates/blocks/`, `src/ClientApp.tsx`)
**From:** claude-code, 2026-08-30 (updated)
**Client context:** Opalescent Color Studio (project `1788000270421`), Beauty & Wellness, mobile-first — most salon traffic is phones.

Three pieces. Do them in this order: Part 2 removes what would otherwise collide
with Part 3.

---

## Part 1 — the slider blocks vertical scrolling on mobile

### Symptom

On a phone, swiping up to scroll past the Transformations section does nothing.
The page is stuck until the finger starts outside the slider.

### Cause — confirmed, do not re-diagnose

`src/templates/blocks/BeforeAfterBlock.tsx`, line 82: the comparison frame carries
the Tailwind class **`touch-none`**, which is `touch-action: none`. That tells the
browser to hand *every* touch gesture to the page's own handlers, including
vertical panning. It was there to stop the browser hijacking a horizontal drag; it
also killed scrolling.

Compounding it: `onPointerDown` calls `setPointerCapture` **immediately**, so the
element claims the gesture before anyone knows which direction it is going.

### The fix

**1. `touch-none` → `touch-pan-y`.**
`touch-action: pan-y` lets the browser keep vertical scrolling while the element
keeps horizontal gestures. This alone fixes most of it.

**2. Do not capture the pointer on `pointerdown`.** Record the start position and
wait. On the first `pointermove`, compare the deltas:

- `Math.abs(dx) > Math.abs(dy)` → a horizontal drag. *Now* call
  `setPointerCapture` and start moving the handle.
- otherwise → the visitor is scrolling. Do nothing, ever, for this gesture.

Use a ~8px threshold before deciding, so a stationary tap is not classified as
either.

**3. A tap with no drag should still work** — moving the handle to the tapped
point is reasonable. Fire it on `pointerup` only when total movement stayed under
the threshold.

### Do not

- **Do not add `preventDefault()` on touchmove.** It reintroduces the same bug
  through a different door and breaks passive listeners.
- **Do not remove the keyboard handlers or the slider ARIA.** They are the only
  reason this control works without a mouse. Removing them while fixing touch is
  a regression, not a simplification.

### Verify on a real phone, or Chrome device emulation with touch

- [ ] Swipe up starting **on** the slider → the page scrolls
- [ ] Drag left/right → the handle moves, page does not scroll
- [ ] A diagonal swipe that is mostly vertical scrolls rather than dragging
- [ ] Desktop mouse drag still works
- [ ] Arrow keys still move the handle

---

## Part 2 — remove the "Portal Admin" badge from client sites

### What to remove

`src/ClientApp.tsx` around line 175: a floating `Portal Admin 🔒` button at
`fixed bottom-3 right-3 z-50`, rendered on every deployed client site.

Delete the button. **Keep the `#admin` hash route working** — it is how the view
is reached from now on, via a link the operator sends.

### Why

It is a staff entry point sitting on a public salon website where customers can
see and click it. Clients ask what it is; some press it. The real client portal
now exists (`/portal/<token>`, added 2026-08-30), so the entry point belongs in a
link Morgan sends her — not a button on her storefront.

### While you are in there — a false claim to fix

That admin view renders the text **"Authenticated Admin Session"**. There is no
authentication. It is a hash route anyone can type; nothing checks who you are.

The data shown (`profile`, `services`, `testimonials`) is already public on the
page, so nothing leaks — but the app should not claim a security property it does
not have. Either delete that line or change it to something true, e.g.
"Client preview — not a secure area".

Do not attempt to add real auth here. That is a separate job and the portal
already solves it properly.

---

## Part 3 — floating booking button

A persistent circular "Book" button, bottom-right, so booking is always one tap
away. Salon traffic is overwhelmingly mobile and this lifts conversion more than
any visual change on the page.

Part 2 frees the corner, so there is no longer anything to stack against.

### Where it goes

A small component rendered by `SiteRenderer` — **once per page**, not per section.

### Behaviour

- Circular, ~56px, accent-coloured, calendar or scissors icon, with
  `aria-label="Book an appointment"`. An icon-only button with no label is
  invisible to a screen reader.
- Links to `project.profile.bookingUrl` when present — **external, so
  `target="_blank"` and `rel="noopener noreferrer"`**. Falls back to `#contact`.
- Renders nothing for campaign sites. "Book an appointment" is meaningless on a
  judicial campaign.
- Fades in after roughly 400px of scroll. Showing it immediately duplicates the
  hero CTA already on screen.

### Two things that will bite you

**1. iPhone home indicator.** Use `pb-[env(safe-area-inset-bottom)]` or the button
sits under the system gesture bar on modern iPhones.

**2. It will cover the footer.** Add bottom padding to the page, or the last lines
of the footer are permanently hidden behind it on mobile.

### Verify

- [ ] Appears after scrolling past the hero, not before
- [ ] Opens Square in a new tab on her site
- [ ] Nothing else occupies that corner (Part 2 is done)
- [ ] Does not cover footer content at the bottom of the page
- [ ] Absent on a campaign site
- [ ] Announced correctly by a screen reader

---

## Repo rules that apply

- `npm run verify` green before committing (six smoke suites now)
- Stage explicit paths — never `git add -A`; the working tree carries other
  agents' scratch files
- Leave the tree clean; pull with `--autostash`
- Small conventional commits, pushed to `main`

## Report what you verified, not what you wrote

Say which device or emulation you tested the touch behaviour on. Four bugs this
week shipped green because nothing exercised the actual path — including this
very slider, which was built, pushed, and invisible for two days because the
Studio preview used a different renderer. "It compiles" is not a test of a touch
gesture.
