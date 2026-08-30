# TASK — mobile scroll fix on the before/after slider, plus a floating booking button

**For:** Antigravity (your lane: `src/templates/blocks/`, `src/ClientApp.tsx`)
**From:** claude-code, 2026-08-30
**Client context:** Opalescent Color Studio (project `1788000270421`), Beauty & Wellness, mobile-first — most salon traffic is phones.

Two separate pieces. Part 1 is a bug with a known cause; Part 2 is new.

---

## Part 1 — the slider blocks vertical scrolling on mobile

### Symptom

On a phone, swiping up to scroll past the Transformations section does nothing.
The page is stuck until the finger starts outside the slider.

### Cause — confirmed, do not re-diagnose

`src/templates/blocks/BeforeAfterBlock.tsx`, line 82, the comparison frame carries
the Tailwind class **`touch-none`**, which is `touch-action: none`. That tells the
browser to hand *every* touch gesture to the page's own handlers, including
vertical panning. It was there to stop the browser hijacking a horizontal drag;
it also killed scrolling.

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
  Release nothing (you never captured) and let the browser scroll.

Use a small threshold (~8px) before deciding, so a stationary tap does not get
classified as either.

**3. A tap with no drag should still work.** Tapping a point on the image is a
reasonable way to move the handle there — keep that, but only fire it on
`pointerup` when total movement stayed under the threshold.

### Do not

- **Do not add `preventDefault()` on touchmove.** It reintroduces the same bug
  through a different door and breaks passive listeners.
- **Do not remove the keyboard handlers or the slider ARIA.** They are the only
  way this control is usable without a mouse, and removing them is a
  regression, not a simplification.

### Verify on a real phone, or Chrome device emulation with touch

- [ ] Swipe up starting **on** the slider → the page scrolls
- [ ] Drag left/right on the slider → the handle moves, page does not scroll
- [ ] A diagonal swipe that is mostly vertical scrolls rather than dragging
- [ ] Desktop mouse drag still works
- [ ] Arrow keys still move the handle

---

## Part 2 — floating booking button

A persistent circular "Book" button, bottom-right, so booking is always one tap
away. Salon traffic is overwhelmingly mobile and this lifts conversion more than
any visual change on the page.

### Where it goes

A new block or a small component rendered by `SiteRenderer` — your call, but it
must be **rendered once per page**, not per section.

### Behaviour

- Circular, ~56px, accent-coloured, with a calendar or scissors icon plus an
  accessible label (`aria-label="Book an appointment"`). An icon-only button with
  no label is invisible to a screen reader.
- Links to `project.profile.bookingUrl` when present — **external, so
  `target="_blank"` and `rel="noopener noreferrer"`**. Falls back to `#contact`.
- Renders nothing for campaign sites. "Book an appointment" is meaningless on a
  judicial campaign.
- Fades in after the visitor scrolls past the hero — roughly 400px. Showing it
  immediately duplicates the hero CTA that is already on screen.

### Three things that will bite you

**1. Bottom-right is already occupied.** `src/ClientApp.tsx` line 175 has the
"Portal Admin 🔒" badge at `fixed bottom-3 right-3 z-50`. Two controls stacked in
the same corner is a mess. Either move the admin badge to bottom-**left**, or
stack them with clear spacing. Decide deliberately and say which you chose.

**2. iPhone home indicator.** Use `pb-[env(safe-area-inset-bottom)]` or the
button sits under the system gesture bar on modern iPhones.

**3. It will cover the footer.** Add bottom padding to the page, or the last
lines of the footer are permanently hidden behind it on mobile.

### Verify

- [ ] Appears after scrolling past the hero, not before
- [ ] Opens Square in a new tab on her site
- [ ] Does not overlap the admin badge
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
week shipped green because nothing exercised the actual path — including a
before/after slider that was built, pushed, and invisible for two days because
the Studio preview used a different renderer. "It compiles" is not a test of a
touch gesture.
