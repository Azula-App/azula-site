import { invitePage, landingPage, notFoundPage } from "./pages";
import { isValidToken, sessionFingerprint } from "./links";
import { appleAppSiteAssociation, assetLinks } from "./wellknown";

// No bindings yet. Run `npm run cf-typegen` to regenerate when bindings are added.
export interface Env {}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", ...SECURITY_HEADERS },
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...SECURITY_HEADERS },
  });
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/" || path === "") return html(landingPage());
    if (path === "/health") return new Response("ok", { headers: SECURITY_HEADERS });

    // Deeplink association files. Must be served as application/json with no
    // redirect — that's the whole reason these run through the Worker.
    if (path === "/.well-known/apple-app-site-association") return json(appleAppSiteAssociation());
    if (path === "/.well-known/assetlinks.json") return json(assetLinks());

    // Session invite (universal / app link). /connect/* is an alias.
    const invite = path.match(/^\/(?:s|connect)\/(.+)$/);
    if (invite) {
      const token = safeDecode(invite[1]);
      if (token === null || !isValidToken(token)) return html(invitePage(null), 404);
      return html(invitePage(token));
    }

    // MCP endpoint for a session. The token identifies which Azula session an
    // LLM should be bridged to. The actual MCP↔iroh bridge is a separate server
    // component (Workers can't speak iroh's UDP/QUIC) — see site/URLS.md.
    const mcp = path.match(/^\/mcp\/(.+)$/);
    if (mcp) {
      const token = safeDecode(mcp[1]);
      if (token === null || !isValidToken(token)) return json({ error: "invalid session token" }, 400);
      if (request.method === "POST") {
        return json(
          {
            jsonrpc: "2.0",
            id: null,
            error: { code: -32601, message: "azula MCP bridge is not deployed for this session yet" },
          },
          501,
        );
      }
      return json({
        service: "azula-mcp",
        transport: "streamable-http",
        session: sessionFingerprint(token),
        status: "placeholder",
        message:
          "Public MCP endpoint URL for an Azula session. Add this URL to an MCP-capable LLM client. " +
          "The MCP↔iroh bridge that fulfils requests is a separate server component — see the repo's site/URLS.md.",
      });
    }

    return html(notFoundPage(), 404);
  },
} satisfies ExportedHandler<Env>;

function safeDecode(s: string): string | null {
  try {
    return decodeURIComponent(s);
  } catch {
    return null;
  }
}
