-- What is actually live, recorded at publish time.
--
-- The client portal's auto-redeploy republished `projects.blueprint`, treating
-- it as the source of truth for a client's live site. It is not. That column is
-- written by persistProject, which runs only when the operator deploys from the
-- Studio, so any tuning that was not followed by a Studio deploy never reached
-- it. On 2026-08-31 a client uploaded one photo, the redeploy fired, and her
-- live site was replaced with a materially older blueprint — different colours,
-- and the work since that row was written simply gone.
--
-- The redeploy needs the blueprint that is on the site right now, not the one
-- someone last happened to save. That is a different fact and it needs its own
-- column: a photo upload should change the photos and nothing else.

alter table if exists public.projects
  add column if not exists published_blueprint jsonb;

alter table if exists public.projects
  add column if not exists published_at timestamptz;

-- Backfill is deliberately NOT done here.
--
-- Copying `blueprint` into `published_blueprint` would assert that the stale row
-- is what is live, which is exactly the false belief that caused the incident.
-- A null means "nothing has been published through the new path yet", and the
-- server treats that as a reason to refuse an unattended redeploy rather than
-- to guess. The first operator-initiated publish fills it in truthfully.

comment on column public.projects.published_blueprint is
  'The exact blueprint last pushed to the live site. Written only by a publish. Never edited.';
comment on column public.projects.published_at is
  'When published_blueprint was last pushed.';
