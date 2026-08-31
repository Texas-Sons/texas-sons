/**
 * Which origins may call this API from a browser.
 *
 * Deployed client sites are static bundles on Cloudflare Pages, on a different
 * origin from this server. Until now nothing bridged that gap: ClientApp posted
 * leads to a relative /api/lead, which on a Pages host resolves to the Pages
 * host, where no such route exists. Every lead form on every deployed site was
 * posting into nothing — and reporting success, because the failure happened
 * after the component had already congratulated the visitor.
 *
 * Two pieces fix it. The deploy injects the API's absolute base alongside the
 * blueprint, and the server allows those origins here.
 *
 * This is not a security boundary and must not be mistaken for one. CORS governs
 * what a *browser* will let one page do to another; it stops nothing that curl
 * can do. /api/lead is public by design, and every client route still requires a
 * Bearer token that a hostile origin has no way to read — tokens live in the
 * signed-in page's own storage, which the same-origin policy already protects.
 * The allowlist exists so a stray origin cannot quietly become load-bearing, not
 * because it defends the routes.
 */

/**
 * Cloudflare Pages subdomains. Every site this operator deploys lands here, so
 * enumerating them would mean a config change per client and a silent breakage
 * whenever one was forgotten.
 *
 * Anchored at both ends: a bare `.pages.dev` test would also match
 * `https://pages.dev.attacker.com`, which is the classic way an allowlist like
 * this is defeated.
 */
const PAGES_DEV = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.pages\.dev$/i;

/** Localhost on any port, for development only. */
const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

/**
 * Custom domains, comma-separated in CLIENT_SITE_ORIGINS. A client on their own
 * domain rather than a pages.dev subdomain needs an entry here.
 */
export function configuredOrigins(): string[] {
  return (process.env.CLIENT_SITE_ORIGINS || '')
    .split(',')
    .map(o => o.trim().replace(/\/+$/, '').toLowerCase())
    .filter(Boolean);
}

export function isAllowedClientOrigin(origin: unknown): boolean {
  if (typeof origin !== 'string' || !origin) return false;
  const value = origin.trim().replace(/\/+$/, '');

  // A wildcard or a null origin must never pass. `null` is what a sandboxed
  // iframe or a file:// page sends, and treating it as an origin at all is how
  // an allowlist ends up trusting a local HTML file.
  if (value === '*' || value.toLowerCase() === 'null') return false;

  if (PAGES_DEV.test(value)) return true;
  if (LOCALHOST.test(value)) return true;

  const appUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '').toLowerCase();
  if (appUrl && value.toLowerCase() === appUrl) return true;

  return configuredOrigins().includes(value.toLowerCase());
}
