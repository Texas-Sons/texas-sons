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
 * and this is one button that occupies whichever of them is right, melting out
 * of the last and reforming in the next. A slot nobody is standing in is empty.
 *
 * The melt is built out of geometry — squash, an undulating outline, thrown
 * droplets — and a plain CSS blur. An earlier version got its liquid quality
 * from an SVG feTurbulence/feDisplacementMap filter, and it disappeared instead
 * of melting: when `filter: url(#id)` fails to resolve, the spec says the
 * element is not rendered at all, so the button was solid at each end of the
 * animation and absent for the middle of it. Nothing here can fail that way.
 * Everything that draws the effect also draws the button.
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

/** Melt, travel, reform. Long enough to read as a material, short enough to sit through. */
const MORPH_MS = 1050;
const MELT_END = 0.32;
const REFORM_START = 0.7;

/** Thrown ahead of the main body and caught up with. */
const DROPLETS = [
  { delay: 0.10, size: 0.34, drift: -14 },
  { delay: 0.17, size: 0.24, drift: 13 },
  { delay: 0.25, size: 0.16, drift: -7 },
];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** Progress within one phase of the morph. */
const spanOf = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;
const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

interface Box { left: number; top: number; width: number; height: number }
const centreX = (b: Box) => b.left + b.width / 2;
const centreY = (b: Box) => b.top + b.height / 2;

/**
 * How molten it is at this moment: solid at both ends, fully liquid across the
 * middle. Everything the melt does is scaled by this one number, so the shape,
 * the blur, the sag and the droplets all soften and set together rather than
 * drifting out of step.
 */
function liquidAt(t: number): number {
  if (t <= 0 || t >= 1) return 0;
  if (t < MELT_END) return easeOutCubic(spanOf(t, 0, MELT_END));
  if (t < REFORM_START) return 1;
  return 1 - easeOutCubic(spanOf(t, REFORM_START, 1));
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
  /** The lettering only. The pill behind it is the blob. */
  const inkRef = useRef<HTMLSpanElement>(null);
  const dropsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const floatBoxRef = useRef<Box | null>(null);
  const rafRef = useRef<number | null>(null);
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

  /**
   * Melts the button out of one slot and reforms it in the next.
   *
   * Driven frame by frame rather than handed to a transition, because both ends
   * are moving: the page is still scrolling — that scroll is what triggered
   * this — so a transition towards a box measured at the start lands where that
   * box used to be. Re-reading both each frame is the difference between a
   * button that travels to the other button and one that travels to its
   * former address.
   */
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
      // the blob into it at the same size and position, so swapping one element
      // for another has nothing to give it away.
      arriving.style.visibility = '';
      arriving.style.opacity = '0';
    }
    // The pill's own hover transition would fight a transform written every
    // frame, interpolating towards each one and lagging the whole way.
    pill.style.transition = 'none';

    const started = performance.now();

    /** Where the centre of the mass is, as an offset from the resting corner. */
    const pathAt = (t: number, a: Box, b: Box) => {
      const travel = spanOf(t, MELT_END, REFORM_START);
      return {
        // Ground covered horizontally early, falling into place vertically
        // late. One curve on both axes is a diagonal slide, which is precisely
        // what reads as a slideshow rather than as something moving.
        x: centreX(a) + (centreX(b) - centreX(a)) * easeOutCubic(travel) - centreX(home),
        y: centreY(a) + (centreY(b) - centreY(a)) * easeInCubic(travel) - centreY(home)
          // Sags as it goes soft, the way something losing its shape does.
          + 12 * liquidAt(t),
      };
    };

    const frame = (now: number) => {
      const t = clamp01((now - started) / MORPH_MS);

      // Both ends re-measured every frame; either may be moving.
      const a = boxOf(from) || startBox;
      const b = boxOf(to) || endBox;

      const liquid = liquidAt(t);
      const { x, y } = pathAt(t, a, b);

      // Size: the source's box slumping into a puddle, then rising into the
      // destination's box with a little overshoot on the way up.
      const puddleW = 1.32, puddleH = 0.26;
      const widen = (box: Box) => (box.width / home.width) * (1 + (puddleW - 1) * liquid);
      const flatten = (box: Box) => (box.height / home.height) * (1 - (1 - puddleH) * liquid);
      const rise = t >= REFORM_START
        ? easeOutBack(spanOf(t, REFORM_START, 1))
        : easeOutCubic(spanOf(t, MELT_END, REFORM_START));
      const scaleX = widen(a) + (widen(b) - widen(a)) * rise;
      const scaleY = flatten(a) + (flatten(b) - flatten(a)) * rise;

      // Leans into the direction it is being pulled.
      const lean = -9 * liquid * Math.sin(Math.PI * spanOf(t, MELT_END, REFORM_START));

      shape.style.transform =
        `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) `
        + `skewX(${lean.toFixed(2)}deg) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;
      // A plain blur, which every browser draws. This is what stops it reading
      // as a rectangle changing size — an outline that softens as it goes.
      shape.style.filter = liquid > 0.005 ? `blur(${(liquid * 3.2).toFixed(2)}px)` : '';

      // An outline that will not hold still. Eight radii on their own slow
      // waves; at rest they settle back to the button's own corners.
      if (liquid > 0.005) {
        const wob = (i: number) =>
          (50 + 30 * liquid * Math.sin(t * Math.PI * 3.1 * (1 + i * 0.21) + i * 1.9)).toFixed(1);
        pill.style.borderRadius =
          `${wob(0)}% ${wob(1)}% ${wob(2)}% ${wob(3)}% / ${wob(4)}% ${wob(5)}% ${wob(6)}% ${wob(7)}%`;
      } else {
        pill.style.borderRadius = '';
      }

      // The lettering goes before the shape does. Text cannot melt
      // convincingly — it smears into something illegible — and the
      // destination brings its own. Only the ink fades: the pill behind it is
      // the body of the blob, and fading that is how the last attempt at this
      // ended up looking like the button simply vanished.
      if (inkRef.current) inkRef.current.style.opacity = String(1 - Math.min(1, liquid * 2.6));

      // Flung ahead and caught up with. Each runs the same path a little behind
      // the body, so they trail on the way out and are reabsorbed on arrival.
      dropsRef.current.forEach((drop, i) => {
        if (!drop) return;
        const spec = DROPLETS[i];
        const lagged = clamp01(t - spec.delay);
        const alive = liquidAt(lagged) * liquid;
        if (alive < 0.02) { drop.style.opacity = '0'; return; }
        const at = pathAt(lagged, a, b);
        drop.style.opacity = (alive * 0.95).toFixed(2);
        drop.style.transform =
          `translate3d(${(at.x + spec.drift * alive).toFixed(2)}px, ${(at.y + 8 * alive).toFixed(2)}px, 0) `
          + `scale(${(spec.size * alive).toFixed(3)})`;
      });

      shape.style.opacity = String(1 - easeInCubic(spanOf(t, 0.86, 1)));
      if (arriving) arriving.style.opacity = String(easeOutCubic(spanOf(t, 0.86, 1)));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }
      land();
    };

    rafRef.current = requestAnimationFrame(frame);
  }, [boxOf, occupy]);

  /**
   * Decides which slot should hold the button, and hands it over when that
   * changes. The booking section wins over the hero, and the corner takes it
   * whenever neither is on screen.
   *
   * The margins matter as much as the thresholds. Handing off exactly as a slot
   * crosses the edge means the melt happens off screen — the interesting half
   * of it, since the button goes soft where it started. Shrinking the box the
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
   * The plain reveal, for a page with no hero CTA to melt out of. Nothing to
   * hand over from, so it behaves as it always did.
   */
  const [scrolled, setScrolled] = useState(false);
  const [hasSlots, setHasSlots] = useState(true);
  useEffect(() => {
    if (isPreview) return;
    setHasSlots(!!slotEl('home') || !!slotEl('dock'));
    const onScroll = () => setScrolled(window.scrollY > REVEAL_AFTER_PX);
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
      {/* Thrown off the body as it goes soft and reabsorbed as it sets. They
          are the same accent as the button and sit behind it, so at rest they
          are three invisible dots costing nothing. */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        {DROPLETS.map((drop, i) => (
          <span
            key={i}
            ref={el => { dropsRef.current[i] = el; }}
            style={{ opacity: 0, width: 34, height: 34, marginLeft: -17, marginTop: -17 }}
            className="absolute left-1/2 top-1/2 rounded-full bg-[color:var(--ts-accent)] blur-[2px] will-change-transform"
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
