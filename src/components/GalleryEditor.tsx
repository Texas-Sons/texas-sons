import React, { useRef, useState, useLayoutEffect } from 'react';
import { Plus, X, ArrowLeft, ArrowRight, UploadCloud, GripVertical } from 'lucide-react';
import { resizeImage } from './IntakePortal/imageUtils';
import { isPlaceholderImage } from '../../lib/clientMedia';

/**
 * Arranges the photos on a client's gallery.
 *
 * There was nowhere to do this. `galleryImages` could only arrive from Google
 * Places, the intake portal, or the client's own uploads — nothing in the
 * Studio could add one, remove one, or say which came first. For a salon that
 * is the wrong thing to have no control over: the gallery is the strongest
 * section on the page, and which photo leads it is a decision, not an accident
 * of whatever order the uploads happened in.
 *
 * The client's own photos are arranged here too, and kept visibly apart. They
 * live in their own table so the Studio cannot overwrite them, they lead the
 * section, and they are removed from her dashboard rather than from here.
 * Ordering is presentation and belongs to whoever is building the page; the
 * photographs are hers.
 */

export interface ClientPhoto { id: string; url: string }

export interface GalleryEditorProps {
  images: string[];
  onChange: (images: string[]) => void;
  /** Explains where these sit relative to anything the client uploads. */
  hint?: string;
  /**
   * What the client has uploaded through her own dashboard.
   *
   * Shown here because the site renders these first, and listing only the
   * operator's own photos described a gallery nobody would ever see.
   */
  clientPhotos?: ClientPhoto[];
  /** Persists a new order for the client's photos. */
  onReorderClientPhotos?: (ids: string[]) => void;
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (from === to || to < 0 || to >= items.length) return items;
  const next = [...items];
  const [held] = next.splice(from, 1);
  next.splice(to, 0, held);
  return next;
}

interface Tile { key: string; src: string }

/**
 * A grid of photos that can be dragged into order.
 *
 * Reordering is live rather than on drop: the tiles rearrange under the one
 * being dragged, so the gap is always where the photo would land. A drag that
 * only commits at the end asks the operator to predict the result, and then
 * shows them whether they were right.
 *
 * Dragging is not the only way to do it. A pointer drag cannot be performed
 * with a keyboard and is awkward with a screen reader, so every tile also has
 * two buttons that move it one place. They are the same operation, not a
 * lesser fallback.
 */
function SortableGrid({
  tiles, onReorder, accent, badge, extra, dim,
}: {
  tiles: Tile[];
  onReorder: (next: Tile[]) => void;
  accent: string;
  badge: (index: number) => React.ReactNode;
  extra?: (index: number) => React.ReactNode;
  dim?: (tile: Tile) => boolean;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const boxes = useRef(new Map<string, DOMRect>());
  const held = useRef<HTMLElement | null>(null);

  /**
   * Slides tiles from where they were to where they now are.
   *
   * Reordering an array moves the DOM instantly, so without this the other
   * photos teleport around the tile being dragged and it is impossible to see
   * what happened. Measure before the paint, apply the old position as a
   * transform, then release it — the browser animates the difference.
   */
  useLayoutEffect(() => {
    nodes.current.forEach((el, key) => {
      const next = el.getBoundingClientRect();
      const prev = boxes.current.get(key);
      boxes.current.set(key, next);
      // The dragged tile is already following the pointer; animating it too
      // would fight that every frame.
      if (!prev || el === held.current) return;
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform 190ms cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transform = '';
      });
    });
  });

  const startDrag = (index: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    held.current = e.currentTarget;
    setDragging(index);
  };

  const onDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging === null) return;
    const el = held.current;
    if (!el) return;

    // Follow the pointer. Written straight to the node rather than through
    // state: this runs on every pointer event, and a re-render per event would
    // make the thing meant to feel responsive feel anything but.
    const box = boxes.current.get(tiles[dragging].key);
    if (box) {
      el.style.transition = 'none';
      el.style.transform =
        `translate(${e.clientX - (box.left + box.width / 2)}px, ${e.clientY - (box.top + box.height / 2)}px) scale(1.06)`;
    }

    // Whichever tile's centre the pointer is nearest is where it belongs. The
    // list reorders as soon as that changes, so the space under the cursor is
    // always the space the photo would take.
    let nearest = dragging;
    let best = Infinity;
    tiles.forEach((tile, i) => {
      const rect = nodes.current.get(tile.key)?.getBoundingClientRect();
      if (!rect) return;
      const distance = Math.hypot(
        e.clientX - (rect.left + rect.width / 2),
        e.clientY - (rect.top + rect.height / 2)
      );
      if (distance < best) { best = distance; nearest = i; }
    });
    if (nearest !== dragging) {
      onReorder(move(tiles, dragging, nearest));
      setDragging(nearest);
    }
  };

  const endDrag = () => {
    const el = held.current;
    if (el) {
      // Snaps home. It is already in the right slot — this is the drag catching
      // up with the reorder that has already happened.
      el.style.transition = 'transform 190ms cubic-bezier(0.2, 0.8, 0.2, 1)';
      el.style.transform = '';
    }
    held.current = null;
    setDragging(null);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {tiles.map((tile, i) => (
        <div
          key={tile.key}
          ref={el => { if (el) nodes.current.set(tile.key, el); else nodes.current.delete(tile.key); }}
          onPointerDown={startDrag(i)}
          onPointerMove={onDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          // Without this the browser claims the gesture for scrolling and the
          // drag never starts on a touchscreen.
          style={{ touchAction: 'none' }}
          className={`group relative aspect-square rounded-xl overflow-hidden border cursor-grab active:cursor-grabbing ${
            dragging === i ? `${accent} z-20 shadow-2xl shadow-black/60` : 'border-stone-800 hover:border-stone-600'
          }`}
        >
          <img
            src={tile.src}
            alt=""
            draggable={false}
            className={`w-full h-full object-cover pointer-events-none ${
              dim?.(tile) ? 'opacity-30 grayscale' : ''
            }`}
          />
          {badge(i)}
          <span className="absolute top-1 right-1 text-stone-300/70 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-1 bg-gradient-to-t from-black/85 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onReorder(move(tiles, i, i - 1))}
              disabled={i === 0}
              aria-label={`Move photo ${i + 1} earlier`}
              className="p-1 rounded text-stone-300 hover:text-white disabled:opacity-30"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            {extra?.(i) ?? <span />}
            <button
              type="button"
              onClick={() => onReorder(move(tiles, i, i + 1))}
              disabled={i === tiles.length - 1}
              aria-label={`Move photo ${i + 1} later`}
              className="p-1 rounded text-stone-300 hover:text-white disabled:opacity-30"
            >
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GalleryEditor({
  images, onChange, hint, clientPhotos = [], onReorderClientPhotos,
}: GalleryEditorProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // A stock stand-in loses to a real photo — that is the entire point of the
  // client portal — so once she has uploaded anything, the operator's
  // placeholders are not on the site at all. Saying so here is the difference
  // between an editor that matches the page and one that quietly does not.
  const stockIsDropped = clientPhotos.length > 0;

  const add = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    // The same photo twice is a mistake every time, and it would also give two
    // tiles the same identity, which is what the reorder animation keys on.
    if (images.includes(trimmed)) {
      setError('That photo is already in the gallery.');
      return;
    }
    setError(null);
    onChange([...images, trimmed]);
    setUrl('');
  };

  return (
    <div className="space-y-3">
      {clientPhotos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
            {clientPhotos.length} uploaded by the client — these lead
          </p>
          <SortableGrid
            tiles={clientPhotos.map(p => ({ key: p.id, src: p.url }))}
            onReorder={next => onReorderClientPhotos?.(next.map(t => t.key))}
            accent="border-emerald-400"
            badge={i => (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-[9px] font-bold text-stone-950 font-mono">
                {i === 0 ? 'LEADS' : i + 1}
              </span>
            )}
          />
          <p className="text-[10px] text-stone-600">
            The order is yours to set and saves straight away. The photographs are hers — she
            removes them from her own dashboard.
          </p>
        </div>
      )}

      {clientPhotos.length > 0 && images.length > 0 && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 pt-1">
          Yours, after hers
        </p>
      )}

      {images.length === 0 ? (
        <p className="text-xs text-stone-500">
          {clientPhotos.length > 0
            ? 'Nothing of your own here. Hers are the gallery.'
            : 'No photos yet. For a salon this section is the strongest thing on the page — add her best work and put the best of it first.'}
        </p>
      ) : (
        <SortableGrid
          tiles={images.map(src => ({ key: src, src }))}
          onReorder={next => onChange(next.map(t => t.src))}
          accent="border-[#C5A059]"
          dim={tile => stockIsDropped && isPlaceholderImage(tile.src)}
          badge={i =>
            stockIsDropped && isPlaceholderImage(images[i]) ? (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-amber-500/90 text-[9px] font-bold text-stone-950 font-mono">
                NOT SHOWN
              </span>
            ) : (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-stone-200 font-mono">
                {clientPhotos.length === 0 && i === 0 ? 'LEADS' : clientPhotos.length + i + 1}
              </span>
            )
          }
          extra={i => (
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              aria-label={`Remove photo ${i + 1}`}
              className="p-1 rounded text-stone-300 hover:text-red-400"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        />
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(url); } }}
          placeholder="https://... or upload"
          className="flex-1 min-w-0 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 text-[11px] font-mono"
        />
        <button
          type="button"
          onClick={() => add(url)}
          disabled={!url.trim()}
          className="px-3 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 rounded-lg text-xs font-bold border border-stone-700 flex items-center gap-1.5 flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-[#C5A059]" aria-hidden="true" />
          Add
        </button>
        <label className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold cursor-pointer border border-stone-700 flex items-center gap-1.5 flex-shrink-0">
          <UploadCloud className="w-3.5 h-3.5 text-[#C5A059]" aria-hidden="true" />
          Upload
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async e => {
              const files = Array.from(e.target.files ?? ([] as unknown as FileList)) as File[];
              e.target.value = '';
              if (!files.length) return;
              setError(null);
              try {
                // Resized on the way in. The blueprint is injected verbatim into
                // the deployed HTML, so a full-size phone photo here is
                // megabytes on every visitor's page load.
                const added = await Promise.all(files.map(file => resizeImage(file, 1600)));
                const fresh = added.filter(src => !images.includes(src));
                if (fresh.length) onChange([...images, ...fresh]);
              } catch {
                setError('One of those images could not be read. Try a different file.');
              }
            }}
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <p className="text-[10px] text-stone-600 leading-snug">
        Drag to rearrange, or use the arrows on each photo.
        {stockIsDropped
          ? ' Greyed-out photos are stock stand-ins that her uploads have replaced — they are not on the live site.'
          : ' The first one leads the section.'}
        {hint ? ` ${hint}` : ''}
      </p>
    </div>
  );
}
