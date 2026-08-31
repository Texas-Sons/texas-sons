import React, { useState, useEffect, useCallback } from 'react';
import { resizeImage } from '../IntakePortal/imageUtils';
import { ImageCropper } from './ImageCropper';
import {
  Upload, Trash2, Loader2, AlertCircle, CheckCircle2, ImagePlus, Sparkles, ShoppingBag,
} from 'lucide-react';

/**
 * Managing a client's photos — portfolio, transformations, retail.
 *
 * Shared by both ways in: the token link at /portal/<token>, which needs nothing
 * of the client, and the signed-in dashboard at /dashboard, which is the only
 * way to give a stylist access and take it away again. They differ solely in how
 * a request is authenticated, so the transport is injected and everything else
 * lives here once.
 *
 * That split is deliberate and this repo has already paid for getting it wrong
 * the other way. ClientApp and the Studio preview each had their own copy of the
 * site layout; blocks were added to one and not the other, and three of them
 * were live on real sites while invisible in the preview for days. Two UIs over
 * one dataset drift, and nobody notices until a client does.
 */

export type MediaKind = 'portfolio' | 'beforeAfter' | 'product';

export interface MediaItem {
  id: string;
  kind: MediaKind;
  data: Record<string, any>;
  sort_order: number;
}

/**
 * How this component talks to the server. The token portal and the dashboard
 * supply different implementations; neither is visible from in here.
 */
export interface MediaApi {
  list: () => Promise<MediaItem[]>;
  add: (kind: MediaKind, data: Record<string, any>, sortOrder: number) => Promise<string>;
  remove: (id: string) => Promise<void>;
}

/**
 * Long edge for gallery uploads. Big enough for a full-width hero on a retina
 * phone, small enough that a dozen photos do not time out on salon wifi — these
 * are stored base64 in a jsonb column, so every byte travels twice.
 *
 * Before/after photos bypass this and go through the cropper instead, which
 * outputs its own fixed frame.
 */
const MAX_LONG_EDGE = 1600;

export function MediaManager({ api }: { api: MediaApi }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [busy, setBusy] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [pairBefore, setPairBefore] = useState('');
  const [pairAfter, setPairAfter] = useState('');
  const [pairLabel, setPairLabel] = useState('');
  const [cropping, setCropping] = useState<{ src: string; caption: string; slot: 'before' | 'after' } | null>(null);

  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImage, setProductImage] = useState('');

  useEffect(() => {
    let live = true;
    api.list()
      .then(items => { if (live) setMedia(items); })
      .catch(err => { if (live) setLoadError(err.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [api]);

  const save = useCallback(
    async (kind: MediaKind, data: Record<string, any>) => {
      setSaveError(null);
      setBusy('Saving…');
      try {
        const id = await api.add(kind, data, media.length);
        setMedia(prev => [...prev, { id, kind, data, sort_order: prev.length }]);
        setPublishing(true);
        return true;
      } catch (err: any) {
        // A failed write is data loss from her side — she took the photo, she
        // pressed the button, and it is gone. Never swallow it.
        setSaveError(err.message);
        return false;
      } finally {
        setBusy('');
      }
    },
    [api, media.length]
  );

  const remove = useCallback(
    async (id: string) => {
      setSaveError(null);
      setBusy('Removing…');
      try {
        await api.remove(id);
        setMedia(prev => prev.filter(m => m.id !== id));
        setPublishing(true);
      } catch (err: any) {
        setSaveError(err.message);
      } finally {
        setBusy('');
      }
    },
    [api]
  );

  const pickImage = useCallback(async (file: File | undefined, onDone: (dataUrl: string) => void) => {
    if (!file) return;
    setSaveError(null);
    setBusy('Processing photo…');
    try {
      onDone(await resizeImage(file, MAX_LONG_EDGE));
    } catch {
      setSaveError('That image could not be read. Please try a different one.');
    } finally {
      setBusy('');
    }
  }, []);

  const addPortfolio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // so picking the same file twice still fires
    for (const file of files) {
      await pickImage(file, async url => { await save('portfolio', { url }); });
    }
  };

  const addPair = async () => {
    if (!pairBefore || !pairAfter) return;
    const ok = await save('beforeAfter', {
      before: pairBefore,
      after: pairAfter,
      label: pairLabel.trim() || undefined,
    });
    if (ok) { setPairBefore(''); setPairAfter(''); setPairLabel(''); }
  };

  const addProduct = async () => {
    if (!productName.trim()) return;
    const ok = await save('product', {
      name: productName.trim(),
      price: productPrice.trim() || undefined,
      image: productImage || undefined,
    });
    if (ok) { setProductName(''); setProductPrice(''); setProductImage(''); }
  };

  const of = (kind: MediaKind) => media.filter(m => m.kind === kind);

  const sectionClass = 'rounded-2xl border border-stone-800 bg-stone-900/60 p-5 sm:p-6 space-y-4';
  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/60';
  const buttonClass =
    'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-amber-500 text-stone-950 disabled:opacity-40 disabled:cursor-not-allowed';

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-stone-400 py-10">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        <span>Loading your photos…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cropping && (
        <ImageCropper
          src={cropping.src}
          caption={cropping.caption}
          onCancel={() => setCropping(null)}
          onDone={cropped => {
            if (cropping.slot === 'before') setPairBefore(cropped);
            else setPairAfter(cropped);
            setCropping(null);
          }}
        />
      )}

      {publishing && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          {/* She pressed a button and nothing on her site changed for several
              minutes. Without this she presses it again, and again. */}
          <span>Saved. Your website is updating now — give it a few minutes to appear.</span>
        </div>
      )}

      {(saveError || loadError) && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{saveError || loadError}</span>
        </div>
      )}

      {busy && (
        <div className="flex items-center gap-3 text-sm text-stone-400" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>{busy}</span>
        </div>
      )}

      {/* --- Portfolio ------------------------------------------------------ */}
      <section className={sectionClass}>
        <div className="flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <h2 className="font-bold">Your work</h2>
        </div>
        <p className="text-xs text-stone-500">
          Photos of finished work. These fill the gallery on your site, and the first one
          becomes your main photo if you do not have one yet.
        </p>

        {of('portfolio').length > 0 && (
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {of('portfolio').map(item => (
              <li key={item.id} className="relative">
                <img src={item.data.url} alt="" className="w-full aspect-square object-cover rounded-lg border border-stone-800" />
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label="Remove this photo"
                  className="absolute top-1 right-1 p-1.5 rounded-lg bg-stone-950/80 text-stone-300 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className={buttonClass + ' cursor-pointer w-full sm:w-auto'}>
          <Upload className="w-4 h-4" aria-hidden="true" />
          <span>Add photos</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={addPortfolio} />
        </label>
      </section>

      {/* --- Before / after -------------------------------------------------- */}
      <section className={sectionClass}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <h2 className="font-bold">Transformations</h2>
        </div>
        <p className="text-xs text-stone-500">
          A before and an after of the same client. Visitors drag between them on your site.
        </p>

        {of('beforeAfter').length > 0 && (
          <ul className="space-y-3">
            {of('beforeAfter').map(item => (
              <li key={item.id} className="flex items-center gap-3 rounded-lg border border-stone-800 p-2">
                <img src={item.data.before} alt="" className="w-16 h-16 object-cover rounded" />
                <img src={item.data.after} alt="" className="w-16 h-16 object-cover rounded" />
                <span className="text-sm flex-1 truncate">{item.data.label || 'Transformation'}</span>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label="Remove this transformation"
                  className="p-2 text-stone-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-2 gap-3">
          {([
            ['Before', pairBefore] as const,
            ['After', pairAfter] as const,
          ]).map(([caption, value]) => (
            <label
              key={caption}
              className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border border-dashed border-stone-700 cursor-pointer overflow-hidden"
            >
              {value ? (
                <img src={value} alt="" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-stone-600" aria-hidden="true" />
                  <span className="text-xs text-stone-500">{caption}</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  // Straight into the cropper: framing is the difference between
                  // a transformation that reads and one that jumps.
                  pickImage(file, src =>
                    setCropping({ src, caption, slot: caption === 'Before' ? 'before' : 'after' })
                  );
                }}
              />
            </label>
          ))}
        </div>

        <p className="text-xs text-stone-600">
          Tap a photo to replace it. Both are framed to the same shape so they line up.
        </p>

        <input
          type="text"
          value={pairLabel}
          onChange={e => setPairLabel(e.target.value)}
          placeholder="What was done? e.g. Balayage and cut"
          className={inputClass}
        />

        <button
          type="button"
          onClick={addPair}
          disabled={!pairBefore || !pairAfter || !!busy}
          className={buttonClass + ' w-full sm:w-auto'}
        >
          Add transformation
        </button>
      </section>

      {/* --- Products -------------------------------------------------------- */}
      <section className={sectionClass}>
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <h2 className="font-bold">Products you sell</h2>
        </div>
        <p className="text-xs text-stone-500">
          Anything you sell in the studio. Leave this empty if you do not sell products.
        </p>

        {of('product').length > 0 && (
          <ul className="space-y-2">
            {of('product').map(item => (
              <li key={item.id} className="flex items-center gap-3 rounded-lg border border-stone-800 p-2">
                {item.data.image && <img src={item.data.image} alt="" className="w-12 h-12 object-cover rounded" />}
                <span className="text-sm flex-1 truncate">{item.data.name}</span>
                {item.data.price && <span className="text-xs text-stone-400">{item.data.price}</span>}
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={'Remove ' + item.data.name}
                  className="p-2 text-stone-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          <input
            type="text"
            value={productName}
            onChange={e => setProductName(e.target.value)}
            placeholder="Product name"
            className={inputClass}
          />
          <input
            type="text"
            value={productPrice}
            onChange={e => setProductPrice(e.target.value)}
            placeholder="Price, e.g. $32"
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-700 text-sm cursor-pointer">
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>{productImage ? 'Change photo' : 'Add photo'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                e.target.value = '';
                pickImage(file, setProductImage);
              }}
            />
          </label>
          {productImage && <img src={productImage} alt="" className="w-10 h-10 object-cover rounded" />}
          <button type="button" onClick={addProduct} disabled={!productName.trim() || !!busy} className={buttonClass}>
            Add product
          </button>
        </div>
      </section>

      <p className="text-xs text-stone-600 text-center pt-2">
        Anything you add or remove here publishes to your website automatically.
      </p>
    </div>
  );
}
