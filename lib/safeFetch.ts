import dns from 'dns/promises';
import net from 'net';

/**
 * SSRF-hardened outbound fetch.
 *
 * The scraper takes a URL straight from the operator's browser, so without these
 * guards it doubles as a proxy into anything the server can reach — cloud metadata
 * endpoints (169.254.169.254), Supabase/Stripe on localhost, the private VPC.
 *
 * Guards, in order:
 *   1. http/https only (no file:, gopher:, data:)
 *   2. every resolved A/AAAA record must be a public unicast address
 *   3. redirects are followed manually so each hop is re-validated
 *   4. wall-clock timeout + response size cap
 */

const MAX_REDIRECTS = 3;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MB of HTML is plenty

function ipv4IsBlocked(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  if (a === 0) return true;                          // 0.0.0.0/8    this network
  if (a === 10) return true;                         // 10/8         private
  if (a === 127) return true;                        // 127/8        loopback
  if (a === 169 && b === 254) return true;           // 169.254/16   link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16/12    private
  if (a === 192 && b === 168) return true;           // 192.168/16   private
  if (a === 192 && b === 0) return true;             // 192.0.0/24   IETF protocol assignments
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64/10    carrier NAT
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18/15 benchmarking
  if (a >= 224) return true;                         // 224/4 multicast, 240/4 reserved
  return false;
}

function ipv6IsBlocked(ip: string): boolean {
  const addr = ip.toLowerCase().split('%')[0]; // strip zone index

  // IPv4-mapped (::ffff:10.0.0.1) and IPv4-compatible forms tunnel the v4 rules
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4IsBlocked(mapped[1]);

  if (addr === '::' || addr === '::1') return true;  // unspecified, loopback
  if (/^f[cd]/.test(addr)) return true;              // fc00::/7  unique local
  if (/^fe[89ab]/.test(addr)) return true;           // fe80::/10 link-local
  if (/^ff/.test(addr)) return true;                 // ff00::/8  multicast
  return false;
}

export function isBlockedAddress(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return ipv4IsBlocked(ip);
  if (version === 6) return ipv6IsBlocked(ip);
  return true; // not a parseable IP — refuse rather than guess
}

/** Throws unless every address the hostname resolves to is public unicast. */
async function assertPublicHost(hostname: string): Promise<void> {
  // A bare IP in the URL skips DNS entirely.
  if (net.isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new Error(`Refusing to fetch a private or reserved address (${hostname})`);
    }
    return;
  }

  let records: { address: string }[];
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch {
    throw new Error(`Could not resolve hostname: ${hostname}`);
  }
  if (!records.length) throw new Error(`Could not resolve hostname: ${hostname}`);

  // Check every record: a hostname with both a public and a private A record
  // would otherwise be exploitable via DNS round-robin.
  for (const { address } of records) {
    if (isBlockedAddress(address)) {
      throw new Error(`Refusing to fetch a private or reserved address (${hostname} → ${address})`);
    }
  }
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  userAgent?: string;
}

/**
 * Fetches a user-supplied URL and returns the body as text, refusing anything
 * that points at private infrastructure. Returns the final URL after redirects
 * so callers can log or display where they actually landed.
 */
export async function safeFetchText(
  rawUrl: string,
  options: SafeFetchOptions = {}
): Promise<{ text: string; finalUrl: string; contentType: string }> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;

  let current = rawUrl.trim();
  if (!/^https?:\/\//i.test(current)) current = `https://${current}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      let parsed: URL;
      try {
        parsed = new URL(current);
      } catch {
        throw new Error(`Invalid URL: ${current}`);
      }

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error(`Unsupported protocol: ${parsed.protocol}`);
      }

      await assertPublicHost(parsed.hostname);

      const response = await fetch(parsed.toString(), {
        redirect: 'manual', // we re-validate each hop ourselves
        signal: controller.signal,
        headers: {
          'User-Agent':
            options.userAgent ??
            'Mozilla/5.0 (compatible; TexasSonsBot/1.0; +https://texassons.dev)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) throw new Error(`Redirect with no Location header (${response.status})`);
        current = new URL(location, parsed).toString(); // resolve relative redirects
        continue;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType && !/text\/html|text\/plain|application\/xhtml/i.test(contentType)) {
        throw new Error(`Expected an HTML page but got "${contentType}"`);
      }

      // Trust the header when it's present, but still cap while streaming —
      // Content-Length is advisory and can be absent or wrong.
      const declared = Number(response.headers.get('content-length') || 0);
      if (declared && declared > maxBytes) {
        throw new Error(`Page is too large (${declared} bytes)`);
      }

      const text = await readCapped(response, maxBytes);
      return { text, finalUrl: parsed.toString(), contentType };
    }

    throw new Error(`Too many redirects (>${MAX_REDIRECTS})`);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`Timed out after ${timeoutMs}ms fetching ${rawUrl}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** Reads the body, stopping once maxBytes is exceeded rather than buffering it all. */
async function readCapped(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return '';

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`Page exceeded the ${maxBytes} byte limit`);
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf8');
}
