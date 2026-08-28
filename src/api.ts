import { supabase } from './supabase';

/**
 * fetch() for the admin API. Attaches the current Supabase session as a Bearer
 * token — the server rejects /api routes without one.
 *
 * Use this for every /api call from the Studio. The one exception is /api/lead,
 * which is called from deployed client sites where no session exists.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(input, { ...init, headers });

  // A 401 means the session died server-side. Sign out so onAuthStateChange
  // drops the UI back to the login screen instead of showing broken panels.
  if (response.status === 401) {
    console.warn('[api] Session rejected, signing out');
    await supabase.auth.signOut();
  }

  return response;
}

/** apiFetch + JSON parsing + error unwrapping, for the common case. */
export async function apiJson<T = any>(input: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(input, init);
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    throw new Error(`${input} returned a non-JSON response (${response.status})`);
  }
  if (!response.ok || body?.success === false) {
    throw new Error(body?.error || `${input} failed (${response.status})`);
  }
  return body as T;
}
