/**
 * The store layer — every piece of business data goes through here.
 *
 * Rule for components: do not call localStorage directly for business data, and
 * do not call supabase.from(...) directly either. Import a repo from here.
 * localStorage is still fine for UI preferences (current view, form prefill,
 * last search terms) — those are per-browser by design.
 *
 * Each repo treats Supabase as the source of truth and localStorage as a
 * write-through cache, so a dropped connection degrades to stale-but-present
 * data rather than a blank screen.
 */

export * from './core';
export * from './blueprints';
export * from './prospects';
export * from './settings';
export * from './studio';
export * from './intakes';
export * from './projects';
export * from './leads';
export { runBackfill, resetBackfillMarker } from './backfill';
