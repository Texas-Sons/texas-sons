import type { Request, Response, NextFunction } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side admin gate for /api routes.
 *
 * The browser allowlist in src/App.tsx is a UX affordance, not security — it
 * lives in localStorage and is editable from devtools. This middleware is the
 * actual boundary: it verifies the Supabase session JWT against the auth server
 * and checks the resulting email against the admin allowlist.
 *
 * Fails closed. A missing/invalid token, an unverifiable one, or a misconfigured
 * server all result in a rejected request.
 */

export interface AuthedRequest extends Request {
  user?: { id: string; email: string };
}

const DEFAULT_ADMIN_EMAILS = ['contact.txsons@gmail.com', 'morganmv145@gmail.com'];

/** Admin allowlist, from ADMIN_EMAILS (comma-separated) or the built-in default. */
export function getAdminEmails(): string[] {
  const configured = process.env.ADMIN_EMAILS;
  if (!configured) return DEFAULT_ADMIN_EMAILS;
  const parsed = configured
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length ? parsed : DEFAULT_ADMIN_EMAILS;
}

/**
 * Routes under /api that are reachable without a session, by design.
 *   /health   liveness probe
 *   /lead     form posts from deployed client sites (no session exists)
 * Adding a third requires a decision log entry.
 */
export const PUBLIC_API_PATHS = new Set(['/health', '/lead']);

/**
 * Public routes carrying a path parameter, matched by prefix.
 *
 * The trailing slash is load-bearing: '/intake/' must match '/intake/<token>'
 * but must NOT match the admin route '/intake-link'. Prefixes here are the
 * easiest way to accidentally expose an admin endpoint, so every entry needs a
 * corresponding negative case in scripts/smoke-security.ts.
 */
export const PUBLIC_API_PREFIXES = ['/intake/', '/portal/'];

/** True when a path (relative to the /api mount) needs no authentication. */
export function isPublicApiPath(pathname: string): boolean {
  if (PUBLIC_API_PATHS.has(pathname)) return true;
  return PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

/**
 * Routes for signed-in CLIENT users — a salon owner and her stylists — rather
 * than for the operator.
 *
 * A third tier, and the reason one was needed: these are neither public nor
 * admin. They require a real session, but the session belongs to someone who
 * must never reach /api/deploy, /api/invoice, or another salon's data. Sending
 * them through requireAdmin would deny every one of them; leaving them public
 * would expose one client's content to anybody who guessed a project id.
 *
 * Authorization is per-project and resolved in lib/clientAuth.ts. This function
 * only says which gate a path belongs to.
 *
 * The trailing slash is load-bearing for the same reason it is on the public
 * prefixes: '/client/' must not also match a future '/client-export'.
 */
export const CLIENT_API_PREFIX = '/client/';

export function isClientApiPath(pathname: string): boolean {
  return pathname.startsWith(CLIENT_API_PREFIX);
}

let authClient: SupabaseClient | null = null;
function getAuthClient(): SupabaseClient {
  if (!authClient) {
    const url = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required to verify sessions');
    }
    authClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return authClient;
}

// Verifying a JWT is a network call to Supabase. Cache the positive result
// briefly so a burst of requests from one Studio page load doesn't fan out.
const CACHE_TTL_MS = 60_000;
const verifiedTokens = new Map<string, { user: { id: string; email: string }; expiresAt: number }>();

function cacheGet(token: string) {
  const hit = verifiedTokens.get(token);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    verifiedTokens.delete(token);
    return null;
  }
  return hit.user;
}

function cacheSet(token: string, user: { id: string; email: string }) {
  // Bound the map so a stream of distinct tokens can't grow it without limit.
  if (verifiedTokens.size > 100) verifiedTokens.clear();
  verifiedTokens.set(token, { user, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

/**
 * Verifies a Supabase session token and returns the user, or null.
 *
 * Says only "this is a real, current session for this email" — it makes no
 * authorization decision at all. requireAdmin checks the result against the
 * operator allowlist; the client gate checks it against project membership.
 * Two questions, one answer to the first, so a change to how sessions are
 * verified cannot apply to one gate and not the other.
 *
 * Throws only when the server itself is misconfigured. An invalid or expired
 * token is null, not an exception.
 */
export async function verifySessionUser(
  token: string
): Promise<{ id: string; email: string } | null> {
  const cached = cacheGet(token);
  if (cached) return cached;

  const client = getAuthClient(); // throws when unconfigured — the caller 500s
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user?.email) return null;

  const user = { id: data.user.id, email: data.user.email.toLowerCase() };
  cacheSet(token, user);
  return user;
}

/**
 * Express middleware. Rejects with 401 unless the request carries a valid
 * Supabase session token whose email is on the admin allowlist.
 */
export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = extractBearer(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  let user: { id: string; email: string } | null;
  try {
    user = await verifySessionUser(token);
  } catch (error: any) {
    // Misconfiguration must not open the door.
    console.error('[auth] Cannot verify sessions:', error?.message || error);
    return res.status(500).json({ success: false, error: 'Server auth is not configured' });
  }

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session' });
  }

  if (!getAdminEmails().includes(user.email)) {
    console.warn(`[auth] Rejected non-admin login attempt: ${user.email}`);
    return res.status(403).json({ success: false, error: 'This portal is restricted to authorized administrators' });
  }

  req.user = user;
  next();
}
