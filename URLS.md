# azula.app URL system

How azula links sessions across the web, the native apps, and an LLM over MCP.

## The session token

Every Azula session is identified by a **session token** — a URL-safe string the
app already has: its **iroh `EndpointTicket`** (endpoint id + relay url + direct
addresses, base32-encoded). The token is what a peer or a bridge needs to dial
the app over iroh. The website treats it **opaquely** (validates the charset,
derives a short display fingerprint); only the app and the MCP↔iroh bridge
decode it.

> Tokens are bearer credentials: anyone with one can open a direct connection to
> that endpoint. Treat invite/MCP URLs like passwords. (Future: short, revocable
> ids backed by KV — see below.)

## Routes (served by the Worker)

| URL | Purpose |
|-----|---------|
| `https://azula.app/` | Landing page |
| `https://azula.app/s/<token>` | **Session invite** — universal/app link. Opens the app to that session; falls back to a web page with the code + store links. `/connect/<token>` is an alias. |
| `https://azula.app/mcp/<token>` | **MCP endpoint** — the URL you add to an MCP-capable LLM client. The `<token>` says *which* Azula session to bridge to. |
| `https://azula.app/.well-known/apple-app-site-association` | iOS universal-link association (served as `application/json`). |
| `https://azula.app/.well-known/assetlinks.json` | Android App Links association. |

Custom-scheme fallback for deeplinks: `azula://connect?code=<token>` (used by the
invite page's JS and registered by both apps).

## Flow A — link a person (peer chat)

1. App shows the user their code (the ticket) and an invite link `…/s/<token>`.
2. Recipient taps it. If the app is installed and the domain is verified, the OS
   opens the app directly (no web round-trip); otherwise the web page loads and
   offers "Open in azula" (`azula://…`) + store links + the raw code to paste.
3. The app parses the token and dials the peer on the `azula/chat/0` ALPN.

## Flow B — link an LLM (MCP)

1. App (or the user) forms the MCP URL `https://azula.app/mcp/<token>`.
2. The user adds that URL to an MCP-capable LLM client (Claude, etc.).
3. The LLM client speaks MCP (Streamable HTTP) to that URL. A **bridge** behind
   the URL decodes `<token>` → iroh ticket, dials the app on the `azula/llm/0`
   ALPN, and exposes MCP tools (e.g. `send_message`) that forward to the app and
   stream the reply back.

### Why the bridge is separate from this Worker

Cloudflare Workers cannot open iroh connections (no raw UDP/QUIC, no long-lived
holepunched sockets). So `/mcp/<token>` here is a **documented placeholder**: it
validates the token and describes the endpoint. The real MCP server that fulfils
requests runs where iroh can run. Options:

- **`azula-cli serve-mcp`** — this exists now: it runs an MCP server over
  Streamable HTTP and dials the app over iroh, exposing `get_messages` /
  `send_message` tools to the LLM. Run it on a host/container
  (`azula serve-mcp --app-ticket <token> --bind 0.0.0.0:8765`) and point
  `mcp.azula.app` (or a Worker proxy route) at its `/mcp` endpoint. v1 is one
  session per process; multi-tenant routing by token is the remaining piece.
- A separate long-running container service.

When the bridge exists, either (a) point a `mcp.azula.app` DNS record at it and
hand out `https://mcp.azula.app/mcp/<token>`, or (b) have this Worker reverse-proxy
`POST /mcp/<token>` to the bridge.

## Future: short, revocable links

Embedding the full ticket makes long URLs and can't be revoked. A short-id scheme
would: app `POST`s its ticket to `azula.app` → Worker stores `id → {ticket, exp}`
in **KV/D1** → returns `…/s/<id>` and `…/mcp/<id>`. The Worker (and bridge) resolve
`id → ticket`. This adds a registration endpoint + storage binding (none today).
