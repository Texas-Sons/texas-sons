/**
 * Pairs client intakes with the projects built from them.
 *
 * Two tables, two stages of the same relationship: `client_intakes` is what a
 * client sent before anything was built, `projects` is the site that went live.
 * They were never linked — handleLaunchStudioFromClient minted a fresh id and
 * kept no reference — so the same salon appeared as two unrelated rows in two
 * separate tabs, and nothing could tell they were the same business.
 *
 * From 2026-08-30 a new project carries `blueprint.intakeId`. Everything created
 * before that does not, which is why this falls back to matching on name.
 *
 * The distinction between a real link and an inferred one is preserved rather
 * than smoothed over. A name match is a guess, and the UI should be able to say
 * so: quietly merging two different clients who happen to trade under similar
 * names would put one salon's photos on another's site.
 */

export interface IntakeLike {
  id: string;
  businessName?: string;
  [key: string]: any;
}

export interface ProjectLike {
  id: string;
  companyName?: string;
  blueprint?: { intakeId?: string; [key: string]: any } | null;
  [key: string]: any;
}

export type LinkKind =
  /** The project records the intake it was built from. Certain. */
  | 'linked'
  /** Paired because the names match and nothing else claimed either. A guess. */
  | 'inferred'
  /** Only one half exists. */
  | 'none';

export interface MergedClient {
  /** Stable across renders and unique within a result set. */
  key: string;
  name: string;
  intake?: IntakeLike;
  project?: ProjectLike;
  link: LinkKind;
}

/**
 * Normalises a business name for comparison.
 *
 * Case and punctuation vary between what a client typed on an intake form and
 * what the operator typed in the Studio — "Opalescent Color Studio" against
 * "opalescent color studio." should pair. Everything beyond that is left alone:
 * stripping words like "studio" or "salon" would collapse genuinely different
 * businesses on the same street.
 */
export function normalizeName(name: unknown): string {
  return String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Builds an intake-shaped view of a project that has no intake behind it.
 *
 * Sites started from scratch in the Studio have no dossier, but they are still
 * clients and belong in the same list. Rather than a second card component for
 * them — which would drift from the first, the way ClientApp and the Studio
 * preview did — the project is presented in the shape the card already renders.
 *
 * Marked `derived` so the card can say the dossier is missing instead of
 * implying an intake was filled in. Never persisted: this is a view model.
 */
export function intakeFromProject(project: ProjectLike): IntakeLike {
  const profile = (project.blueprint as any)?.profile || {};
  return {
    id: 'derived:' + project.id,
    derived: true,
    businessName: project.companyName || profile.name || 'Untitled',
    clientContact: project.clientName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    address: profile.address || '',
    domain: project.domain || '',
    category: profile.category || '',
    tagline: profile.tagline || '',
    description: profile.description || '',
    accentColor: profile.accentColor || '',
    heroImage: profile.heroImage || '',
    status: project.status || 'Live',

    // The card reads these to describe the client, and a project-only row was
    // handing it nothing: a live salon with nine services on it reported "0
    // Offerings, 0 Badges" and left Tier and Theme blank, because this function
    // stopped at the contact details. The dossier is what is missing for these
    // clients, not the content — the site itself has all of it.
    tier: project.tier,
    theme: (project.blueprint as any)?.theme,
    services: (project.blueprint as any)?.services,
    badges: (project.blueprint as any)?.badges,
    proofBadgeText: profile.proofBadgeText,
    logoUrl: profile.logoUrl,
    bookingUrl: profile.bookingUrl,
    primaryColor: profile.primaryColor,
  };
}

export function mergeClients(
  intakes: IntakeLike[],
  projects: ProjectLike[]
): MergedClient[] {
  const merged: MergedClient[] = [];
  const usedProjects = new Set<string>();
  const usedIntakes = new Set<string>();

  // Pass 1 — real links. These are certain and must win, so they are claimed
  // before any name matching gets a chance to steal either side.
  const byIntakeId = new Map<string, ProjectLike>();
  for (const project of projects) {
    const id = project.blueprint?.intakeId;
    if (id && !byIntakeId.has(id)) byIntakeId.set(id, project);
  }

  for (const intake of intakes) {
    const project = byIntakeId.get(intake.id);
    if (!project) continue;
    usedIntakes.add(intake.id);
    usedProjects.add(project.id);
    merged.push({
      key: 'linked:' + intake.id,
      name: intake.businessName || project.companyName || 'Untitled',
      intake,
      project,
      link: 'linked',
    });
  }

  // Pass 2 — name matching, over what is left.
  //
  // A name claimed by more than one unpaired intake is left unpaired entirely.
  // Picking one arbitrarily would be a coin flip whose losing side puts a
  // client's content under another client's name, and two rows that are
  // obviously unmerged are a far better outcome than one row that is wrong.
  const remainingIntakes = intakes.filter(i => !usedIntakes.has(i.id));
  const intakesByName = new Map<string, IntakeLike[]>();
  for (const intake of remainingIntakes) {
    const key = normalizeName(intake.businessName);
    if (!key) continue;
    const list = intakesByName.get(key);
    if (list) list.push(intake);
    else intakesByName.set(key, [intake]);
  }

  for (const project of projects) {
    if (usedProjects.has(project.id)) continue;
    const key = normalizeName(project.companyName);
    const candidates = key ? intakesByName.get(key) : undefined;

    if (candidates && candidates.length === 1 && !usedIntakes.has(candidates[0].id)) {
      const intake = candidates[0];
      usedIntakes.add(intake.id);
      usedProjects.add(project.id);
      merged.push({
        key: 'inferred:' + project.id,
        name: project.companyName || intake.businessName || 'Untitled',
        intake,
        project,
        link: 'inferred',
      });
    }
  }

  // Pass 3 — whatever is left stands alone. An intake with no site yet is the
  // normal state of a new client; a site with no intake is normal for anything
  // started from scratch in the Studio.
  for (const project of projects) {
    if (usedProjects.has(project.id)) continue;
    merged.push({
      key: 'project:' + project.id,
      name: project.companyName || 'Untitled',
      project,
      link: 'none',
    });
  }
  for (const intake of intakes) {
    if (usedIntakes.has(intake.id)) continue;
    merged.push({
      key: 'intake:' + intake.id,
      name: intake.businessName || 'Untitled',
      intake,
      link: 'none',
    });
  }

  return merged.sort((a, b) => a.name.localeCompare(b.name));
}
