import { Octokit } from '@octokit/rest';

/**
 * Obsidian vault reader.
 *
 * The assistant already loads a fixed set of operating-manual files from disk
 * (`context/`, `references/`). Those work because there are five of them and
 * they are always relevant, so they can all be pasted into every prompt.
 *
 * A personal knowledge vault is the opposite: hundreds of notes, of which two or
 * three matter for any given question. Stuffing all of it into the prompt would
 * be expensive and would bury the signal. So this retrieves.
 *
 * The vault lives in a private GitHub repo rather than on this server's disk,
 * for a reason worth stating: Railway containers are ephemeral. Anything written
 * to local disk vanishes on the next deploy. GitHub gives sync across every
 * device through the Obsidian Git plugin, version history for free, and a read
 * path that works identically from local dev and production.
 *
 * Retrieval is deliberately keyword scoring, not embeddings. A few hundred
 * personal notes with meaningful filenames are well served by it, and it has no
 * index to build, no vector store to run, and no cost per query. Move to
 * embeddings when this is demonstrably not good enough — not before.
 */

export interface VaultNote {
  /** Repo-relative path, e.g. 'clients/opalescent.md'. */
  path: string;
  /** Filename without directory or extension — the Obsidian note title. */
  title: string;
  text: string;
}

export interface VaultConfig {
  /** 'owner/repo' — the private repo holding the vault. */
  repo: string;
  branch: string;
  token: string;
}

/** Vault reading is off unless a repo is configured. Absence is not an error. */
export function getVaultConfig(): VaultConfig | null {
  const repo = process.env.OBSIDIAN_VAULT_REPO;
  const token = process.env.GITHUB_ACCESS_TOKEN;
  if (!repo || !token) return null;
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) {
    console.warn(
      `[vault] Ignoring OBSIDIAN_VAULT_REPO="${repo}" — expected "owner/repo".`
    );
    return null;
  }
  return { repo, branch: process.env.OBSIDIAN_VAULT_BRANCH || 'main', token };
}

/**
 * Caps. A vault is personal and small, but it is user-controlled and grows
 * without anyone deciding to let it, so every dimension is bounded.
 */
const MAX_FILES = 400;
const MAX_FILE_BYTES = 100_000;
const CACHE_TTL_MS = 5 * 60_000;

/** How much retrieved note text the prompt will carry. */
const PROMPT_CHAR_BUDGET = 12_000;

let cache: { notes: VaultNote[]; expiresAt: number } | null = null;

/** Drops the cached vault. Used by tests and by an explicit refresh. */
export function clearVaultCache(): void {
  cache = null;
}

function titleOf(path: string): string {
  const base = path.split('/').pop() || path;
  return base.replace(/\.md$/i, '');
}

/**
 * Splits a question into terms worth matching on.
 *
 * Stopwords are stripped because they otherwise dominate the score — every note
 * contains "the", so a query full of them ranks the vault in arbitrary order.
 */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'what', 'when', 'where',
  'which', 'have', 'has', 'was', 'were', 'are', 'you', 'your', 'about', 'how',
  'why', 'can', 'did', 'does', 'should', 'would', 'could', 'into', 'out', 'get',
  'any', 'all', 'not', 'but', 'its', 'it', 'is', 'do', 'me', 'my', 'i', 'a', 'an',
  'of', 'to', 'in', 'on', 'at', 'by', 'or', 'if', 'be', 'as', 'so', 'we', 'us',
]);

export function queryTerms(query: string): string[] {
  const seen = new Set<string>();
  for (const raw of (query || '').toLowerCase().split(/[^a-z0-9']+/)) {
    const term = raw.replace(/^'+|'+$/g, '');
    if (term.length < 3 || STOPWORDS.has(term)) continue;
    seen.add(term);
  }
  return [...seen];
}

/**
 * Scores one note against the query terms.
 *
 * A term in the title counts for far more than a term in the body: an Obsidian
 * user who names a note "Opalescent pricing" has said what it is about, and that
 * is a much stronger signal than the word appearing once in a paragraph. Body
 * hits are counted but damped, so a long note cannot outrank a precisely-named
 * short one purely by being long.
 */
export function scoreNote(note: VaultNote, terms: string[]): number {
  if (terms.length === 0) return 0;
  const title = note.title.toLowerCase();
  const body = note.text.toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (title.includes(term)) score += 10;
    const hits = body.split(term).length - 1;
    if (hits > 0) score += Math.min(5, 1 + Math.log2(hits));
  }
  return score;
}

/** Ranks notes and takes the best few that fit the character budget. */
export function selectNotes(
  notes: VaultNote[],
  query: string,
  maxNotes = 5,
  charBudget = PROMPT_CHAR_BUDGET
): VaultNote[] {
  const terms = queryTerms(query);
  if (terms.length === 0) return [];

  const ranked = notes
    .map(note => ({ note, score: scoreNote(note, terms) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.note.path.localeCompare(b.note.path));

  const chosen: VaultNote[] = [];
  let used = 0;
  for (const { note } of ranked) {
    if (chosen.length >= maxNotes) break;
    const remaining = charBudget - used;
    // No point including a note we can only show a sentence of.
    if (remaining < 500) break;
    const text = note.text.length > remaining
      ? `${note.text.slice(0, remaining)}\n…(truncated)`
      : note.text;
    chosen.push({ ...note, text });
    used += text.length;
  }
  return chosen;
}

/** Fetches and caches every markdown note in the vault. */
export async function loadVault(config: VaultConfig): Promise<VaultNote[]> {
  if (cache && Date.now() < cache.expiresAt) return cache.notes;

  const [owner, repo] = config.repo.split('/');
  const octokit = new Octokit({ auth: config.token });

  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: config.branch,
    recursive: 'true',
  });

  const files = (tree.tree || [])
    .filter(
      entry =>
        entry.type === 'blob' &&
        typeof entry.path === 'string' &&
        /\.md$/i.test(entry.path) &&
        // Obsidian's own config and trash are not knowledge.
        !entry.path.startsWith('.obsidian/') &&
        !entry.path.startsWith('.trash/') &&
        (entry.size ?? 0) <= MAX_FILE_BYTES
    )
    .slice(0, MAX_FILES);

  if (tree.truncated) {
    console.warn('[vault] GitHub truncated the tree listing — some notes are not visible.');
  }

  const notes: VaultNote[] = [];
  for (const entry of files) {
    try {
      const { data } = await octokit.git.getBlob({ owner, repo, file_sha: entry.sha! });
      const text = Buffer.from(data.content, data.encoding as BufferEncoding).toString('utf8');
      notes.push({ path: entry.path!, title: titleOf(entry.path!), text });
    } catch (error: any) {
      // One unreadable note must not cost the assistant the whole vault.
      console.warn(`[vault] Could not read ${entry.path}: ${error?.message || error}`);
    }
  }

  cache = { notes, expiresAt: Date.now() + CACHE_TTL_MS };
  return notes;
}

/** Formats selected notes for the system prompt. */
export function formatNotes(notes: VaultNote[]): string {
  if (notes.length === 0) return '';
  const body = notes
    .map(note => `--- ${note.path} ---\n${note.text.trim()}`)
    .join('\n\n');
  return [
    '## From his Obsidian vault',
    'Notes he wrote himself, retrieved because they look relevant to this question.',
    'They are his own record and may be out of date — prefer them for his intent and',
    'his decisions, but do not treat them as current fact about the codebase.',
    '',
    body,
  ].join('\n');
}

/**
 * The entry point: retrieve vault context for a question.
 *
 * Returns '' when the vault is unconfigured, unreachable, or has nothing
 * matching. A knowledge base that is down should make the assistant less
 * informed, never broken — this is additive context, not a dependency.
 */
export async function vaultContextFor(query: string): Promise<string> {
  const config = getVaultConfig();
  if (!config) return '';
  try {
    const notes = await loadVault(config);
    return formatNotes(selectNotes(notes, query));
  } catch (error: any) {
    console.warn(`[vault] Retrieval failed: ${error?.message || error}`);
    return '';
  }
}
