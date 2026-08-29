import { useReducedMotion } from 'framer-motion';

/**
 * One motion language for every block.
 *
 * Before this, three of fourteen blocks animated and each defined its own
 * variants inline, so a page scrolled through sections that behaved differently
 * from one another — which reads as unfinished rather than as design.
 *
 * Everything here is a scroll reveal: content rises and fades as it enters, once,
 * and never again. No parallax, no motion tied to scroll position — those fight
 * the reader on a phone, which is where most of these sites are seen.
 */

/** Wraps a group whose children should appear one after another. */
export const revealGroup = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

/** A single card or row inside a revealGroup. */
export const revealItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 110, damping: 20 },
  },
};

/** A section heading, or any single element that should not stagger. */
export const revealBlock = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/**
 * Standard viewport trigger. `once` matters: re-animating on every scroll past
 * is the thing that makes a site feel gimmicky rather than considered.
 * `amount: 0.15` fires early enough that content is never blank on arrival.
 */
export const revealViewport = { once: true, amount: 0.15 } as const;

/**
 * Motion props for a scroll-revealed element, honouring the visitor's
 * "reduce motion" setting.
 *
 * Some people get motion sickness from movement they did not initiate, and it is
 * an OS-level preference they have already expressed. When it is set, content
 * appears immediately — still visible, just not animated. Never leave it hidden.
 */
export function useReveal() {
  const reduced = useReducedMotion();

  if (reduced) {
    // No variants, no initial state: render plainly and immediately.
    return {
      group: {},
      item: {},
      props: {} as Record<string, unknown>,
    };
  }

  return {
    group: revealGroup,
    item: revealItem,
    props: {
      initial: 'hidden',
      whileInView: 'visible',
      viewport: revealViewport,
    } as Record<string, unknown>,
  };
}
