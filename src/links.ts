// A session token is an iroh EndpointTicket string (or a future short id). It is
// URL-safe and treated opaquely here — only the Azula app and the MCP↔iroh
// bridge decode it. See URLS.md for the full scheme.

const TOKEN_RE = /^[A-Za-z0-9._~-]{6,4096}$/;

export function isValidToken(token: string): boolean {
  return TOKEN_RE.test(token);
}

/** Short, display-only id for a session (not security-sensitive). */
export function sessionFingerprint(token: string): string {
  return token.slice(0, 8).toLowerCase();
}

/** The canonical custom-scheme deeplink the invite page tries to open. */
export function appScheme(token: string): string {
  return `azula://connect?code=${encodeURIComponent(token)}`;
}
