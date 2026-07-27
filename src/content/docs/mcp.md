---
title: Connect an LLM over MCP
description: One mcp.json block, one pairing scan — then your agent can message your phone, send files, and draw UI on it.
order: 4
---

`azula mcp` is a [Model Context Protocol](https://modelcontextprotocol.io)
server that bridges an LLM client to your devices over iroh. It speaks stdio by
default, or Streamable HTTP with `--http`.

## Configure it once

```jsonc
{
  "mcpServers": {
    "azula": {
      "command": "npx",
      "args": ["-y", "@azula-app/cli", "mcp"]
    }
  }
}
```

`npx -y @azula-app/cli mcp` works on a machine that has never touched azula
before — nothing to install ahead of time, which is what makes this entry
portable across machines, containers, and CI runners. If you'd rather not go
through npm, `cargo install azula` and use `"command": "azula", "args":
["mcp"]` instead.

For an HTTP transport, run the server yourself and point the client at it:

```sh
azula mcp --http 127.0.0.1:8765
```

## Then pair a device

On first run the server prints a pairing URL and a QR block. Scan it with the
app once and you're done — you've paired the **machine**, so every later
`azula mcp`, `azula run` or `azula terminal` session on it is auto-admitted
without another prompt.

Already have a device saved? Pair from either side:

```sh
azula pair https://azula.app/i/<payload> --name phone
```

…or hand the agent the link in chat and let it call the `connect` tool.

## The tools

| Tool | Arguments | What it does |
| --- | --- | --- |
| `connect` | `url`, `name?` | Parse a ticket/URL, save it to the registry, dial it |
| `list_devices` | — | Registry + in-memory devices with fingerprint and status |
| `send_message` | `device`, `text` | Stream text to the device as a chat reply |
| `send_file` | `device`, `path`, `caption?` | Send a local file inline — this is how you send an image |
| `get_messages` | `device?` | Non-blocking drain of one inbox, or all of them |
| `wait_for_reply` | `device`, `timeout_s?` | Long-poll one inbox until it has something (default 120s) |
| `set_name` | `description?`, `name?`, `device?` | Set the conversation's displayed name and description |
| `say` | `device`, `text`, `done?` | Bridge-to-bridge chat with a peer's agent, turn-capped |
| `render_ui` | `device`, `components`, `data_model?`, `surface_id?` | Draw an A2UI surface on the device |
| `update_ui` | `device`, `surface_id`, `path`, `value` | Patch a surface's data model at a JSON pointer |
| `delete_ui` | `device`, `surface_id` | Remove a surface |
| `start_pairing` | — | Return this bridge's pairing URL and QR to show the user |
| `disconnect` | `device`, `forget?` | Drop the connection; `forget` also deletes it from the registry |

The usual loop is `send_message` or `render_ui` → `wait_for_reply` → react with
`update_ui`.

## What happens when the phone is asleep

`send_message` and `say` are queued: delivery is tried direct, then through
your [relay](/docs/cli#azula-relay--the-always-on-sibling) if one is enrolled,
then a local mailbox. They report success as "queued (offline)" rather than
failing.

`render_ui` and `delete_ui` can also be queued to a relay as a surface snapshot
replayed on reconnect. `update_ui` can only be queued if the same session
rendered the surface, since a patch needs the state it applies to.

`send_file` is never queued — a file transfer needs a live connection.

## Why the bridge runs on your machine

Cloudflare Workers can't open iroh connections — no raw UDP, no long-lived
holepunched sockets — so `azula.app/mcp` is an informational placeholder, not a
functioning MCP endpoint. The real server is the `azula mcp` process next to
you, which is also the honest arrangement: your messages never pass through
anything we run.

The privacy consequence is worth stating plainly: whatever you route through
the bridge goes to whichever LLM provider you configured, and their policy
governs it from there. See [privacy](/privacy).
