import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar } from 'lucide-react';

/**
 * Persistent booking button, bottom-right, phones only.
 *
 * Salon traffic is overwhelmingly mobile, and a visitor three screens deep into
 * a portfolio should never have to scroll back up to book. On desktop that is
 * already handled — the navbar's own booking CTA stays in view the whole way
 * down — so this would be a second control for the same job, sitting on top of
 * the client's content. On a phone the navbar CTA is folded into the hamburger
 * menu, which is two taps and a decision, and that is the gap this fills.
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

/** Below this many pixels the hero's own CTA is still on screen. */
const REVEAL_AFTER_PX = 400;

/** How long the button takes to cross the screen. */
const FLIGHT_MS = 620;

/**
 * The flight is an arc, not a line.
 *
 * Driving both axes off one curve gives a straight diagonal slide — the thing
 * that reads as a slide transition rather than as an object that moved. Real
 * movement carries: it covers ground horizontally early and falls into place
 * vertically late. Two different curves on the two axes is the whole trick.
 */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;

/** Where it is when it is not going anywhere. */
interface Rect { left: number; top: number; width: number; height: number }

export function BookingFab({
  bookingUrl,
  variant = 'fixed',
  label = 'Book Now',
}: BookingFabProps) {
  const isPreview = variant === 'preview';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isPreview) return;
    const onScroll = () => setScrolled(window.scrollY > REVEAL_AFTER_PX);
    onScroll(); // a deep link or a restored scroll position starts mid-page
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isPreview]);

  /**
   * The floating button hands itself over to the page's own booking button
   * when that one arrives on screen, and takes the job back when it leaves.
   *
   * Without it the two sit on top of each other, a thumb's width apart, and a
   * visitor who has just scrolled to the thing they were looking for is asked
   * which copy of it to press.
   *
   * Every frame is computed here rather than handed to a CSS transition,
   * because the destination moves. The page is still scrolling during the
   * flight — that is what triggered it — so a transition to a position measured
   * at the start lands wherever that position has since drifted to. Re-reading
   * the target each frame is the difference between a button that travels to
   * the other button and a button that travels to where it used to be.
   */
  const elRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<Rect | null>(null);
  const rafRef = useRef<number | null>(null);
  const [docked, setDocked] = useState(false);
  const dockedRef = useRef(false);

  /** Its resting box, measured untransformed and only when it has to be. */
  const measureHome = useCallback((): Rect | null => {
    const el = elRef.current;
    if (!el) return null;
    if (homeRef.current) return homeRef.current;
    const previous = el.style.transform;
    el.style.transform = '';
    const box = el.getBoundingClientRect();
    el.style.transform = previous;
    homeRef.current = { left: box.left, top: box.top, width: box.width, height: box.height };
    return homeRef.current;
  }, []);

  useEffect(() => {
    const onResize = () => { homeRef.current = null; };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fly = useCallback((direction: 'in' | 'out', target: Element) => {
    const el = elRef.current;
    const home = measureHome();
    if (!el || !home) return;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const reduced = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const settle = () => {
      rafRef.current = null;
      if (direction === 'in') {
        el.style.opacity = '0';
      } else {
        el.style.transform = '';
        el.style.opacity = '';
      }
    };

    if (reduced) { settle(); return; }

    const started = performance.now();

    const frame = (now: number) => {
      const t = Math.min(1, (now - started) / FLIGHT_MS);
      // Progress along the journey towards the dock, whichever way it is going.
      // Applying the easings to this rather than to raw time means the return
      // retraces the same arc instead of carving a different one.
      const u = direction === 'in' ? t : 1 - t;

      const to = target.getBoundingClientRect();
      const dx = (to.left + to.width / 2) - (home.left + home.width / 2);
      const dy = (to.top + to.height / 2) - (home.top + home.height / 2);

      const x = dx * easeOutCubic(u);
      const y = dy * easeInCubic(u);

      // Shrinks as it arrives — it is being absorbed by a much larger button,
      // and something that lands at full size has bounced rather than merged.
      const scale = 1 - 0.62 * u;
      // A little stretch through the middle of the trip and none at either end.
      // This is the part that reads as weight: things that accelerate deform,
      // and a rigid rectangle sliding at constant proportions reads as a slide.
      const stretch = 1 + 0.14 * Math.sin(Math.PI * t);
      // Leans into the turn, and comes back level.
      const lean = -7 * Math.sin(Math.PI * u);

      el.style.transform =
        `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) `
        + `rotate(${lean.toFixed(2)}deg) `
        + `scale(${(scale * stretch).toFixed(3)}, ${(scale / stretch).toFixed(3)})`;
      // Solid for most of the trip: it should be seen to arrive, not to
      // evaporate on the way.
      el.style.opacity = String(u < 0.72 ? 1 : Math.max(0, 1 - (u - 0.72) / 0.28));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }
      settle();
      if (direction === 'in') {
        // The real button acknowledges the handover. Without it the floating
        // one arrives somewhere inert and the trip had no destination.
        (target as HTMLElement).animate?.(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' },
          ],
          { duration: 460, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        );
      }
    };

    rafRef.current = requestAnimationFrame(frame);
  }, [measureHome]);

  useEffect(() => {
    if (isPreview) return;
    const target = document.querySelector('[data-ts-book-dock]');
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const next = entry.isIntersecting;
        if (next === dockedRef.current) return;
        dockedRef.current = next;
        setDocked(next);
        fly(next ? 'in' : 'out', target);
      },
      // Properly on screen, not merely clipping the bottom edge — otherwise it
      // hands over while the real button is still a sliver nobody can press.
      { threshold: 0.6 }
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPreview, fly]);

  const visible = isPreview || (scrolled && !docked);

  // Test the protocol, not merely presence. Since the Square embed landed, this
  // prop is often an in-page anchor like '#book', and `!!bookingUrl` treated
  // that as external — target="_blank" on a fragment link opens an empty tab.
  // Same check NavbarBlock and ProductsBlock already use.
  const isExternal = /^https?:\/\//i.test(bookingUrl || '');

  return (
    <div
      ref={elRef}
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
      } bottom-4 right-4 z-50 pb-[env(safe-area-inset-bottom)] will-change-transform ${
        // Only the reveal-on-scroll fade is a transition. The flight sets
        // transform and opacity every frame, and a transition on top of that
        // would interpolate towards each frame's value and lag the whole way.
        docked ? '' : 'transition-opacity duration-300'
      } ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      // Hidden means hidden: an invisible button must not be focusable or
      // announced, or keyboard and screen-reader users reach a phantom control.
      aria-hidden={!visible}
    >
      <a
        href={bookingUrl || '#contact'}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        tabIndex={visible ? 0 : -1}
        className="inline-flex items-center gap-2 h-12 pl-4 pr-5 rounded-2xl shadow-xl transition-transform hover:scale-105 active:scale-95 bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--ts-accent)]"
      >
        <Calendar className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
        <span className="text-sm font-bold whitespace-nowrap">{label}</span>
      </a>
    </div>
  );
}
