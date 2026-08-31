import React from 'react';
import { AlertTriangle, CheckCircle2, CloudOff, Clock } from 'lucide-react';
import { STAGE_LABEL, type StageResult } from '../../utils/clientStage';

/**
 * The one-line status of a client, on their card.
 *
 * Answers the three questions the list could not: what stage is this, are
 * customers seeing my latest work, and is anything on it untrue.
 *
 * The middle one caused a real incident. Saved and published are different
 * facts, nothing showed the difference, and a blueprint that had drifted from
 * the live site sat waiting until a client's photo upload republished it over
 * her working site.
 */

export interface ClientStatusStripProps {
  state: StageResult;
  engagement: 'demo' | 'commissioned';
  /** Undefined when the caller cannot change it, e.g. a dossier with no site. */
  onEngagementChange?: (next: 'demo' | 'commissioned') => void;
}

export function ClientStatusStrip({ state, engagement, onEngagementChange }: ClientStatusStripProps) {
  const chip = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`${chip} ${
          state.stage === 'commissioned'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : state.stage === 'demo'
              ? 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/30'
              : 'bg-stone-800 text-stone-400 border-stone-700'
        }`}>
          {STAGE_LABEL[state.stage]}
        </span>

        {state.stage !== 'dossier' && (
          <span className={`${chip} ${
            state.publish === 'stale'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : state.publish === 'never'
                ? 'bg-stone-800 text-stone-500 border-stone-700'
                : 'bg-stone-800/60 text-stone-500 border-stone-800'
          }`}>
            {state.publish === 'stale' ? (
              <><Clock className="w-2.5 h-2.5" />Edits not published</>
            ) : state.publish === 'never' ? (
              <><CloudOff className="w-2.5 h-2.5" />Never published</>
            ) : (
              <><CheckCircle2 className="w-2.5 h-2.5" />Live is current</>
            )}
          </span>
        )}

        {/* The demo/commissioned switch lives here rather than in a settings
            screen because flipping it is a real moment in the relationship —
            it is when placeholder data stops being acceptable — and a moment
            with no place in the UI is a moment that gets skipped. */}
        {onEngagementChange && (
          <button
            type="button"
            onClick={() => onEngagementChange(engagement === 'demo' ? 'commissioned' : 'demo')}
            title={
              engagement === 'demo'
                ? 'Mark as a paying client. Turns on the checks that matter once real customers arrive.'
                : 'Move back to demo. Missing data stops being flagged.'
            }
            className="text-[10px] font-bold text-stone-500 hover:text-stone-200 underline decoration-dotted underline-offset-2 ml-auto"
          >
            {engagement === 'demo' ? 'Mark commissioned' : 'Back to demo'}
          </button>
        )}
      </div>

      {state.issues.length > 0 && (
        <div
          className={`flex items-start gap-2 rounded-lg px-2.5 py-2 text-[11px] border ${
            state.hasClaimIssues
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 mt-px flex-shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            {state.hasClaimIssues && (
              <p className="font-bold">
                This says things about their business that nobody checked.
              </p>
            )}
            <ul className="space-y-0.5">
              {state.issues.slice(0, 3).map(issue => (
                <li key={issue.field}>{issue.message}</li>
              ))}
            </ul>
            {state.issues.length > 3 && (
              <p className="opacity-70">and {state.issues.length - 3} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
