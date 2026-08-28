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
export const PUBLIC_API_PREFIXES = ['/intake/'];

/** True when a path (relative to the /api mount) needs no authentication. */
export function isPublicApiPath(pathname: string): boolean {
  if (PUBLIC_API_PATHS.has(pathname)) return true;
  return PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix));
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

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
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

  const cached = cacheGet(token);
  if (cached) {
    req.user = cached;
    return next();
  }

  let client: SupabaseClient;
  try {
    client = getAuthClient();
  } catch (error: any) {
    // Misconfiguration must not open the door.
    console.error('[auth] Cannot verify sessions:', error.message);
    return res.status(500).json({ success: false, error: 'Server auth is not configured' });
  }

  try {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user?.email) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session' });
    }

    const email = data.user.email.toLowerCase();
    if (!getAdminEmails().includes(email)) {
      console.warn(`[auth] Rejected non-admin login attempt: ${email}`);
      return res.status(403).json({ success: false, error: 'This portal is restricted to authorized administrators' });
    }

    const user = { id: data.user.id, email };
    cacheSet(token, user);
    req.user = user;
    next();
  } catch (error: any) {
    console.error('[auth] Verification failed:', error?.message || error);
    return res.status(401).json({ success: false, error: 'Could not verify session' });
  }
}
