import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MoveHorizontal, Sparkles } from 'lucide-react';
import { useReveal, revealBlock } from './motion';
import { BeforeAfterItem } from './types';

/**
 * Before / after comparison sliders.
 *
 * For a colourist this is the entire pitch — the transformation is the product,
 * and a side-by-side pair never lands the way a draggable reveal does. It is
 * also the one element on these sites people actually play with, which keeps
 * them on the page.
 *
 * Built on pointer events so mouse, touch and pen all work from one code path,
 * and keyboard-operable because a drag-only control is unusable for anyone not
 * using a mouse.
 */

interface BeforeAfterBlockProps {
  title?: string;
  subtitle?: string;
  items?: BeforeAfterItem[];
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'campaign-judicial' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
  maxItems?: number;
  /**
   * 'slider'     — drag to wipe between the two. Right when the frames are
   *                geometrically identical: a driveway, a room, teeth. The eye
   *                tracks one thing changing in place and the wipe is the story.
   * 'sideBySide' — both visible at once. Right when the shape itself changes.
   *
   * Hair is the second case. Colour changes the silhouette — length, volume,
   * how it falls — so a wipe reads as two photographs fighting rather than one
   * transformation, and the visitor can never see both states together, which
   * is exactly what someone judging a colourist wants to do. They are comparing,
   * not revealing.
   */
  layout?: 'slider' | 'sideBySide';
}

function SideBySide({ item }: { item: BeforeAfterItem }) {
  const frame =
    'relative flex-1 min-w-0 aspect-[4/5] overflow-hidden rounded-2xl border border-[color:var(--ts-border)] bg-[color:var(--ts-surface)]';
  const tag =
    'absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm';

  return (
    <figure className="w-full">
      <div className="flex gap-2 sm:gap-3">
        <div className={frame}>
          <img
            src={item.before}
            alt={item.label ? `${item.label}, before` : 'Before'}
            loading="lazy"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <span className={`${tag} bg-black/55 text-white`}>Before</span>
        </div>
        <div className={frame}>
          <img
            src={item.after}
            alt={item.label ? `${item.label}, after` : 'After'}
            loading="lazy"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <span className={`${tag} bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)]`}>
            After
          </span>
        </div>
      </div>

      {(item.label || item.service) && (
        <figcaption className="mt-3 flex items-baseline justify-between gap-3">
          {item.label && (
            <span className="text-sm font-bold text-[color:var(--ts-text)]">{item.label}</span>
          )}
          {item.service && (
            <span className="text-xs text-[color:var(--ts-muted)]">{item.service}</span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

function Comparison({ item }: { item: BeforeAfterItem }) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const setFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  // Pointer events track drag distance to preserve vertical mobile scrolling.
  // We capture only when a horizontal gesture is confirmed.
  const ptrStart = useRef<{x: number, y: number, captured: boolean} | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    ptrStart.current = { x: e.clientX, y: e.clientY, captured: false };
  };
  
  const onPointerMove = (e: React.PointerEvent) => {
    if (!ptrStart.current) return;
    const start = ptrStart.current;

    if (!start.captured) {
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx > 8 || dy > 8) {
        if (dx > dy) {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          start.captured = true;
          setDragging(true);
          setFromClientX(e.clientX);
        } else {
          ptrStart.current = null; // vertical scroll, ignore
        }
      }
    } else {
      setFromClientX(e.clientX);
    }
  };

  const stop = (e: React.PointerEvent) => {
    if (ptrStart.current) {
      const start = ptrStart.current;
      if (start.captured) {
        try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
        setDragging(false);
      } else {
        const dx = Math.abs(e.clientX - start.x);
        const dy = Math.abs(e.clientY - start.y);
        if (dx <= 8 && dy <= 8) {
          setFromClientX(e.clientX);
        }
      }
      ptrStart.current = null;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') { e.preventDefault(); setPosition(p => Math.max(0, p - step)); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setPosition(p => Math.min(100, p + step)); }
    if (e.key === 'Home') { e.preventDefault(); setPosition(0); }
    if (e.key === 'End') { e.preventDefault(); setPosition(100); }
  };

  return (
    <figure className="w-full">
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
        onKeyDown={onKeyDown}
        role="slider"
        tabIndex={0}
        aria-label={`Reveal ${item.label || 'the transformation'}. Left and right arrows adjust.`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)} percent after`}
        className={`relative w-full aspect-[4/5] sm:aspect-[4/3] overflow-hidden rounded-2xl border border-[color:var(--ts-border)] bg-[color:var(--ts-surface)] select-none touch-pan-y focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ts-accent)] ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* After — the full-size base layer */}
        <img
          src={item.after}
          alt={item.label ? `${item.label}, after` : 'After'}
          draggable={false}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Before — clipped to the handle position */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            src={item.before}
            alt={item.label ? `${item.label}, before` : 'Before'}
            draggable={false}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Corner labels, so the pair reads correctly even before anyone drags */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/55 text-white backdrop-blur-sm pointer-events-none">
          Before
        </span>
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)] pointer-events-none">
          After
        </span>

        {/* The handle */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.5)] pointer-events-none"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center">
            <MoveHorizontal className="w-5 h-5 text-stone-900" />
          </div>
        </div>
      </div>

      {(item.label || item.service) && (
        <figcaption className="mt-3 flex items-baseline justify-between gap-3">
          {item.label && (
            <span className="text-sm font-bold text-[color:var(--ts-text)]">{item.label}</span>
          )}
          {item.service && (
            <span className="text-xs text-[color:var(--ts-muted)]">{item.service}</span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

export function BeforeAfterBlock({
  title = 'The Transformation',
  subtitle,
  items,
  maxItems = 6,
  layout = 'slider',
}: BeforeAfterBlockProps) {
  // Hook before any early return — see c53ae74.
  const reveal = useReveal();

  // A pair needs both halves; one alone is not a comparison.
  const pairs = (items || []).filter(i => i && i.before && i.after).slice(0, maxItems);
  if (pairs.length === 0) return null;

  const sideBySide = layout === 'sideBySide';
  // "Drag to reveal" is an instruction for a control that is not on the page in
  // the side-by-side layout.
  const displaySubtitle = subtitle ?? (sideBySide ? undefined : 'Drag to reveal.');

  return (
    <section
      id="transformations"
      className="py-20 sm:py-28 relative bg-[color:var(--ts-bg)] text-[color:var(--ts-text)]"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[color:var(--ts-border)] to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
          variants={reveal.props.initial ? revealBlock : undefined}
          {...reveal.props}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-[color:var(--ts-accent-soft)] text-[color:var(--ts-accent)] border border-[color:var(--ts-accent-border)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Before &amp; After</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 font-[family-name:var(--ts-font-heading)]">
            {title}
          </h2>
          {displaySubtitle && (
            <p className="text-sm sm:text-base text-[color:var(--ts-muted)]">{displaySubtitle}</p>
          )}
        </motion.div>

        <motion.div
          className={`grid gap-6 sm:gap-8 ${pairs.length === 1 ? 'max-w-2xl mx-auto' : 'grid-cols-[repeat(auto-fit,minmax(300px,1fr))]'}`}
          variants={reveal.group}
          {...reveal.props}
        >
          {pairs.map((item, i) => (
            <motion.div key={`${item.label || 'pair'}-${i}`} variants={reveal.item}>
              {sideBySide ? <SideBySide item={item} /> : <Comparison item={item} />}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
