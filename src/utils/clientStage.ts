import { issuesFor, type BlueprintIssue, type Engagement } from './blueprintHealth';

/**
 * Where a client is in the pipeline, and what to do about them next.
 *
 * The Clients list offered every action on every card regardless of stage — a
 * dossier with no site showed an invoice button, a live commissioned site
 * showed "Launch in 1-Click Studio" as its most prominent control. Eight equal
 * buttons is not a workflow; it is a pile, and the operator has to hold the
 * order in their head every time.
 *
 * This decides which single action leads. It does not decide what is *available*
 * — everything stays reachable on the card, just quieter. A tool that hides the
 * button you wanted gets worked around rather than trusted.
 *
 * Pure, so the sequencing can be tested without rendering anything.
 */

export type Stage =
  /** A dossier with no site built yet. */
  | 'dossier'
  /** A site exists but has never been published. */
  | 'draft'
  /** A published demo — something to show a prospect. */
  | 'demo'
  /** A paying client's live site. */
  | 'commissioned';

export type ActionId =
  | 'launch-studio'
  | 'publish'
  | 'proposal'
  | 'client-access'
  | 'edit-studio';

export type PublishState =
  /** Never published through the recording path. */
  | 'never'
  /** Published, and nothing has been edited since. */
  | 'current'
  /** Edited after the last publish, so customers are seeing something older. */
  | 'stale';

export interface StageInput {
  project?: {
    engagement?: Engagement;
    publishedAt?: string;
    updatedAt?: string;
    blueprint?: any;
  } | null;
}

export interface StageResult {
  stage: Stage;
  publish: PublishState;
  /** The one action that leads. Everything else stays on the card. */
  primary: ActionId;
  /** Only what is worth showing at this stage — see issuesFor. */
  issues: BlueprintIssue[];
  /** Claims are never acceptable, in a demo least of all. */
  hasClaimIssues: boolean;
}

export function publishStateOf(project: StageInput['project']): PublishState {
  if (!project?.publishedAt) return 'never';
  const published = Date.parse(project.publishedAt);
  const updated = Date.parse(project.updatedAt || '');
  if (!Number.isFinite(published)) return 'never';
  if (!Number.isFinite(updated)) return 'current';

  // A second of slack. saveProject and the publish write their own timestamps
  // moments apart, and a publish that immediately reports "not published"
  // teaches the operator to ignore the label.
  return updated - published > 1000 ? 'stale' : 'current';
}

export function stageOf(input: StageInput): StageResult {
  const project = input.project;
  const engagement: Engagement = project?.engagement === 'commissioned' ? 'commissioned' : 'demo';
  const publish = publishStateOf(project);

  const issues = issuesFor(project?.blueprint, engagement);
  const hasClaimIssues = issues.some(i => i.category === 'claim');

  if (!project) {
    return { stage: 'dossier', publish, primary: 'launch-studio', issues: [], hasClaimIssues: false };
  }

  if (publish === 'never') {
    return { stage: 'draft', publish, primary: 'publish', issues, hasClaimIssues };
  }

  if (engagement === 'commissioned') {
    // Live and paid for. The recurring work is her content and her people;
    // unpublished edits outrank that, because customers are seeing the old one.
    return {
      stage: 'commissioned',
      publish,
      primary: publish === 'stale' ? 'publish' : 'client-access',
      issues,
      hasClaimIssues,
    };
  }

  // A published demo. The next step is not another edit — it is asking for the
  // job. Unpublished changes still come first, since the point of a demo is
  // that the link shows what you just built.
  return {
    stage: 'demo',
    publish,
    primary: publish === 'stale' ? 'publish' : 'proposal',
    issues,
    hasClaimIssues,
  };
}

/** Short label for the stage chip. */
export const STAGE_LABEL: Record<Stage, string> = {
  dossier: 'Dossier',
  draft: 'Not published',
  demo: 'Demo',
  commissioned: 'Client',
};
