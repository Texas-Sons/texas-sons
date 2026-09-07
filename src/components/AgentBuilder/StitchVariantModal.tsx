import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Check, Loader2, RefreshCw, AlertTriangle, Palette } from 'lucide-react';

/**
 * The two design directions, offered as a choice.
 *
 * Generation happens when the client submits their intake, not here — it takes
 * about a hundred seconds, and an operator opening the Studio should not be the
 * one waiting for it. This screen is normally a read: the directions are
 * already sitting on the intake row by the time anyone looks.
 *
 * It still handles `generating`, because the operator can open the Studio a few
 * seconds after a submission lands, and a spinner that resolves is better than
 * an empty modal that looks broken.
 */

export interface StitchSeeds {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
}

interface Variant {
  name: string;
  seeds: StitchSeeds;
  rationale: string;
  guidelines: string;
  fonts?: { heading: string; body: string };
  screenshotUrl?: string;
}

interface StoredVariants {
  status: 'generating' | 'ready' | 'failed';
  variants?: Variant[];
  chosen?: number | null;
  error?: string;
  generatedAt?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  intakeId?: string;
  businessName: string;
  onApply: (seeds: StitchSeeds, name: string) => void;
}

const POLL_MS = 8000;

export const StitchVariantModal: React.FC<Props> = ({ isOpen, onClose, intakeId, businessName, onApply }) => {
  const [stored, setStored] = useState<StoredVariants | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!intakeId) return;
    try {
      const res = await fetch(`/api/stitch/variants/${encodeURIComponent(intakeId)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Could not load design directions.');
      setConfigured(json.configured !== false);
      setStored(json.variants);
      setError(null);
      return json.variants as StoredVariants | null;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [intakeId]);

  // Poll only while something is actually being generated. A modal that keeps
  // hitting the server after the answer arrived is just noise in the log.
  useEffect(() => {
    if (!isOpen || !intakeId) return;
    let cancelled = false;
    const tick = async () => {
      const v = await load();
      if (cancelled) return;
      if (v?.status === 'generating') timer.current = setTimeout(tick, POLL_MS);
    };
    tick();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [isOpen, intakeId, load]);

  const generate = async () => {
    if (!intakeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stitch/variants/${encodeURIComponent(intakeId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      const json = await res.json();
      if (!res.ok && res.status !== 202) throw new Error(json.error || 'Could not start generation.');
      setStored({ status: 'generating' });
      timer.current = setTimeout(async () => {
        const v = await load();
        if (v?.status === 'generating') timer.current = setTimeout(() => load(), POLL_MS);
      }, POLL_MS);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const choose = async (index: number) => {
    if (!intakeId) return;
    setApplying(index);
    try {
      const res = await fetch(`/api/stitch/variants/${encodeURIComponent(intakeId)}/choose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Could not record that choice.');
      onApply(json.seeds, json.name);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(null);
    }
  };

  if (!isOpen) return null;

  const variants = stored?.variants || [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <Palette className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">Two directions for {businessName}</h2>
              <p className="text-[11px] text-stone-400">
                Pick one and the ground, accent and type pairing are applied. Everything else stays as it is.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!intakeId && (
            <Empty
              title="This project did not come from an intake"
              body="Design directions are generated from what a client submits. Projects started from scratch, and anything created before 30 August 2026, have no intake to read."
            />
          )}

          {intakeId && !configured && (
            <Empty
              title="Stitch is not configured on the server"
              body="STITCH_API_KEY is missing, so no directions can be generated. Everything else about this project works exactly as before."
            />
          )}

          {intakeId && configured && error && (
            <div className="flex items-start gap-2.5 p-3 mb-4 rounded-lg bg-red-950/40 border border-red-900/60 text-red-200 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {intakeId && configured && stored?.status === 'generating' && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
              <p className="text-sm text-stone-300">Stitch is drawing two directions.</p>
              <p className="text-xs text-stone-500 max-w-sm">
                This takes around two minutes. You can close this and carry on — the directions will be waiting next
                time you open the Studio.
              </p>
            </div>
          )}

          {intakeId && configured && stored?.status === 'failed' && (
            <Empty
              title="Stitch could not produce a direction"
              body={stored.error || 'No further detail was returned.'}
            />
          )}

          {intakeId && configured && !stored && (
            <Empty
              title="No directions yet"
              body="This intake was taken before design directions existed, or generation was never started."
            />
          )}

          {variants.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variants.map((v, i) => (
                <VariantCard
                  key={i}
                  variant={v}
                  isChosen={stored?.chosen === i}
                  isApplying={applying === i}
                  onChoose={() => choose(i)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between gap-4">
          <span className="text-[11px] text-stone-500">
            {stored?.generatedAt ? `Generated ${new Date(stored.generatedAt).toLocaleString()}` : 'Nothing generated yet'}
          </span>
          <button
            onClick={generate}
            disabled={!intakeId || !configured || loading || stored?.status === 'generating'}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 text-stone-200 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {variants.length ? 'Generate two more' : 'Generate directions'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Empty: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
    <p className="text-sm font-medium text-stone-200">{title}</p>
    <p className="text-xs text-stone-500 max-w-md">{body}</p>
  </div>
);

const VariantCard: React.FC<{
  variant: Variant;
  isChosen: boolean;
  isApplying: boolean;
  onChoose: () => void;
}> = ({ variant, isChosen, isApplying, onChoose }) => (
  <div
    className={`flex flex-col rounded-xl border overflow-hidden bg-stone-950 transition-colors ${
      isChosen ? 'border-orange-500' : 'border-stone-800 hover:border-stone-700'
    }`}
  >
    <div className="aspect-[4/3] bg-stone-900 overflow-hidden flex items-center justify-center">
      {variant.screenshotUrl ? (
        <img
          src={variant.screenshotUrl}
          alt={`${variant.name} preview`}
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />
      ) : (
        <span className="text-[11px] text-stone-600">No preview returned</span>
      )}
    </div>

    <div className="p-4 flex flex-col gap-3 flex-1">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white truncate">{variant.name}</h3>
        {isChosen && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-400 flex-shrink-0">
            <Check className="w-3 h-3" /> In use
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-stone-400">
        <Swatch hex={variant.seeds.primaryColor} label="ground" />
        <Swatch hex={variant.seeds.accentColor} label="accent" />
        <span className="truncate">{variant.seeds.fontFamily}</span>
      </div>

      {variant.fonts?.heading && (
        <p className="text-[11px] text-stone-500">
          Stitch asked for {variant.fonts.heading}
          {variant.fonts.body && variant.fonts.body !== variant.fonts.heading ? ` over ${variant.fonts.body}` : ''}.
        </p>
      )}

      {variant.rationale && (
        <p className="text-xs text-stone-400 leading-relaxed line-clamp-4">
          {variant.rationale.replace(/[*#`]/g, '').slice(0, 260)}
        </p>
      )}

      <button
        onClick={onChoose}
        disabled={isApplying}
        className="mt-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-50 transition-colors"
      >
        {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {isChosen ? 'Apply again' : 'Use this direction'}
      </button>
    </div>
  </div>
);

const Swatch: React.FC<{ hex: string; label: string }> = ({ hex, label }) => (
  <span className="inline-flex items-center gap-1.5" title={`${label} ${hex}`}>
    <span className="w-4 h-4 rounded border border-stone-700 flex-shrink-0" style={{ background: hex }} />
    <span className="font-mono text-[10px]">{hex}</span>
  </span>
);

export default StitchVariantModal;
