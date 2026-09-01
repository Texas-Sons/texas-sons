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
 * The alternative, which is what shipped before, is three identical controls
 * fading past each other, and at the bottom of the page two of them a thumb's
 * width apart at the exact moment the visitor found the one they wanted.
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
const MORPH_MS = 940;
const MELT_END = 0.3;
const REFORM_START = 0.72;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** Progress within one phase of the morph. */
const phase = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;
const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

interface Box { left: number; top: number; width: number; height: number }
const centreX = (b: Box) => b.left + b.width / 2;
const centreY = (b: Box) => b.top + b.height / 2;

export function BookingFab({
  bookingUrl,
  variant = 'fixed',
  label = 'Book Now',
}: BookingFabProps) {
  const isPreview = variant === 'preview';

  const blobRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLAnchorElement>(null);
  const wobbleRef = useRef<SVGFEDisplacementMapElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);

  /** The blob's own resting box, measured untransformed and cached. */
  const floatBoxRef = useRef<Box | null>(null);
  const rafRef = useRef<number | null>(null);
  const ownerRef = useRef<Slot>('float');
  const [owner, setOwner] = useState<Slot>('float');
  const [morphing, setMorphing] = useState(false);

  const slotEl = (slot: Slot): HTMLElement | null =>
    slot === 'float' ? null : document.querySelector<HTMLElement>(SLOT_SELECTOR[slot]);

  const boxOf = useCallback((slot: Slot): Box | null => {
    if (slot === 'float') {
      const el = blobRef.current;
      if (!el) return null;
      if (!floatBoxRef.current) {
        const previous = el.style.transform;
        el.style.transform = '';
        const r = el.getBoundingClientRect();
        el.style.transform = previous;
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
    const blob = blobRef.current;
    if (!blob) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const reduced = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const land = () => {
      rafRef.current = null;
      blob.style.transform = '';
      blob.style.filter = '';
      blob.style.opacity = to === 'float' ? '1' : '0';
      blob.style.borderRadius = '';
      if (labelRef.current) labelRef.current.style.opacity = '';
      occupy(to === 'float' ? null : to);
      const el = slotEl(to);
      if (el) el.style.opacity = '';
      setMorphing(false);
    };

    if (reduced) { land(); return; }

    const fromBox = boxOf(from);
    const toBox = boxOf(to);
    if (!fromBox || !toBox) { land(); return; }

    const home = boxOf('float');
    if (!home) { land(); return; }

    setMorphing(true);
    occupy(null);
    const arriving = slotEl(to);
    if (arriving) {
      // It is there, ready to be seen, but not yet visible — the last fifteen
      // percent cross-fades the blob into it at the same size and position, so
      // the swap of one element for another has nothing to give it away.
      arriving.style.visibility = '';
      arriving.style.opacity = '0';
    }

    const started = performance.now();

    const frame = (now: number) => {
      const t = clamp01((now - started) / MORPH_MS);

      // Both ends re-measured every frame; either may be moving.
      const a = boxOf(from) || fromBox;
      const b = boxOf(to) || toBox;

      const melt = phase(t, 0, MELT_END);
      const travel = phase(t, MELT_END, REFORM_START);
      const reform = phase(t, REFORM_START, 1);

      // How liquid it is right now: fully at the midpoint, solid at both ends.
      const liquid = t < MELT_END
        ? easeOutCubic(melt)
        : t < REFORM_START ? 1 : 1 - easeOutCubic(reform);

      // Position: covers ground horizontally early and falls into place
      // vertically late. One curve on both axes is a diagonal slide, which is
      // the thing that reads as a slideshow rather than as something moving.
      const x = centreX(a) + (centreX(b) - centreX(a)) * easeOutCubic(travel) - centreX(home);
      const y = centreY(a) + (centreY(b) - centreY(a)) * easeInCubic(travel) - centreY(home)
        // Sags as it goes soft, the way something losing its shape does.
        + 10 * liquid;

      // Size: the source's box, slumping into a puddle, then rising into the
      // destination's box with a little overshoot on the way up.
      const puddleW = 1.34, puddleH = 0.22;
      const sx = (a.width / home.width) * (1 - liquid) + (a.width / home.width) * puddleW * liquid;
      const sy = (a.height / home.height) * (1 - liquid) + (a.height / home.height) * puddleH * liquid;
      const tx = (b.width / home.width) * (1 - liquid) + (b.width / home.width) * puddleW * liquid;
      const ty = (b.height / home.height) * (1 - liquid) + (b.height / home.height) * puddleH * liquid;

      const rise = reform > 0 ? easeOutBack(reform) : easeOutCubic(travel);
      const scaleX = sx + (tx - sx) * rise;
      const scaleY = sy + (ty - sy) * rise;

      blob.style.transform =
        `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;
      // Rounder the softer it is. A puddle has no corners.
      blob.style.borderRadius = `${(16 + 48 * liquid).toFixed(1)}px`;

      // The label cannot melt convincingly, so it leaves before the shape does
      // and does not come back — the destination's own label arrives instead.
      if (labelRef.current) labelRef.current.style.opacity = String(1 - Math.min(1, liquid * 2.4));

      // The wobble and the smear are what make it a material rather than a
      // rectangle changing size. Both peak with `liquid` and are switched off
      // entirely at the ends, since a filter left running costs a repaint a
      // frame for nothing.
      if (wobbleRef.current) wobbleRef.current.setAttribute('scale', (liquid * 26).toFixed(2));
      if (blurRef.current) blurRef.current.setAttribute('stdDeviation', (liquid * 3.4).toFixed(2));
      blob.style.filter = liquid > 0.01 ? 'url(#ts-melt)' : '';

      blob.style.opacity = String(1 - easeInCubic(phase(t, 0.85, 1)));
      if (arriving) arriving.style.opacity = String(easeOutCubic(phase(t, 0.85, 1)));

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
   */
  useEffect(() => {
    if (isPreview) return;
    if (typeof window.matchMedia !== 'function') return;
    const phone = window.matchMedia(PHONE_QUERY);
    if (!phone.matches) return;

    const home = slotEl('home');
    const dock = slotEl('dock');
    if (!home && !dock) return;

    const onScreen: Record<string, boolean> = { home: false, dock: false };

    const settle = () => {
      const next: Slot = onScreen.dock ? 'dock' : onScreen.home ? 'home' : 'float';
      if (next === ownerRef.current) return;
      const previous = ownerRef.current;
      ownerRef.current = next;
      setOwner(next);
      morph(previous, next);
    };

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const key = entry.target === dock ? 'dock' : 'home';
        // Properly on screen, not merely clipping an edge — otherwise the
        // handover fires while the receiving button is a sliver nobody can press.
        onScreen[key] = entry.isIntersecting;
      }
      settle();
    }, { threshold: 0.6 });

    if (home) observer.observe(home);
    if (dock) observer.observe(dock);

    // The corner starts empty and the hero holds the button, which is where a
    // page load leaves things; a deep link or a restored scroll position is
    // corrected by the observer's first callback.
    ownerRef.current = home ? 'home' : 'float';
    setOwner(ownerRef.current);
    occupy(ownerRef.current === 'home' ? 'home' : null);

    return () => {
      observer.disconnect();
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
    <>
      {/* The melt itself. feTurbulence gives an irregular edge and
          feDisplacementMap pushes the pixels around by it, so the shape crawls
          instead of merely scaling; the blur fuses what the displacement pulls
          apart. Both are driven to zero at rest — a filter left mounted on a
          fixed element costs a repaint per frame for no picture. */}
      {!isPreview && (
        <svg aria-hidden="true" focusable="false" width="0" height="0"
             className="absolute pointer-events-none" style={{ position: 'absolute' }}>
          <defs>
            <filter id="ts-melt" x="-40%" y="-40%" width="180%" height="180%">
              <feTurbulence
                type="fractalNoise" baseFrequency="0.013 0.055" numOctaves="2" seed="7"
                result="noise"
              />
              <feDisplacementMap
                ref={wobbleRef}
                in="SourceGraphic" in2="noise" scale="0"
                xChannelSelector="R" yChannelSelector="G" result="pushed"
              />
              <feGaussianBlur ref={blurRef} in="pushed" stdDeviation="0" />
            </filter>
          </defs>
        </svg>
      )}

      <div
        ref={blobRef}
        className={`${
          isPreview ? 'absolute' : 'fixed'
        } ${
          // Mobile only. On desktop the navbar's own "Book" button is pinned in
          // view the whole way down the page, so a second floating one is a
          // duplicate control covering the content. On a phone that navbar CTA
          // is folded into the hamburger menu — two taps and a decision — which
          // is exactly where a persistent button earns its place.
          //
          // Kept visible in the Studio at every width on purpose: that panel is
          // a phone frame, and hiding the button there would mean the one
          // preview meant to show mobile is the one place you cannot see the
          // mobile UI.
          isPreview ? '' : 'sm:hidden'
        } bottom-4 right-4 z-50 pb-[env(safe-area-inset-bottom)] will-change-transform ${
          // Only the plain reveal is a transition. The morph writes transform,
          // filter and opacity every frame, and a transition on top of that
          // interpolates towards each frame's value and lags the whole way.
          morphing ? '' : 'transition-opacity duration-300'
        } ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ transformOrigin: 'center center' }}
        // Hidden means hidden: an invisible button must not be focusable or
        // announced, or keyboard and screen-reader users reach a phantom
        // control. Mid-morph it is a shape in transit, not a target.
        aria-hidden={!visible || morphing}
      >
        <a
          ref={labelRef}
          href={bookingUrl || '#contact'}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          tabIndex={visible && !morphing ? 0 : -1}
          className="inline-flex items-center gap-2 h-12 pl-4 pr-5 rounded-2xl shadow-xl transition-transform hover:scale-105 active:scale-95 bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--ts-accent)]"
        >
          <Calendar className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-bold whitespace-nowrap">{label}</span>
        </a>
      </div>
    </>
  );
}
