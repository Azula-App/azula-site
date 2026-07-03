import { invitePage, landingPage, notFoundPage } from "./pages";
import { isValidToken } from "./links";
import { appleAppSiteAssociation, assetLinks } from "./wellknown";
import { APPLE_TOUCH_PNG_B64, FAVICON_SVG, b64ToBytes } from "./icon";

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

    // Brand icons (see icon.ts).
    if (path === "/favicon.svg") {
      return new Response(FAVICON_SVG, {
        headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=86400", ...SECURITY_HEADERS },
      });
    }
    if (path === "/apple-touch-icon.png") {
      return new Response(b64ToBytes(APPLE_TOUCH_PNG_B64), {
        headers: { "content-type": "image/png", "cache-control": "public, max-age=86400", ...SECURITY_HEADERS },
      });
    }

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

    // Static MCP endpoint. Sessions are no longer encoded in the URL: configure
    // this endpoint once in an MCP client, then pair a device by giving azula
    // its session link (the `connect` tool or `azula pair <url>`). The actual
    // MCP↔iroh bridge is `azula serve-mcp` (Workers can't speak iroh) — see
    // URLS.md (repo root). A token path is accepted but ignored, with a deprecation note.
    if (path === "/mcp" || path.startsWith("/mcp/")) {
      if (request.method === "POST") {
        return json(
          {
            jsonrpc: "2.0",
            id: null,
            error: { code: -32601, message: "the azula MCP bridge is `azula serve-mcp`, not this worker" },
          },
          501,
        );
      }
      const deprecated = path.startsWith("/mcp/");
      return json({
        service: "azula-mcp",
        transport: "streamable-http",
        status: "placeholder",
        ...(deprecated
          ? { note: "tokens in the MCP URL are deprecated — configure the static /mcp endpoint and pair devices with the connect tool or `azula pair <url>`." }
          : {}),
        message:
          "Configure this MCP endpoint once in your LLM client, then pair an Azula device by giving " +
          "azula its session link (azula.app/s/<code>) via the connect tool or `azula pair`. The " +
          "MCP↔iroh bridge is `azula serve-mcp` — see the azula-site repo's URLS.md.",
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
