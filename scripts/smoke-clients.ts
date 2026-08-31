/**
 * Client merge smoke test.
 *
 * The merge decides which intake belongs to which live site. Getting it wrong is
 * not a display bug: the merged row carries the actions, so a mispaired client
 * means opening the Studio on the wrong site, or sending one salon the photo
 * link for another. The ambiguity cases below are the ones that matter.
 */

import { mergeClients, normalizeName, intakeFromProject } from '../src/utils/clientMerge';

let failures = 0;
function check(label: string, condition: boolean, detail?: string) {
  if (!condition) {
    failures++;
    console.error(`  FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const intake = (id: string, businessName: string) => ({ id, businessName });
const project = (id: string, companyName: string, intakeId?: string) => ({
  id,
  companyName,
  blueprint: intakeId ? { intakeId } : {},
});

// --- normalisation ----------------------------------------------------------

check('case and punctuation are ignored',
  normalizeName('Opalescent Color Studio.') === normalizeName('opalescent  color studio'));
check('empty stays empty', normalizeName(undefined) === '');
// Stripping words like "salon" would collapse two real businesses on one street.
check('meaningful words are kept',
  normalizeName('Opal Salon') !== normalizeName('Opal Studio'));

// --- a real link wins -------------------------------------------------------

{
  const out = mergeClients(
    [intake('ci-1', 'Opalescent Color Studio')],
    [project('prj-1', 'Opalescent Color Studio', 'ci-1')]
  );
  check('one row for a linked pair', out.length === 1, `got ${out.length}`);
  check('marked as linked', out[0]?.link === 'linked', out[0]?.link);
  check('carries both halves', !!out[0]?.intake && !!out[0]?.project);
}

// A recorded link must beat a name that points somewhere else. Otherwise
// renaming a business in the Studio would silently re-pair it.
{
  const out = mergeClients(
    [intake('ci-1', 'Opalescent Color Studio'), intake('ci-2', 'Renamed Studio')],
    [project('prj-1', 'Renamed Studio', 'ci-1')]
  );
  const linked = out.find(m => m.link === 'linked');
  check('the recorded link beats the matching name', linked?.intake?.id === 'ci-1', linked?.intake?.id);
  check('the other intake stands alone', out.some(m => m.intake?.id === 'ci-2' && !m.project));
}

// --- name matching, for everything built before the link existed -------------

{
  const out = mergeClients(
    [intake('ci-1', 'Opalescent Color Studio')],
    [project('prj-1', 'opalescent color studio.')]
  );
  check('legacy rows pair on name', out.length === 1, `got ${out.length}`);
  check('the guess is labelled a guess', out[0]?.link === 'inferred', out[0]?.link);
}

// --- ambiguity is left unmerged, never guessed ------------------------------

{
  // Two intakes under the same trading name. Picking one is a coin flip whose
  // losing side puts a client's content under another client's name.
  const out = mergeClients(
    [intake('ci-1', 'Texas Cuts'), intake('ci-2', 'Texas Cuts')],
    [project('prj-1', 'Texas Cuts')]
  );
  check('an ambiguous name pairs nothing', out.every(m => m.link !== 'inferred'),
    out.map(m => m.link).join(','));
  check('nothing is lost to ambiguity', out.length === 3, `got ${out.length}`);
}

{
  // Two projects, one intake: the first project may pair, the second must not
  // steal an intake already claimed.
  const out = mergeClients(
    [intake('ci-1', 'Texas Cuts')],
    [project('prj-1', 'Texas Cuts'), project('prj-2', 'Texas Cuts')]
  );
  const paired = out.filter(m => m.intake && m.project);
  check('one intake is used at most once', paired.length <= 1, `paired ${paired.length}`);
  check('both projects still appear', out.filter(m => m.project).length === 2);
}

// --- standalone rows --------------------------------------------------------

{
  const out = mergeClients([intake('ci-1', 'New Lead')], []);
  check('an intake with no site still appears', out.length === 1 && out[0].link === 'none');

  const out2 = mergeClients([], [project('prj-1', 'Built From Scratch')]);
  check('a site with no intake still appears', out2.length === 1 && out2[0].link === 'none');

  check('empty input is empty output', mergeClients([], []).length === 0);
}

// --- keys and ordering ------------------------------------------------------

{
  const out = mergeClients(
    [intake('ci-1', 'Zebra Salon'), intake('ci-2', 'Alpha Barbers')],
    [project('prj-1', 'Zebra Salon', 'ci-1')]
  );
  check('sorted by name', out[0]?.name === 'Alpha Barbers', out[0]?.name);
  // Duplicate React keys silently drop rows, so a whole client would vanish.
  check('keys are unique', new Set(out.map(m => m.key)).size === out.length);
}

// --- nothing is dropped, ever -----------------------------------------------

{
  const intakes = [intake('ci-1', 'A'), intake('ci-2', 'B'), intake('ci-3', 'C')];
  const projects = [project('p-1', 'A', 'ci-1'), project('p-2', 'B'), project('p-3', 'D')];
  const out = mergeClients(intakes, projects);

  const seenIntakes = new Set(out.map(m => m.intake?.id).filter(Boolean));
  const seenProjects = new Set(out.map(m => m.project?.id).filter(Boolean));
  check('every intake appears exactly once', seenIntakes.size === intakes.length);
  check('every project appears exactly once', seenProjects.size === projects.length);
}

// --- deriving a card from a project with no dossier -------------------------

{
  const derived = intakeFromProject({
    id: 'prj-9',
    companyName: 'Scratch Salon',
    clientName: 'Dana',
    domain: 'https://scratch.pages.dev',
    blueprint: { profile: { phone: '(210) 493-8811', email: 'a@b.com', accentColor: '#e8b4b8' } },
  });
  check('the business name comes through', derived.businessName === 'Scratch Salon');
  check('contact details are lifted from the blueprint', derived.phone === '(210) 493-8811');
  check('flagged as derived', derived.derived === true);
  // A derived id must never collide with a real intake id, or editing one would
  // write over the other.
  check('the id is namespaced', String(derived.id).startsWith('derived:'), String(derived.id));

  const empty = intakeFromProject({ id: 'prj-10' });
  check('a project with no blueprint still yields a card', !!empty.businessName);
}

if (failures > 0) {
  console.error(`\nCLIENTS SMOKE FAILED: ${failures} check(s)`);
  process.exit(1);
}
console.log(
  'CLIENTS SMOKE PASS: recorded links beat names, guesses are labelled, ambiguity is left unmerged, nothing is dropped or double-counted'
);
