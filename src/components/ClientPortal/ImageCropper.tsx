import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Check, X, ZoomIn } from 'lucide-react';

/**
 * Crop and align one photo to a fixed frame.
 *
 * Built for before/after pairs, where mismatched framing is not a cosmetic
 * problem but the whole failure: the slider reveals one image over the other, so
 * if the "after" was shot two steps closer, dragging the handle makes the
 * client's head jump. No amount of styling fixes that — the photos have to be
 * cropped to match, and only the person who took them knows what "matching"
 * means.
 *
 * The crop is baked into the saved JPEG rather than stored as parameters. That
 * keeps BeforeAfterBlock rendering a plain <img> with no knowledge of any of
 * this, and it means the pair is already aligned everywhere it is used — the
 * site, the Studio preview, any future export.
 *
 * Presented as a full-screen overlay on purpose. Dragging inside the frame *is*
 * panning, so the surface must claim touch gestures outright; doing that inside
 * a scrolling page is what trapped the finger on the comparison slider and left
 * the page unscrollable. In an overlay there is no page scroll to compete with.
 */

export interface ImageCropperProps {
  /** Data URL of the image being cropped. */
  src: string;
  /** Caption above the frame, e.g. "Before". */
  caption?: string;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}

/**
 * Output frame. Portrait 4:5 because these are photographs of people, and
 * because salon traffic is overwhelmingly phones — a landscape crop wastes most
 * of the screen it will actually be seen on.
 */
const OUT_W = 1080;
const OUT_H = 1350;
const MAX_ZOOM = 3;

export function ImageCropper({ src, caption, onCancel, onDone }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  // Offset of the image's top-left corner, in output-pixel space.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const dragFrom = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  // Scale at which the image exactly covers the frame with no gaps. Every other
  // measurement is relative to this, so zoom = 1 always means "fills the frame".
  const coverScale = natural ? Math.max(OUT_W / natural.w, OUT_H / natural.h) : 1;
  const scale = coverScale * zoom;
  const drawnW = natural ? natural.w * scale : 0;
  const drawnH = natural ? natural.h * scale : 0;

  const clamp = useCallback(
    (x: number, y: number) => ({
      // The frame must never show background: the image covers it or the offset
      // is wrong. Clamping here rather than at draw time means the preview and
      // the exported file cannot disagree.
      x: Math.min(0, Math.max(OUT_W - drawnW, x)),
      y: Math.min(0, Math.max(OUT_H - drawnH, y)),
    }),
    [drawnW, drawnH]
  );

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      const cover = Math.max(OUT_W / img.naturalWidth, OUT_H / img.naturalHeight);
      // Start centred, which is the right guess often enough to be worth making.
      setOffset({
        x: (OUT_W - img.naturalWidth * cover) / 2,
        y: (OUT_H - img.naturalHeight * cover) / 2,
      });
    };
    img.src = src;
  }, [src]);

  // Re-clamp whenever zooming out would otherwise leave a gap at an edge.
  useEffect(() => {
    if (!natural) return;
    setOffset(o => clamp(o.x, o.y));
  }, [zoom, natural, clamp]);

  /** Preview pixels per output pixel. */
  const previewRatio = () => (frameRef.current?.clientWidth || OUT_W) / OUT_W;

  const onPointerDown = (e: React.PointerEvent) => {
    if (!natural) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragFrom.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const from = dragFrom.current;
    if (!from) return;
    const ratio = previewRatio();
    setOffset(
      clamp(from.ox + (e.clientX - from.px) / ratio, from.oy + (e.clientY - from.py) / ratio)
    );
  };

  const stop = (e: React.PointerEvent) => {
    if (!dragFrom.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Already released — releasing twice is not worth surfacing.
    }
    dragFrom.current = null;
    setDragging(false);
  };

  const apply = () => {
    if (!natural) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, offset.x, offset.y, drawnW, drawnH);
      onDone(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = src;
  };

  const ratio = previewRatio();

  return (
    <div className="fixed inset-0 z-[60] bg-stone-950/95 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 -ml-2 text-stone-400 hover:text-stone-100"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
        <span className="text-sm font-bold text-stone-200">
          {caption ? `Position the ${caption.toLowerCase()} photo` : 'Position the photo'}
        </span>
        <button
          type="button"
          onClick={apply}
          disabled={!natural}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 text-sm font-bold disabled:opacity-40"
        >
          <Check className="w-4 h-4" aria-hidden="true" />
          Use
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stop}
          onPointerCancel={stop}
          style={{ aspectRatio: `${OUT_W} / ${OUT_H}` }}
          className={`relative w-full max-w-sm max-h-full overflow-hidden rounded-xl border-2 border-stone-700 bg-stone-900 touch-none select-none ${
            dragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {natural && (
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: offset.x * ratio,
                top: offset.y * ratio,
                width: drawnW * ratio,
                height: drawnH * ratio,
                maxWidth: 'none',
              }}
            />
          )}

          {/* Thirds, so two photos can be matched against something rather than
              by eye alone — line the jaw up on the same rule in both. */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-y-0 left-1/3 w-px bg-white/20" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-white/20" />
            <div className="absolute inset-x-0 top-1/3 h-px bg-white/20" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-white/20" />
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-2 space-y-3">
        <label className="flex items-center gap-3">
          <ZoomIn className="w-4 h-4 text-stone-500 flex-shrink-0" aria-hidden="true" />
          <span className="sr-only">Zoom</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-amber-500"
          />
        </label>
        <p className="text-xs text-stone-500 text-center">
          Drag to move, slide to zoom. Frame both photos the same way so they line up.
        </p>
      </div>
    </div>
  );
}
