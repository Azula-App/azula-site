# azula.app URL system

How azula links sessions across the web, the native apps, and an LLM over MCP.

## Invite payloads (current)

The primary way to share access to an azula node is an **invite payload**: a
binary header (id, validity window, single-use flag, optional Ed25519
signature) wrapping the issuer's iroh `EndpointTicket`, encoded as `"azi" +
base32(...)` (RFC 4648, no padding, lowercase). Full payload layout, the wire
protocol, the accept-side verification model, and the shared cross-repo test
vectors live in
[`azula-docs/docs/invitations.md`](../azula-docs/docs/invitations.md) — read
that first; this file only documents the Worker-served routes.

- `https://azula.app/i/<encoded>` — canonical share link (universal/app link).
  Opens the app directly to the invite; falls back to a web page (`invitePageV2`
  in `src/pages.ts`) showing the invite id fingerprint, expiry countdown,
  signed/single-use badges, store links, and the raw payload to paste. Invalid
  or truncated payloads fall back to the same invalid-link page as the legacy
  `/s/` route, with a 404 status.
- `azula://i?c=<encoded>` — custom-scheme fallback, tried by the invite page's
  JS and registered by both apps.
- A bare `azi…` string can be pasted directly into the app's connect box.

## The legacy session token (still supported)

Before invite payloads, azula shared the raw iroh `EndpointTicket` string
directly — a URL-safe **session token** wrapped in a `…/s/<token>` link (or
`azula://`, or shared as a raw token). The website treats the token
**opaquely**.

> Legacy tokens are bearer credentials: anyone with one can open a direct
> connection to that endpoint. Treat invite links like passwords.

These routes **keep parsing forever for outbound dialing** during the
transition (see `invitations.md`'s "Transition / compat" section), but new
share links should use `/i/`.

## Routes (served by the Worker)

| URL | Purpose |
|-----|---------|
| `https://azula.app/` | Landing page |
| `https://azula.app/i/<encoded>` | **Invite (v2)** — universal/app link. See above. |
| `https://azula.app/s/<token>` | *Legacy* session invite — universal/app link. Opens the app to that session; falls back to a web page with the code + store links. `/connect/<token>` is an alias. Legacy-supported, not the canonical share format anymore. |
| `https://azula.app/mcp` | **MCP endpoint** — *static*; configured once in an LLM client. Sessions are not in the URL; you pair devices via the `connect` tool / `azula pair`. (A `/mcp/<token>` path is accepted but the token is ignored, with a deprecation note.) |
| `https://azula.app/.well-known/apple-app-site-association` | iOS universal-link association (served as `application/json`); covers `/i/*`, `/s/*`, and `/connect/*`. |
| `https://azula.app/.well-known/assetlinks.json` | Android App Links association (host-scoped, no per-path entries needed). |

Custom-scheme fallbacks: `azula://i?c=<encoded>` (current) and
`azula://connect?code=<token>` (legacy, used by the `/s/` invite page's JS and
registered by both apps).

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
   12 MCP tools (`connect`, `list_devices`, `send_message`, `get_messages`,
   `wait_for_reply`, `set_name`, `say`, `render_ui`, `update_ui`, `delete_ui`,
   `start_pairing`, `disconnect`) — see the canonical catalog in
   `azula-docs/docs/mcp-bridge.md`. One bridge holds **multiple devices** at
   once, addressed by name.

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

## Revocable, identified links

The old "Future: short, revocable links" idea here (a Worker-side `POST
ticket → id` KV/D1 mapping) is **superseded** by the invite payload scheme
documented in
[`azula-docs/docs/invitations.md`](../azula-docs/docs/invitations.md): an
invite id, validity window, and single-use flag travel in the payload itself,
and revocation is issuer-side (deleting the id from the issuer's local
issued-invite store) — no Worker storage needed. See that doc's "Trust model"
and "Stores" sections for the full design.
