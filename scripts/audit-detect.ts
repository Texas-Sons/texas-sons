/**
 * The detection half of the responsive audit.
 *
 * Split out of scripts/audit-responsive.ts because the browser driving and the
 * "what counts as broken" logic are different jobs, and only the second one is
 * subtle. The first pass of this audit visited 41 surfaces and reported two
 * findings, both reading `Element off-screen: DIV.` — a run that looks like
 * coverage and tells you nothing.
 *
 * Three reasons it found nothing, all fixed here:
 *
 *   1. It never checked for clipping by `overflow: hidden`. That is the actual
 *      Deploy-button symptom: an element inside its parent's box on paper, cut
 *      off on screen, and completely invisible to a scrollWidth check.
 *   2. It `break`-ed after the first offending element "to avoid spam", so one
 *      finding per page was the maximum it could ever report.
 *   3. It described elements as `TAG.` + 20 characters of className, which for
 *      an unclassed div is the string "DIV." — unactionable.
 *
 * This module is injected into the page, so it must be self-contained: no
 * imports, no closure over anything outside itself.
 */

export interface RawFinding {
  kind: 'page-overflow' | 'clipped' | 'offscreen' | 'unscrollable-modal' | 'small-tap-target';
  selector: string;
  detail: string;
  /** Groups instances of one cause together in the report. */
  signature: string;
}

/**
 * Returns the function source to run inside the page.
 *
 * Handed to page.evaluate as a string rather than a function reference so it
 * carries no build-time closure — tsx would otherwise compile in references the
 * browser cannot resolve.
 */
export const DETECTOR = `() => {
  const findings = [];

  /** A selector a human can actually find in the source. */
  const describe = (el) => {
    const id = el.id ? '#' + el.id : '';
    const cls = (typeof el.className === 'string' ? el.className : '')
      .split(/\\s+/).filter(Boolean).slice(0, 4).join('.');
    const text = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
    return el.tagName.toLowerCase() + id + (cls ? '.' + cls : '') + (text ? ' "' + text + '"' : '');
  };

  // 1. The page scrolls sideways, and which element is widest.
  const doc = document.documentElement;
  if (doc.scrollWidth > doc.clientWidth + 1) {
    let widest = null;
    let widestRight = 0;
    for (const el of document.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > widestRight) { widestRight = r.right; widest = el; }
    }
    findings.push({
      kind: 'page-overflow',
      selector: widest ? describe(widest) : 'unknown',
      detail: 'page scrollWidth ' + doc.scrollWidth + ' vs viewport ' + doc.clientWidth +
              '; widest element reaches ' + Math.round(widestRight) + 'px',
      signature: 'page-overflow:' + (widest ? (typeof widest.className === 'string' ? widest.className.split(/\\s+/).slice(0,3).join(' ') : '') : ''),
    });
  }

  // 2. Interactive controls that are unreachable.
  //
  // The distinction that matters: clipped by a SCROLLABLE ancestor is fine, the
  // user scrolls to it. Clipped by overflow:hidden means the control is gone,
  // and no amount of scrolling or zooming brings it back. That second case is
  // the bug being hunted and the first pass did not look for it.
  const controls = document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]');
  for (const el of controls) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;      // genuinely hidden, fine
    if (getComputedStyle(el).visibility === 'hidden') continue;

    let node = el.parentElement;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      const clips = style.overflow === 'hidden' || style.overflowY === 'hidden' || style.overflowX === 'hidden';
      const scrolls = /(auto|scroll)/.test(style.overflow + style.overflowY + style.overflowX);
      if (clips && !scrolls) {
        const box = node.getBoundingClientRect();
        const cutBottom = r.bottom > box.bottom + 1;
        const cutRight = r.right > box.right + 1;
        if (cutBottom || cutRight) {
          findings.push({
            kind: 'clipped',
            selector: describe(el),
            detail: 'cut off ' + (cutBottom ? 'below' : '') + (cutBottom && cutRight ? ' and ' : '') +
                    (cutRight ? 'to the right of' : '') + ' an overflow-hidden ancestor: ' + describe(node),
            signature: 'clipped:' + (typeof node.className === 'string' ? node.className.split(/\\s+/).slice(0,3).join(' ') : ''),
          });
          break;
        }
      }
      node = node.parentElement;
    }

    if (r.right > window.innerWidth + 1 || r.bottom > document.documentElement.scrollHeight + 1) {
      findings.push({
        kind: 'offscreen',
        selector: describe(el),
        detail: 'right ' + Math.round(r.right) + ' / viewport ' + window.innerWidth,
        signature: 'offscreen',
      });
    }
  }

  // 3. A dialog taller than the screen with nothing to scroll. The bottom of a
  //    modal is where Save and Deploy live.
  for (const modal of document.querySelectorAll('[role="dialog"], .fixed.inset-0 > div')) {
    const style = getComputedStyle(modal);
    const canScroll = /(auto|scroll)/.test(style.overflowY);
    const inner = modal.querySelector('[class*="overflow-y-auto"], [class*="overflow-auto"]');
    if (modal.getBoundingClientRect().height > window.innerHeight + 1 && !canScroll && !inner) {
      findings.push({
        kind: 'unscrollable-modal',
        selector: describe(modal),
        detail: 'modal is ' + Math.round(modal.getBoundingClientRect().height) + 'px in a ' +
                window.innerHeight + 'px viewport with no scrollable region',
        signature: 'unscrollable-modal',
      });
    }
  }

  // 4. Tap targets. Lowest priority, and only worth reporting on a phone.
  if (window.innerWidth <= 480) {
    for (const el of controls) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.height < 32 || r.width < 32) {
        findings.push({
          kind: 'small-tap-target',
          selector: describe(el),
          detail: Math.round(r.width) + 'x' + Math.round(r.height) + 'px',
          signature: 'small-tap-target',
        });
      }
    }
  }

  // One row per element, not per ancestor that happens to clip it.
  const seen = new Set();
  return findings.filter(f => {
    const key = f.kind + '|' + f.selector;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}`;

/** Groups raw findings by cause, which is the number that decides the fix. */
export function groupBySignature(
  rows: Array<RawFinding & { surface: string; viewport: string }>
): Array<{ signature: string; kind: string; count: number; surfaces: string[]; example: string }> {
  const groups = new Map<string, { kind: string; count: number; surfaces: Set<string>; example: string }>();
  for (const row of rows) {
    const existing = groups.get(row.signature);
    if (existing) {
      existing.count++;
      existing.surfaces.add(row.surface + ' @ ' + row.viewport);
    } else {
      groups.set(row.signature, {
        kind: row.kind,
        count: 1,
        surfaces: new Set([row.surface + ' @ ' + row.viewport]),
        example: row.selector + ' — ' + row.detail,
      });
    }
  }
  return [...groups.entries()]
    .map(([signature, g]) => ({
      signature,
      kind: g.kind,
      count: g.count,
      surfaces: [...g.surfaces],
      example: g.example,
    }))
    .sort((a, b) => b.count - a.count);
}
