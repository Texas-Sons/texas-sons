import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar } from 'lucide-react';

/**
 * The booking button, and the only one on the page.
 *
 * Salon traffic is overwhelmingly mobile, and a visitor three screens deep into
 * a portfolio should never have to scroll back up to book. On desktop that is
 * already handled — the navbar's own booking CTA stays in view the whole way
 * down — so a floating one there would be a second control for the same job,
 * sitting on top of the client's content. On a phone that navbar CTA is folded
 * into the hamburger menu, which is two taps and a decision, and that is the
 * gap this fills.
 *
 * On a phone it is not a second button. There are three places a booking button
 * belongs — in the hero, floating at the corner, and in the booking section —
 * and this is one button that occupies whichever of them is right, moving
 * between them as a body of slime. A slot nobody is standing in is empty.
 *
 * ── How the movement is built, and two ways it was built wrong ──
 *
 * First attempt got its liquid quality from an SVG feTurbulence filter. When
 * `filter: url(#id)` fails to resolve the spec says the element is not rendered
 * at all, so the button was solid at each end and absent in between — which
 * looks exactly like disappearing. Nothing here can fail that way: everything
 * that draws the effect is also what draws the button.
 *
 * Second attempt deformed on a timeline — melt for the first third, hold, reform
 * for the last third — and read as clunky, because the squashing had nothing to
 * do with the moving. Real slime does not deform on a schedule. It deforms
 * *because* it is accelerating, and it is round again when it is at rest.
 *
 * So position and size are springs, and every deformation is a function of the
 * velocity those springs happen to have. It stretches along the direction it is
 * travelling and pinches across it, keeping its area; it is blobbiest at speed
 * and firms up as it slows; it overshoots and jiggles when it arrives, because
 * an under-damped spring does that on its own rather than because a keyframe
 * said so. The destination is re-read every frame, so a page that is still
 * scrolling is simply a target that is still moving, and the slime trails after
 * it the way it should.
 *
 * This lives in its own component for two reasons, both of which were bugs:
 *
 *  1. Its scroll listener needs hooks, and SiteRenderer returns early when a
 *     project has no profile. Hooks below that early return change the hook
 *     count between renders — the same fault as c53ae74, which blanked a page.
 *     Hooks belong in a component that has no early return above them.
 *
 *  2. `position: fixed` anchors to the browser viewport, not to whatever box it
 *     is drawn inside. In the Studio — whose preview panel has no transformed
 *     ancestor to contain it — a fixed button escaped the phone frame entirely
 *     and floated over the Studio's own chrome, where clicking it opened the
 *     client's booking page. Hence `variant`.
 */

export interface BookingFabProps {
  /** External booking page. Falls back to the on-page contact section. */
  bookingUrl?: string;
  /**
   * 'fixed'   — a real site: pinned to the viewport, revealed after scrolling.
   * 'preview' — the Studio: contained in the preview flow so it cannot cover
   *             the editor, and always visible since there is no page scroll
   *             to react to.
   */
  variant?: 'fixed' | 'preview';
  /**
   * Visible text, and therefore the accessible name. Kept short — this button
   * sits over the page content.
   *
   * One label, not a visible one plus a longer aria-label. A voice-control user
   * says the words they can see, and WCAG 2.5.3 requires the accessible name to
   * contain the visible text; "Book an appointment" does not contain "Book Now".
   */
  label?: string;
}

/** Where the button can be. 'float' is this component's own resting corner. */
type Slot = 'home' | 'float' | 'dock';

const SLOT_SELECTOR: Record<Exclude<Slot, 'float'>, string> = {
  home: '[data-ts-book-home]',
  dock: '[data-ts-book-dock]',
};

/**
 * Only on phones.
 *
 * The handoff empties whichever slot is not holding the button, and on desktop
 * there is no floating button to hold it — so running this there would delete
 * the hero's booking CTA and the booking section's, with nothing taking their
 * place. Matches the `sm:hidden` on the button itself; the two must agree.
 */
const PHONE_QUERY = '(max-width: 639px)';

/** Fallback reveal point when a page has no hero CTA to hand over from. */
const REVEAL_AFTER_PX = 400;

/**
 * Spring constants, in the usual `a = -k(x - target) - c·v` form.
 *
 * Position is deliberately under-damped: `c` a little below the 2·sqrt(k) that
 * would bring it in dead — that shortfall is the overshoot and the jiggle, and
 * tuning it is tuning how gelatinous the thing feels. Size follows softer, so
 * it is still swelling into its new shape after it has arrived.
 */
const POSITION = { k: 210, c: 22 };
const SIZE = { k: 150, c: 18 };

/**
 * How much of the target's own motion a spring inherits.
 *
 * Damping a spring against its absolute velocity means it spends that damping
 * fighting the target's motion as well as its own overshoot, and the steady
 * error while chasing something that keeps moving is roughly its speed over the
 * stiffness. Scrolling quickly, that error is most of the screen — which is
 * exactly the sluggishness: not a slow spring, a spring being asked to catch
 * something while braking against the fact that it is moving.
 *
 * Damping against velocity *relative to the target* removes it. At a steady
 * chase the body simply travels at the target's speed with no error left over.
 * The droplets take less than all of it on purpose: their lag is the point.
 */
const BODY_FOLLOW = 1;
const DROPLET_FOLLOW = 0.55;

/**
 * It gathers itself before it goes. Anticipation, in the animator's sense — and
 * dead time, which is the one thing that always reads as lag. Scaled away when
 * the page is moving quickly: a pause to think about it is charming at rest and
 * infuriating when you are already three screens further down.
 */
const ANTICIPATE_MS = 150;
/** However lively the spring, it must always finish and free the slot. */
const MORPH_CEILING_MS = 1800;

/** Page scroll speed, in px/s, at which the handoff is treated as urgent. */
const URGENT_SCROLL = 1100;

/** Speed, in px/s, at which it is at its most deformed. */
const FULL_STRETCH_SPEED = 2400;
const MAX_STRETCH = 0.46;

/** Trailing blobs. Softer springs, so they lag and are drawn back in. */
const DROPLETS = [
  { k: 96, c: 15, size: 0.36, drift: -13 },
  { k: 72, c: 14, size: 0.26, drift: 12 },
  { k: 54, c: 13, size: 0.17, drift: -6 },
];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface Box { left: number; top: number; width: number; height: number }
const centreX = (b: Box) => b.left + b.width / 2;
const centreY = (b: Box) => b.top + b.height / 2;

interface Spring { value: number; velocity: number }
const spring = (value: number): Spring => ({ value, velocity: 0 });

/**
 * One step of `a = -k(x - target) - c(v - targetVelocity·follow)`, over dt
 * seconds. The damping term is what makes this track rather than trail — see
 * BODY_FOLLOW.
 */
function advance(
  s: Spring, target: number, dt: number, k: number, c: number,
  targetVelocity = 0, follow = 0
) {
  s.velocity += (-k * (s.value - target) - c * (s.velocity - targetVelocity * follow)) * dt;
  s.value += s.velocity * dt;
}

/** Rate of change of a value that is read fresh each frame, kept sane. */
function rateOf(now: number, previous: number, dt: number): number {
  if (dt <= 0) return 0;
  // A slot can jump — a layout change, a box that was display:none. A jump is
  // not a speed, and feeding one in would fire the body across the viewport.
  return Math.max(-6000, Math.min(6000, (now - previous) / dt));
}

export function BookingFab({
  bookingUrl,
  variant = 'fixed',
  label = 'Book Now',
}: BookingFabProps) {
  const isPreview = variant === 'preview';

  /** Untransformed, so its box is the corner the button rests in. */
  const hostRef = useRef<HTMLDivElement>(null);
  /** Everything the morph moves and deforms. */
  const shapeRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLAnchorElement>(null);
  /** The lettering only. The pill behind it is the body of the slime. */
  const inkRef = useRef<HTMLSpanElement>(null);
  const dropsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const floatBoxRef = useRef<Box | null>(null);
  const rafRef = useRef<number | null>(null);
  /** How fast the page is moving when a handoff is called for. */
  const scrollSpeedRef = useRef(0);
  const ownerRef = useRef<Slot>('float');
  const [owner, setOwner] = useState<Slot>('float');
  const [morphing, setMorphing] = useState(false);

  const slotEl = (slot: Slot): HTMLElement | null =>
    slot === 'float' ? null : document.querySelector<HTMLElement>(SLOT_SELECTOR[slot]);

  const boxOf = useCallback((slot: Slot): Box | null => {
    if (slot === 'float') {
      const el = hostRef.current;
      if (!el) return null;
      if (!floatBoxRef.current) {
        const r = el.getBoundingClientRect();
        floatBoxRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
      }
      return floatBoxRef.current;
    }
    const el = slotEl(slot);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    // A slot that is display:none — the navbar CTA on a phone — has no box and
    // is not a place a button can be.
    return r.width > 0 && r.height > 0 ? r : null;
  }, []);

  useEffect(() => {
    const onResize = () => { floatBoxRef.current = null; };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /** Shows exactly one slot's own button, or none of them mid-morph. */
  const occupy = useCallback((slot: Slot | null) => {
    (['home', 'dock'] as const).forEach(key => {
      const el = slotEl(key);
      if (!el) return;
      el.style.visibility = slot === key ? '' : 'hidden';
      el.style.opacity = '';
    });
  }, []);

  const morph = useCallback((from: Slot, to: Slot) => {
    const shape = shapeRef.current;
    const pill = pillRef.current;
    if (!shape || !pill) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const reduced = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const land = () => {
      rafRef.current = null;
      shape.style.transform = '';
      shape.style.filter = '';
      shape.style.opacity = '';
      pill.style.borderRadius = '';
      pill.style.transition = '';
      if (inkRef.current) inkRef.current.style.opacity = '';
      dropsRef.current.forEach(drop => { if (drop) drop.style.opacity = '0'; });
      occupy(to === 'float' ? null : to);
      const arrived = slotEl(to);
      if (arrived) arrived.style.opacity = '';
      setMorphing(false);
    };

    if (reduced) { land(); return; }

    const startBox = boxOf(from);
    const endBox = boxOf(to);
    const home = boxOf('float');
    if (!startBox || !endBox || !home) { land(); return; }

    setMorphing(true);
    occupy(null);
    const arriving = slotEl(to);
    if (arriving) {
      // Present and measurable but not yet seen. The last stretch cross-fades
      // the slime into it at the same size and position, so swapping one
      // element for another has nothing to give it away.
      arriving.style.visibility = '';
      arriving.style.opacity = '0';
    }
    // The pill's own hover transition would fight a transform written every
    // frame, interpolating towards each one and lagging the whole way.
    pill.style.transition = 'none';

    // Everything starts where the source is, at rest.
    const px = spring(centreX(startBox) - centreX(home));
    const py = spring(centreY(startBox) - centreY(home));
    const size = spring(0);
    const drops = DROPLETS.map(() => ({ x: spring(px.value), y: spring(py.value) }));

    // How much of a hurry the reader is in. A handoff triggered by a flick is
    // not the same event as one triggered by a slow drift past the hero, and
    // giving them the same timing is what makes the fast one feel slow.
    const urgency = clamp01(scrollSpeedRef.current / URGENT_SCROLL);
    const gatherMs = ANTICIPATE_MS * (1 - urgency);
    const hurry = 1 + urgency * 0.9;

    const started = performance.now();
    let last = started;
    let previousTargetX = centreX(endBox) - centreX(home);
    let previousTargetY = centreY(endBox) - centreY(home);

    const frame = (now: number) => {
      // Clamped: a backgrounded tab hands back a dt of several seconds, and a
      // spring integrated over that leaves the viewport in one step.
      const dt = Math.min(0.032, Math.max(0.001, (now - last) / 1000));
      last = now;
      const elapsed = now - started;

      // Both ends re-measured every frame; either may be moving, and while the
      // page is scrolling both are.
      const a = boxOf(from) || startBox;
      const b = boxOf(to) || endBox;

      // It gathers before it goes: squashes in place, holding position, the
      // way anything about to spring somewhere does.
      const gather = gatherMs > 0 && elapsed < gatherMs
        ? Math.sin(Math.PI * (elapsed / gatherMs))
        : 0;
      const launched = elapsed >= gatherMs;

      const targetX = centreX(b) - centreX(home);
      const targetY = centreY(b) - centreY(home);
      // The destination's own speed, which the body inherits instead of
      // braking against.
      const targetVx = rateOf(targetX, previousTargetX, dt);
      const targetVy = rateOf(targetY, previousTargetY, dt);
      previousTargetX = targetX;
      previousTargetY = targetY;

      if (launched) {
        advance(px, targetX, dt, POSITION.k * hurry, POSITION.c, targetVx, BODY_FOLLOW);
        advance(py, targetY, dt, POSITION.k * hurry, POSITION.c, targetVy, BODY_FOLLOW);
        advance(size, 1, dt, SIZE.k * hurry, SIZE.c);
      } else {
        px.value = centreX(a) - centreX(home);
        py.value = centreY(a) - centreY(home);
      }

      // Deformation is a function of how fast it is going, not of how far
      // through the animation it is. This is the whole difference between
      // slime and a rectangle on a timeline.
      // Speed relative to the target, not to the page. Deformation should come
      // from closing a gap, and a body keeping pace with a scrolling
      // destination is not straining at anything.
      const speed = Math.hypot(px.velocity - targetVx, py.velocity - targetVy);
      const stretch = Math.min(MAX_STRETCH, speed / FULL_STRETCH_SPEED * MAX_STRETCH)
        + gather * 0.18;
      const heading = speed > 12
        ? (Math.atan2(py.velocity - targetVy, px.velocity - targetVx) * 180) / Math.PI
        // Standing still it has no direction to stretch along, so the gather
        // squashes it downward like something crouching.
        : 90;

      // Its own box, growing from the source's proportions into the
      // destination's as the size spring runs — overshooting a little, since
      // that spring is under-damped too.
      const grow = size.value;
      const boxX = (a.width / home.width) + ((b.width / home.width) - (a.width / home.width)) * grow;
      const boxY = (a.height / home.height) + ((b.height / home.height) - (a.height / home.height)) * grow;

      // Along the heading it lengthens, across it pinches, and the two cancel:
      // slime has a volume and does not gain any by moving quickly.
      shape.style.transform =
        `translate3d(${px.value.toFixed(2)}px, ${py.value.toFixed(2)}px, 0) `
        + `rotate(${heading.toFixed(2)}deg) `
        + `scale(${(1 + stretch).toFixed(3)}, ${(1 / (1 + stretch)).toFixed(3)}) `
        + `rotate(${(-heading).toFixed(2)}deg) `
        + `scale(${boxX.toFixed(3)}, ${boxY.toFixed(3)})`;

      // Soft-edged while it is moving and crisp once it has stopped, which is
      // what tells you it is a material rather than a box being tweened.
      shape.style.filter = stretch > 0.01 ? `blur(${(stretch * 5.2).toFixed(2)}px)` : '';

      // Corners round off as it goes gelatinous, and the eight radii drift on
      // their own slow waves so the outline will not hold still.
      if (stretch > 0.01) {
        const blob = stretch / MAX_STRETCH;
        const wob = (i: number) =>
          (50 + 26 * blob * Math.sin(elapsed / 1000 * 3.4 * (1 + i * 0.23) + i * 1.9)).toFixed(1);
        pill.style.borderRadius =
          `${wob(0)}% ${wob(1)}% ${wob(2)}% ${wob(3)}% / ${wob(4)}% ${wob(5)}% ${wob(6)}% ${wob(7)}%`;
      } else {
        pill.style.borderRadius = '';
      }

      // Distance still to cover, as a fraction of the whole trip. Used only for
      // the handover, which must not begin until it is nearly home.
      const remaining = Math.hypot(targetX - px.value, targetY - py.value);
      const arrival = clamp01(1 - remaining / 90) * clamp01((grow - 0.72) / 0.28);

      // The lettering leaves as it goes soft — text smears rather than melts —
      // and it does not come back when the destination brings its own.
      if (inkRef.current) {
        inkRef.current.style.opacity =
          String(clamp01(1 - stretch * 4) * (to === 'float' ? 1 : 1 - arrival));
      }

      // Thrown off the body at speed and drawn back in as it settles. Their
      // springs are softer, so they arrive late without being told to.
      drops.forEach((drop, i) => {
        const el = dropsRef.current[i];
        if (!el) return;
        const spec = DROPLETS[i];
        advance(drop.x, px.value + spec.drift * stretch, dt, spec.k * hurry, spec.c,
                px.velocity, DROPLET_FOLLOW);
        advance(drop.y, py.value, dt, spec.k * hurry, spec.c,
                py.velocity, DROPLET_FOLLOW);
        const alive = clamp01(stretch / MAX_STRETCH) * (1 - arrival);
        if (alive < 0.03) { el.style.opacity = '0'; return; }
        el.style.opacity = (alive * 0.9).toFixed(2);
        el.style.transform =
          `translate3d(${drop.x.value.toFixed(2)}px, ${drop.y.value.toFixed(2)}px, 0) `
          + `scale(${(spec.size * alive).toFixed(3)})`;
      });

      if (to !== 'float') {
        shape.style.opacity = String(1 - arrival);
        if (arriving) arriving.style.opacity = String(easeOutCubic(arrival));
      }

      // Settled means caught up, not stationary. Judging it on absolute speed
      // meant a handoff during a long scroll could never finish and always ran
      // to the ceiling — which is most of what felt slow.
      const settled = speed < 14 && remaining < 2 && Math.abs(1 - grow) < 0.012;
      if ((launched && settled) || elapsed > MORPH_CEILING_MS) { land(); return; }
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
  }, [boxOf, occupy]);

  /**
   * Decides which slot should hold the button, and hands it over when that
   * changes. The booking section wins over the hero, and the corner takes it
   * whenever neither is on screen.
   *
   * The margins matter as much as the thresholds. Handing off exactly as a slot
   * crosses the edge means half the movement happens off screen — the half
   * where it leaves, since it sets off from where it was. Shrinking the box the
   * observer measures against buys the animation somewhere to be seen: the hero
   * gives the button up while still comfortably in view, and the booking
   * section takes it once it is properly on screen rather than a sliver.
   */
  useEffect(() => {
    if (isPreview) return;
    if (typeof window.matchMedia !== 'function') return;
    if (!window.matchMedia(PHONE_QUERY).matches) return;

    const home = slotEl('home');
    const dock = slotEl('dock');
    if (!home && !dock) return;

    const onScreen: Record<string, boolean> = { home: false, dock: false };
    const observers: IntersectionObserver[] = [];

    const settle = () => {
      const next: Slot = onScreen.dock ? 'dock' : onScreen.home ? 'home' : 'float';
      if (next === ownerRef.current) return;
      const previous = ownerRef.current;
      ownerRef.current = next;
      setOwner(next);
      morph(previous, next);
    };

    const watch = (el: Element | null, key: 'home' | 'dock', rootMargin: string) => {
      if (!el) return;
      const observer = new IntersectionObserver(entries => {
        onScreen[key] = entries[entries.length - 1].isIntersecting;
        settle();
      }, { threshold: 0.5, rootMargin });
      observer.observe(el);
      observers.push(observer);
    };

    watch(home, 'home', '-28% 0px 0px 0px');
    watch(dock, 'dock', '0px 0px -12% 0px');

    ownerRef.current = home ? 'home' : 'float';
    setOwner(ownerRef.current);
    occupy(ownerRef.current === 'home' ? 'home' : null);

    return () => {
      observers.forEach(o => o.disconnect());
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      // Never leave a client's booking button hidden because a component
      // unmounted mid-morph.
      (['home', 'dock'] as const).forEach(key => {
        const el = slotEl(key);
        if (el) { el.style.visibility = ''; el.style.opacity = ''; }
      });
    };
  }, [isPreview, morph, occupy]);

  /**
   * The plain reveal, for a page with no hero CTA to move out of. Nothing to
   * hand over from, so it behaves as it always did.
   */
  const [scrolled, setScrolled] = useState(false);
  const [hasSlots, setHasSlots] = useState(true);
  useEffect(() => {
    if (isPreview) return;
    setHasSlots(!!slotEl('home') || !!slotEl('dock'));
    let lastY = window.scrollY;
    let lastAt = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const dt = (now - lastAt) / 1000;
      if (dt > 0.004) {
        // Eased rather than sampled, so one stuttering frame does not decide
        // how urgent the next handoff is.
        const instant = Math.abs(window.scrollY - lastY) / dt;
        scrollSpeedRef.current += (instant - scrollSpeedRef.current) * 0.4;
        lastY = window.scrollY;
        lastAt = now;
      }
      setScrolled(window.scrollY > REVEAL_AFTER_PX);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isPreview]);

  const visible = isPreview || morphing || (hasSlots ? owner === 'float' : scrolled);

  // Test the protocol, not merely presence. Since the Square embed landed, this
  // prop is often an in-page anchor like '#book', and `!!bookingUrl` treated
  // that as external — target="_blank" on a fragment link opens an empty tab.
  // Same check NavbarBlock and ProductsBlock already use.
  const isExternal = /^https?:\/\//i.test(bookingUrl || '');

  return (
    <div
      ref={hostRef}
      className={`${
        isPreview ? 'absolute' : 'fixed'
      } ${
        // Mobile only. On desktop the navbar's own "Book" button is pinned in
        // view the whole way down the page, so a second floating one is a
        // duplicate control covering the content. On a phone that navbar CTA is
        // folded into the hamburger menu — two taps and a decision — which is
        // exactly where a persistent button earns its place.
        //
        // Kept visible in the Studio at every width on purpose: that panel is a
        // phone frame, and hiding the button there would mean the one preview
        // meant to show mobile is the one place you cannot see the mobile UI.
        isPreview ? '' : 'sm:hidden'
      } bottom-4 right-4 z-50 pb-[env(safe-area-inset-bottom)] ${
        // Only the plain reveal is a transition. The morph writes transform,
        // filter and opacity every frame, and a transition on top of that
        // interpolates towards each frame's value and lags the whole way.
        morphing ? '' : 'transition-opacity duration-300'
      } ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      // Hidden means hidden: an invisible button must not be focusable or
      // announced, or keyboard and screen-reader users reach a phantom control.
      // Mid-morph it is a shape in transit, not a target.
      aria-hidden={!visible || morphing}
    >
      {/* Thrown off the body at speed and drawn back in as it settles. Same
          accent as the button and behind it, so at rest they are three
          invisible dots costing nothing. */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        {DROPLETS.map((drop, i) => (
          <span
            key={i}
            ref={el => { dropsRef.current[i] = el; }}
            style={{ opacity: 0, width: 36, height: 36, marginLeft: -18, marginTop: -18 }}
            className="absolute left-1/2 top-1/2 rounded-full bg-[color:var(--ts-accent)] blur-[3px] will-change-transform"
          />
        ))}
      </div>

      <div ref={shapeRef} className="will-change-transform" style={{ transformOrigin: 'center center' }}>
        <a
          ref={pillRef}
          href={bookingUrl || '#contact'}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          tabIndex={visible && !morphing ? 0 : -1}
          className="inline-flex items-center gap-2 h-12 pl-4 pr-5 rounded-2xl shadow-xl transition-transform hover:scale-105 active:scale-95 bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--ts-accent)]"
        >
          <span ref={inkRef} className="inline-flex items-center gap-2">
            <Calendar className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm font-bold whitespace-nowrap">{label}</span>
          </span>
        </a>
      </div>
    </div>
  );
}
