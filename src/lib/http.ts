/**
 * Response helpers for the endpoints that still run on the Worker.
 *
 * Prerendered pages get their headers from public/_headers; anything built
 * here sets them explicitly, because a Worker response never passes through
 * the static-assets header rules.
 */

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...SECURITY_HEADERS },
  });
}

export function markdown(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/markdown; charset=utf-8", ...SECURITY_HEADERS },
  });
}

export function text(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", ...SECURITY_HEADERS },
  });
}
