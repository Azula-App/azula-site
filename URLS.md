# azula.app URL system

How azula links sessions across the web, the native apps, and an LLM over MCP.

## The session token

Every Azula session is identified by a **session token** — a URL-safe string the
app already has: its **iroh `EndpointTicket`** (endpoint id + relay url + direct
addresses, base32-encoded). It is wrapped in a `…/s/<token>` link (or `azula://`,
or shared as a raw token). To link an LLM you do **not** put the token in the MCP
URL — you give the link to azula (the `connect` tool or `azula pair <url>`), which
parses the token locally (no network) and dials the app. The website treats the
token **opaquely**.

> Tokens are bearer credentials: anyone with one can open a direct connection to
> that endpoint. Treat invite links like passwords.

## Routes (served by the Worker)

| URL | Purpose |
|-----|---------|
| `https://azula.app/` | Landing page |
| `https://azula.app/s/<token>` | **Session invite** — universal/app link. Opens the app to that session; falls back to a web page with the code + store links. `/connect/<token>` is an alias. |
| `https://azula.app/mcp` | **MCP endpoint** — *static*; configured once in an LLM client. Sessions are not in the URL; you pair devices via the `connect` tool / `azula pair`. (A `/mcp/<token>` path is accepted but the token is ignored, with a deprecation note.) |
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

1. Run the bridge where iroh works: `azula serve-mcp --bind 0.0.0.0:8765`. It
   serves a **static** MCP endpoint at `/mcp` (no token in the path).
2. Configure that endpoint **once** in an MCP-capable LLM client — point
   `mcp.azula.app` (or a proxy) at the bridge, or use its address directly.
3. Pair a device by giving azula its session link: either the **`connect`** tool
   (paste `https://azula.app/s/<token>` in chat) or **`azula pair <url>`**. The
   bridge parses the token, dials the app on the `azula/llm/0` ALPN, and exposes
   `connect` / `list_devices` / `send_message` / `get_messages` / `disconnect`.
   One bridge holds **multiple devices** at once, addressed by name.

### Device registry (state files the LLM knows about)

Paired devices persist as JSON so they survive restarts, work across git
worktrees, and are visible to an agent:

- **Project-local** `<worktree-root>/.azula/devices.json` — git-worktree-aware
  (first ancestor containing a `.git`). `azula pair` writes here inside a repo.
- **Global** `~/.azula/devices.json` — fallback outside a repo (or with
  `--global`). Reads merge global then project (project wins by name).
- **Runtime** `$TMPDIR/azula/bridge.json` — a live bridge's `{bind, pid,
  devices:[{name,connected}]}`, so an agent can discover a running bridge.

### Why the bridge is separate from this Worker

Cloudflare Workers cannot open iroh connections (no raw UDP/QUIC, no long-lived
holepunched sockets), so `/mcp` here is just an info placeholder. The real MCP
server is **`azula serve-mcp`** — run it on a host/container and point
`mcp.azula.app` (or a Worker reverse-proxy of `/mcp`) at it.

## Future: short, revocable links

Embedding the full ticket makes long invite links that can't be revoked. A
short-id scheme would: app `POST`s its ticket to `azula.app` → Worker stores
`id → {ticket, exp}` in **KV/D1** → hands out `…/s/<id>`; the app/bridge resolve
`id → ticket`. Adds a registration endpoint + storage binding (none today).
