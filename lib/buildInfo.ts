/**
 * Which build is this.
 *
 * `/api/health` returned `{ status: "ok" }` and nothing else, so there was no
 * way — from the app, the terminal, or a browser — to tell whether the code
 * being served was the code that was last pushed. "did you push those updates
 * I dont see a slider", "I still dont see the updates after refresh", "why does
 * my ai studio version not match the site": the same question seven times over
 * one build, and answering it always meant redeploying and looking again.
 *
 * Three things are conflated in this project and all three are called "deploy":
 * pushing this app to Railway, publishing a client site to Cloudflare Pages,
 * and the automatic republish that a client's own photo upload triggers. This
 * names the first one. `npm run cf` names the second.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface BuildInfo {
  /** Short commit SHA, or 'unknown' when nothing could tell us. */
  commit: string;
  /** ISO time this process started. Not build time — see `builtAt`. */
  startedAt: string;
  /** ISO mtime of the running bundle, which is when it was actually built. */
  builtAt: string | null;
  /** 'production' when serving from dist/, otherwise 'development'. */
  mode: string;
}

/**
 * Resolves the commit once, at import.
 *
 * Order matters. Railway injects the SHA as an environment variable and there is
 * no .git directory in a deployed container, so the env vars have to come first
 * — falling back to `git rev-parse` in production would shell out on every
 * health check and fail every time.
 */
function resolveCommit(): string {
  const fromEnv =
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.GIT_SHA ||
    process.env.SOURCE_VERSION ||
    process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromEnv) return String(fromEnv).slice(0, 7);

  try {
    // Local development. `stdio` silences git's own stderr, which otherwise
    // prints a warning on every start when this is run outside a repository.
    return execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * When the running bundle was written.
 *
 * Read from the file rather than baked in at compile time: `npm run build`
 * rewrites dist/server.cjs, so its mtime is the build time, and reading it
 * needs no build-step cooperation. Null in development, where there is no
 * bundle and the answer would be meaningless.
 */
function resolveBuiltAt(): string | null {
  try {
    const bundle = path.join(process.cwd(), 'dist', 'server.cjs');
    return fs.statSync(bundle).mtime.toISOString();
  } catch {
    return null;
  }
}

const COMMIT = resolveCommit();
const STARTED_AT = new Date().toISOString();

export function buildInfo(): BuildInfo {
  return {
    commit: COMMIT,
    startedAt: STARTED_AT,
    // Not cached: a production restart after a rebuild should report the new
    // bundle, and this is read at most once per health check.
    builtAt: resolveBuiltAt(),
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  };
}
