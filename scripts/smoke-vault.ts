/**
 * Vault retrieval smoke test.
 *
 * Exercises the selection logic only — no network, no GitHub token. What can
 * actually be wrong here is the ranking: retrieving the wrong notes is silent,
 * because the assistant simply answers using whatever it was handed and sounds
 * just as confident either way. A test that only checked "it returned some
 * notes" would pass on a completely broken scorer.
 */

import {
  queryTerms,
  scoreNote,
  selectNotes,
  formatNotes,
  getVaultConfig,
  type VaultNote,
} from '../lib/vault';

let failures = 0;
function check(label: string, condition: boolean, detail?: string) {
  if (!condition) {
    failures++;
    console.error(`  FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const note = (path: string, text: string): VaultNote => ({
  path,
  title: (path.split('/').pop() || path).replace(/\.md$/i, ''),
  text,
});

const VAULT: VaultNote[] = [
  note(
    'clients/opalescent-pricing.md',
    'Balayage starts at 220. Colour correction is quoted per consult. She takes a 50 deposit through Square.'
  ),
  note(
    'clients/trevino-campaign.md',
    'Judicial campaign. Treasurer is Joseph S. Boyle. No booking, no retail, election code disclaimers required.'
  ),
  note(
    'ops/deploy-runbook.md',
    'Cloudflare Pages direct upload. Railway hosts the server. Run the migrations before the portal will answer.'
  ),
  note('daily/2026-08-14.md', 'Called three salons. Nobody answered. Wrote some notes about the weather.'),
];

// --- configuration ----------------------------------------------------------

{
  const saved = {
    repo: process.env.OBSIDIAN_VAULT_REPO,
    vaultToken: process.env.VAULT_GITHUB_TOKEN,
    sharedToken: process.env.GITHUB_ACCESS_TOKEN,
  };
  const set = (repo?: string, vaultToken?: string, sharedToken?: string) => {
    if (repo === undefined) delete process.env.OBSIDIAN_VAULT_REPO;
    else process.env.OBSIDIAN_VAULT_REPO = repo;
    if (vaultToken === undefined) delete process.env.VAULT_GITHUB_TOKEN;
    else process.env.VAULT_GITHUB_TOKEN = vaultToken;
    if (sharedToken === undefined) delete process.env.GITHUB_ACCESS_TOKEN;
    else process.env.GITHUB_ACCESS_TOKEN = sharedToken;
  };

  set(undefined, 'v', 's');
  check('no repo means the vault is simply off', getVaultConfig() === null);

  set('owner/repo', undefined, undefined);
  check('no token means off, not a crash', getVaultConfig() === null);

  // A malformed value must disable the vault rather than be pasted into a URL.
  set('just-a-folder-name', 'v', undefined);
  check('a value that is not owner/repo is rejected', getVaultConfig() === null);

  set('Texas-Sons/vault', 'vault-token', 'shared-token');
  check('the dedicated token wins over the shared one', getVaultConfig()?.token === 'vault-token');

  set('Texas-Sons/vault', undefined, 'shared-token');
  check('falls back to the shared token', getVaultConfig()?.token === 'shared-token');
  check('branch defaults to main', getVaultConfig()?.branch === 'main');

  set(saved.repo, saved.vaultToken, saved.sharedToken);
}

// --- query parsing ----------------------------------------------------------

{
  const terms = queryTerms('What should I charge for balayage?');
  check('stopwords are dropped', !terms.includes('what') && !terms.includes('for'), terms.join(','));
  check('content words survive', terms.includes('balayage') && terms.includes('charge'), terms.join(','));
  check('short tokens are dropped', !terms.includes('i'), terms.join(','));

  check('an empty query yields no terms', queryTerms('').length === 0);
  // Otherwise every stopword-only question retrieves an arbitrary five notes and
  // presents them to the model as relevant.
  check('a stopword-only query yields no terms', queryTerms('what is it about?').length === 0);
}

// --- scoring ----------------------------------------------------------------

{
  const terms = queryTerms('opalescent pricing');
  const titleHit = scoreNote(VAULT[0], terms);
  const noHit = scoreNote(VAULT[3], terms);
  check('a title match scores', titleHit > 0, `scored ${titleHit}`);
  check('an unrelated note scores zero', noHit === 0, `scored ${noHit}`);

  // A long note repeating a word must not outrank a note that is *named* for it.
  const spammy = note('daily/rambling.md', `${'balayage '.repeat(400)}`);
  const named = note('clients/balayage.md', 'Short note.');
  const t = queryTerms('balayage');
  check(
    'title relevance beats repetition',
    scoreNote(named, t) > scoreNote(spammy, t),
    `named=${scoreNote(named, t)} spammy=${scoreNote(spammy, t)}`
  );
}

// --- selection --------------------------------------------------------------

{
  const picked = selectNotes(VAULT, 'what does opalescent charge for balayage');
  check('the right note is retrieved', picked[0]?.path === 'clients/opalescent-pricing.md', picked[0]?.path);
  check('irrelevant notes are excluded', !picked.some(n => n.path === 'daily/2026-08-14.md'));

  const campaign = selectNotes(VAULT, 'who is the treasurer on the trevino campaign');
  check('a different question retrieves a different note', campaign[0]?.path === 'clients/trevino-campaign.md', campaign[0]?.path);

  check('no query matches nothing', selectNotes(VAULT, '').length === 0);
  check('an unmatched query returns nothing', selectNotes(VAULT, 'submarine periscope').length === 0);

  const capped = selectNotes(VAULT, 'opalescent trevino deploy railway square', 2);
  check('the note cap is honoured', capped.length <= 2, `got ${capped.length}`);
}

// --- budget -----------------------------------------------------------------

{
  const big = [note('big/one.md', 'balayage '.repeat(2000)), note('big/two.md', 'balayage '.repeat(2000))];
  const picked = selectNotes(big, 'balayage', 5, 3000);
  const total = picked.reduce((sum, n) => sum + n.text.length, 0);
  // An unbounded vault would otherwise silently blow up the prompt, and the
  // first anyone hears of it is the bill.
  check('the character budget is respected', total <= 3200, `used ${total}`);
  check('truncation is disclosed to the model', picked.some(n => n.text.includes('truncated')));
}

// --- formatting -------------------------------------------------------------

{
  check('no notes produce no prompt section', formatNotes([]) === '');

  const out = formatNotes(selectNotes(VAULT, 'opalescent pricing'));
  check('the note path is cited', out.includes('clients/opalescent-pricing.md'));
  check('the content is present', out.includes('Balayage starts at 220'));
  // The model must know these are his own notes, not verified fact, or it will
  // quote a stale price back at him as though it checked.
  check('provenance is stated', out.toLowerCase().includes('may be out of date'));
}

if (failures > 0) {
  console.error(`\nVAULT SMOKE FAILED: ${failures} check(s)`);
  process.exit(1);
}
console.log(
  'VAULT SMOKE PASS: config falls back and rejects malformed repos, stopwords dropped, titles outrank repetition, questions retrieve their own notes, budget and provenance hold'
);
