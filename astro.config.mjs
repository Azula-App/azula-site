// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// azula.app runs on Cloudflare Workers. The adapter runs workerd in dev,
// prerendering, and production, so `astro dev` is the same runtime that serves
// the site. Pages are static by default; only the routes that need a request
// (deeplink payloads, /mcp, the .well-known files) set `prerender = false`.
export default defineConfig({
  site: "https://azula.app",
  adapter: cloudflare(),
  trailingSlash: "never",
  build: { format: "file" },
  // No sessions here — nothing on this site has state. Left unset, the
  // Cloudflare adapter would wire up a KV-backed session store and
  // auto-provision a KV namespace on deploy; this site should not quietly
  // grow a piece of storage it never reads.
  // (`sessionDrivers.null()` returns exactly this, but isn't in Astro's typed
  // driver list, so the entrypoint is spelled out.)
  session: { driver: { entrypoint: "unstorage/drivers/null" } },
  security: {
    // Astro's cross-origin POST guard answers 403 before a route sees the
    // request. This site has no forms, no cookies and no session state, and
    // the one route that takes a POST — /mcp — must answer a misdirected MCP
    // client with its JSON-RPC error rather than a CSRF refusal.
    checkOrigin: false,
    // /privacy claims this site "loads nothing but itself". CSP makes the
    // browser enforce it instead of leaving it to a test: everything must come
    // from this origin, and Astro hashes the styles/scripts it emits so no
    // 'unsafe-inline' is needed. Delivered as a <meta http-equiv> per page.
    // frame-ancestors is set in public/_headers instead — meta tags ignore it.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self'",
        "font-src 'self'",
        "connect-src 'self'",
        "form-action 'none'",
        "base-uri 'none'",
        "object-src 'none'",
      ],
    },
  },
  markdown: {
    shikiConfig: { theme: "github-dark-default", wrap: true },
  },
});
