import React from 'react';
import { Plus, Trash2, ExternalLink, ChevronUp, ChevronDown, ScanLine, Loader2 } from 'lucide-react';
import { apiJson } from '../api';
import { resizeImage } from './IntakePortal/imageUtils';

/**
 * Edits the service menu and its per-service booking links.
 *
 * There was nowhere to do this. The Studio's form panel handles three campaign
 * "pillars" and nothing else, so a salon's nine services with their prices could
 * only be changed by editing blueprint JSON — for the block that carries the
 * prices customers act on.
 *
 * The booking link per service is the point. A visitor who has already chosen
 * balayage should land on balayage, not on a menu that asks them to choose it
 * again; every step between deciding and booking loses some of them. Square
 * gives a per-service link from its own dashboard, and it is pasted rather than
 * derived — their URL shape is theirs to change, and a link built from a guessed
 * pattern fails as a booking page that will not load, which nobody notices until
 * a customer gives up.
 */

export interface EditableService {
  title?: string;
  description?: string;
  price?: string;
  duration?: string;
  /** Groups this on the menu — "Color", "Cut & Style". Free text. */
  category?: string;
  bookingUrl?: string;
  highlight?: boolean;
}

export interface ServicesEditorProps {
  services: EditableService[];
  onChange: (services: EditableService[]) => void;
  /** Shown as the placeholder for a service with no link of its own. */
  fallbackBookingUrl?: string;
}

export function ServicesEditor({ services, onChange, fallbackBookingUrl }: ServicesEditorProps) {
  const [scanning, setScanning] = React.useState(false);
  const [scanError, setScanError] = React.useState<string | null>(null);

  /**
   * Reads a screenshot of a price list and appends what it finds.
   *
   * Appends rather than replaces: an operator who has already typed six
   * services and scans a photo of the other three should not lose the six. The
   * model reads prices and durations verbatim and is told not to invent one for
   * a service that does not list it, so a blank field is a real blank.
   *
   * Booking links are never extracted — a URL cannot be read off a screenshot,
   * and a guessed one is a booking page that will not load.
   */
  const scan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? ([] as unknown as FileList)).slice(0, 4) as File[];
    e.target.value = '';
    if (!files.length) return;

    setScanning(true);
    setScanError(null);
    try {
      const images = await Promise.all(
        files.map(async file => ({ data: await resizeImage(file, 2000), mimeType: 'image/jpeg' }))
      );
      const res = await apiJson<{ services: EditableService[] }>('/api/extract-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });
      if (!res.services?.length) {
        setScanError('No services were readable in that image. A clearer or closer screenshot usually fixes it.');
        return;
      }
      onChange([...services, ...res.services]);
    } catch (err: any) {
      setScanError(err.message);
    } finally {
      setScanning(false);
    }
  };

  const update = (i: number, patch: Partial<EditableService>) => {
    onChange(services.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const move = (i: number, delta: number) => {
    const next = [...services];
    const target = i + delta;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  };

  const field =
    'w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50';

  /**
   * Categories already in use, offered as autocomplete.
   *
   * The filter groups by exact string, so "Color" and "color" render as two
   * separate tabs. Suggesting what is already there makes the consistent
   * spelling the easiest one to type, which is a better guard than validation
   * that rejects what someone just typed.
   */
  const usedCategories = Array.from(
    new Set(services.map(s => (s.category || '').trim()).filter(Boolean))
  ).sort();

  return (
    <div className="space-y-3">
      <datalist id="ts-service-categories">
        {usedCategories.map(c => <option key={c} value={c} />)}
      </datalist>
      {services.length === 0 && (
        <p className="text-xs text-stone-500">
          No services yet. These are the prices customers act on, so they are worth getting exactly
          right.
        </p>
      )}

      {services.map((service, i) => (
        <div key={i} className="rounded-xl border border-stone-800 bg-stone-950/60 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 grid grid-cols-[1fr_auto] gap-2">
              <input
                value={service.title || ''}
                onChange={e => update(i, { title: e.target.value })}
                placeholder="Service name, e.g. Balayage"
                className={field}
              />
              <input
                value={service.price || ''}
                onChange={e => update(i, { price: e.target.value })}
                placeholder="$350+"
                className={`${field} w-28`}
              />
            </div>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
                className="p-1 text-stone-600 hover:text-stone-200 disabled:opacity-30"
              >
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === services.length - 1}
                aria-label="Move down"
                className="p-1 text-stone-600 hover:text-stone-200 disabled:opacity-30"
              >
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => onChange(services.filter((_, idx) => idx !== i))}
              aria-label={`Remove ${service.title || 'service'}`}
              className="p-2 text-stone-600 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-[1fr_7rem_7rem] gap-2">
            <input
              value={service.description || ''}
              onChange={e => update(i, { description: e.target.value })}
              placeholder="What it includes"
              className={field}
            />
            {/* Free text, and deliberately not a dropdown. The groups that
                matter to a salon are not the ones that matter to a barbershop,
                and a fixed list makes every new vertical a code change. Filter
                pills appear on the site once two services disagree about this;
                one category is a label, not a filter.
                Typing it the same way twice is the only rule — "Color" and
                "color" are two tabs. */}
            <input
              value={service.category || ''}
              onChange={e => update(i, { category: e.target.value })}
              placeholder="Color"
              list="ts-service-categories"
              className={field}
            />
            {/* Its own field. It was in the type and had no input, so the only
                way to show a duration was to bury it in the description. */}
            <input
              value={service.duration || ''}
              onChange={e => update(i, { duration: e.target.value })}
              placeholder="90 min"
              className={field}
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <span />
            <label className="flex items-center gap-1.5 px-3 rounded-lg border border-stone-800 text-[11px] text-stone-400 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={!!service.highlight}
                onChange={e => update(i, { highlight: e.target.checked })}
                className="accent-amber-500"
              />
              Feature
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={service.bookingUrl || ''}
              onChange={e => update(i, { bookingUrl: e.target.value })}
              placeholder={fallbackBookingUrl ? 'Booking link for this service (optional)' : 'Booking link for this service'}
              className={field}
            />
            {service.bookingUrl && (
              <a
                href={service.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open the booking page for ${service.title || 'this service'}`}
                title="Open it — a link that does not load is the failure this cannot detect for you"
                className="p-2 text-stone-500 hover:text-amber-400"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange([...services, { title: '', description: '', price: '' }])}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-700 text-sm font-bold text-stone-300 hover:bg-stone-900"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add a service
        </button>

        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-700 text-sm font-bold text-stone-300 hover:bg-stone-900 cursor-pointer">
          {scanning
            ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            : <ScanLine className="w-4 h-4" aria-hidden="true" />}
          {scanning ? 'Reading…' : 'Read from a screenshot'}
          <input type="file" accept="image/*" multiple className="hidden" onChange={scan} />
        </label>
      </div>

      {scanError && <p className="text-xs text-red-400">{scanError}</p>}

      <p className="text-xs text-stone-600">
        Without its own link, a service sends the visitor to the general booking page
        {fallbackBookingUrl ? '.' : ' — and there is no general booking page set for this client yet.'}
      </p>
    </div>
  );
}
