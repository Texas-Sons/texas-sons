import React, { useState, useEffect } from 'react';
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

  const visible = isPreview || scrolled;

  // Test the protocol, not merely presence. Since the Square embed landed, this
  // prop is often an in-page anchor like '#book', and `!!bookingUrl` treated
  // that as external — target="_blank" on a fragment link opens an empty tab.
  // Same check NavbarBlock and ProductsBlock already use.
  const isExternal = /^https?:\/\//i.test(bookingUrl || '');

  return (
    <div
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
      } bottom-4 right-4 z-50 pb-[env(safe-area-inset-bottom)] transition-opacity duration-300 ${
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
