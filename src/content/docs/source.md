---
title: Source
description: Every azula repo on GitHub — app, CLI, transport bindings, specs, and this site.
order: 6
---

azula is split across sibling repos on
[github.com/Azula-App](https://github.com/Azula-App). There is no monorepo —
each one builds, versions and ships on its own.

| Repo | What's in it |
| --- | --- |
| [azula-cli](https://github.com/Azula-App/azula-cli) | The Rust CLI and MCP server: `azula mcp`, `run`, `terminal`, `relay`, and the shared session core underneath them |
| [azula-app](https://github.com/Azula-App/azula-app) | The Kotlin Multiplatform / Compose app — Android, iOS, desktop |
| [iroh-kmp](https://github.com/Azula-App/iroh-kmp) | Kotlin Multiplatform bindings for [iroh](https://iroh.computer) (`app.azula.iroh`), the transport the app runs on |
| [azula-site](https://github.com/Azula-App/azula-site) | This site — Astro, deployed to Cloudflare Workers |
| [azula-docs](https://github.com/Azula-App/azula-docs) | Cross-repo specs and design notes, kept as an [OpenSpec](https://github.com/Fission-AI/OpenSpec) tree |

## Where the design lives

`azula-docs` is the interesting one if you want to know *why* rather than
*what*. Each capability has a `spec.md` of normative requirements next to a
`design.md` of prose — wire formats, test vectors, and the reasoning behind
them. The invitation payload layout, the A2UI protocol, the session-identity
model and the terminal protocol are all documented there in more detail than
this site carries.

## Protocols on the wire

| ALPN | Protocol |
| --- | --- |
| `azula/llm/0` | Agent chat, MCP bridge traffic, A2UI snapshots |
| `azula/term/0` | Remote shell, persistent-session capable |
| `azula/chat/0` | Peer chat, store-and-forward |
| `azula/sync/0` | Identity log sync and bootstrap |
| `azula/link/0` | Device-linking enrollment |

Framing is newline-delimited JSON, one `Frame` object per line, internally
tagged on a `"type"` field.
