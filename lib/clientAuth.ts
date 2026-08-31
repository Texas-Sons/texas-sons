import type { Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifySessionUser, extractBearer, type AuthedRequest } from './auth';

/**
 * Authorization for client users — a salon owner and her stylists.
 *
 * The operator gate in auth.ts answers one question for the whole API: is this
 * person on the allowlist. That cannot work here, because a client user is
 * legitimately authenticated and legitimately forbidden from almost everything.
 * The question is not "who are you" but "what may you touch", and the answer is
 * a single project.
 *
 * So every route under /api/client/ names its project in the path, and this
 * resolves membership for that specific project before the handler runs. There
 * is no ambient "current client" — a session that is valid for one salon is
 * simply not a session for another.
 *
 * Membership is read with the service-role client on purpose. The alternative,
 * giving client users direct RLS-scoped access to the tables, would mean every
 * future policy change is load-bearing for tenant isolation. Resolving it in one
 * function that every route must pass through is a boundary you can read.
 */

export type ClientRole = 'owner' | 'member';

export interface ClientMembership {
  projectId: string;
  email: string;
  role: ClientRole;
  /** True when this is the operator who owns the project, not a client user. */
  isOperator: boolean;
}

export interface ClientRequest extends AuthedRequest {
  membership?: ClientMembership;
}

/**
 * Resolves what a signed-in email may do with one project.
 *
 * Returns null when they may do nothing — which is also the answer for a
 * project that does not exist. Distinguishing "no such project" from "not yours"
 * would let anyone enumerate the operator's client list one id at a time.
 */
export async function resolveMembership(
  db: SupabaseClient,
  projectId: string,
  user: { id: string; email: string }
): Promise<ClientMembership | null> {
  const { data: project, error } = await db
    .from('projects')
    .select('id, owner_id')
    .eq('id', projectId)
    .maybeSingle();

  // A failed lookup is not permission. Treat an unreadable project as closed.
  if (error) {
    console.error('[clientAuth] project lookup failed:', error.message);
    return null;
  }
  if (!project) return null;

  // The operator who owns the project always has full access to it, without
  // needing a roster row for himself.
  if (project.owner_id === user.id) {
    return { projectId, email: user.email, role: 'owner', isOperator: true };
  }

  const email = user.email.toLowerCase();
  const { data: rows, error: rosterError } = await db
    .from('client_users')
    .select('role, email')
    .eq('project_id', projectId);

  if (rosterError) {
    console.error('[clientAuth] roster lookup failed:', rosterError.message);
    return null;
  }

  // Compared lowercased in JS as well as in the index, so a row written before
  // the normalisation existed still matches.
  const row = (rows || []).find(r => String(r.email || '').toLowerCase() === email);
  if (!row) return null;

  return {
    projectId,
    email,
    role: row.role === 'owner' ? 'owner' : 'member',
    isOperator: false,
  };
}

/**
 * Express middleware factory. `getDb` is injected rather than imported so this
 * module stays free of server.ts's Supabase wiring and can be unit-tested.
 *
 * Expects the project id as req.params.projectId, so it must be mounted on a
 * route that has one. A route under /api/client/ without a project id would
 * otherwise be gated by nothing at all.
 */
export function requireClientMember(getDb: () => SupabaseClient) {
  return async (req: ClientRequest, res: Response, next: NextFunction) => {
    const token = extractBearer(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Please sign in.' });
    }

    let user: { id: string; email: string } | null;
    try {
      user = await verifySessionUser(token);
    } catch (error: any) {
      console.error('[clientAuth] cannot verify sessions:', error?.message || error);
      return res.status(500).json({ success: false, error: 'Server auth is not configured' });
    }
    if (!user) {
      return res.status(401).json({ success: false, error: 'Your session has expired. Please sign in again.' });
    }

    const projectId = req.params.projectId;
    if (!projectId) {
      // A programming error, not a user one: the route was mounted without the
      // parameter this gate depends on. Fail closed and say so in the log.
      console.error('[clientAuth] requireClientMember mounted without :projectId —', req.originalUrl);
      return res.status(500).json({ success: false, error: 'Misconfigured route' });
    }

    let membership: ClientMembership | null;
    try {
      membership = await resolveMembership(getDb(), projectId, user);
    } catch (error: any) {
      console.error('[clientAuth] membership lookup failed:', error?.message || error);
      return res.status(500).json({ success: false, error: 'Could not check your access' });
    }

    if (!membership) {
      // Deliberately identical to the response for a project that does not
      // exist. Anything more specific is an enumeration oracle.
      return res.status(404).json({ success: false, error: 'Not found.' });
    }

    req.user = user;
    req.membership = membership;
    next();
  };
}

/**
 * Requires a valid session but no project membership.
 *
 * Exactly one route may use this: the one that answers "which salons am I
 * allowed to manage", which cannot name a project because finding out is the
 * point. It must therefore filter its own results by req.user.email and hand
 * back nothing else — there is no membership on the request to lean on.
 *
 * It exists as a named middleware rather than inline token handling so the
 * security smoke test can tell a deliberate exception from a forgotten gate.
 */
export async function requireClientSession(req: ClientRequest, res: Response, next: NextFunction) {
  const token = extractBearer(req);
  if (!token) return res.status(401).json({ success: false, error: 'Please sign in.' });

  let user: { id: string; email: string } | null;
  try {
    user = await verifySessionUser(token);
  } catch (error: any) {
    console.error('[clientAuth] cannot verify sessions:', error?.message || error);
    return res.status(500).json({ success: false, error: 'Server auth is not configured' });
  }
  if (!user) {
    return res.status(401).json({ success: false, error: 'Your session has expired. Please sign in again.' });
  }

  req.user = user;
  next();
}

/** Guards the routes that change who else has access. */
export function requireClientOwner(req: ClientRequest, res: Response, next: NextFunction) {
  if (req.membership?.role !== 'owner') {
    return res.status(403).json({
      success: false,
      error: 'Only an account owner can change who has access.',
    });
  }
  next();
}
