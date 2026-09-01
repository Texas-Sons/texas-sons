/**
 * Applies a model's edited snapshot onto the one it was given.
 *
 * /api/studio-chat hands the model the whole blueprint and asks it to return
 * the whole blueprint back with one thing changed. Models do not reliably do
 * that. Asked to darken an accent colour, one will return a tidy object with
 * the colour changed and the nine-item `services` array simply absent — not
 * emptied, not refused, just not mentioned. The Studio then replaced the
 * project with that answer, and a salon lost her price list because the
 * operator asked for a different shade of gold.
 *
 * The symptom had been treated twice already: heroImage and logoUrl are pulled
 * out before the call and put back after, because those two were noticed going
 * missing. Every other field had the same exposure and no such guard.
 *
 * So: a key the model did not mention is a key it did not change. Only what it
 * actually returned is applied.
 *
 * Deleting is still expressible, and that distinction is the whole design:
 *
 *   services: []   -> present, and applied. The client's menu is cleared.
 *   services: null -> treated as absent. A model that nulls a field it was not
 *                     asked about is the failure this exists to stop, and
 *                     "remove the services" has [] to say it with.
 *
 * Arrays replace rather than combine. An edited list is a statement about the
 * whole list; merging index by index would leave a shortened menu with its old
 * tail still attached.
 */

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

export function mergeSnapshotEdit<T extends Record<string, any>>(original: T, edited: unknown): T {
  if (!isPlainObject(edited)) return original;
  if (!isPlainObject(original)) return edited as T;

  const result: Record<string, any> = { ...original };
  for (const [key, value] of Object.entries(edited)) {
    // Absent and null both mean "the model said nothing about this".
    if (value === undefined || value === null) continue;
    const before = (original as Record<string, any>)[key];
    result[key] = isPlainObject(before) && isPlainObject(value)
      ? mergeSnapshotEdit(before, value)
      : value;
  }
  return result as T;
}
