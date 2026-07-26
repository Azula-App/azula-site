---
title: Overview
description: What azula is, and the two ways into it — the app on your phone and the CLI on your machine.
order: 1
---

azula connects two devices **directly**: a UDP-holepunched, QUIC-encrypted
[iroh](https://iroh.computer) link with no account, no broker, and no server
holding your messages. What travels over that link is up to you — chat, files,
a live terminal, or an LLM driving agent-drawn UI on your phone.

There are two halves, and you generally want both:

- **The app** — Android, iOS and desktop. This is the "phone" end: your
  conversations, your terminal viewer, the surface an agent draws on.
- **The CLI** — `azula`, a single Rust binary. This is the "machine" end: it
  hosts terminals, sends messages and files, and runs the MCP server that lets
  an LLM talk to your phone.

## Start here

1. [Install the CLI](/docs/install) — Homebrew, cargo, or `npx`, plus building
   from source.
2. [Command reference](/docs/cli) — the noun-verb surface, and the
   pair-once/session-per-process model that makes concurrent agents work.
3. [Connect an LLM over MCP](/docs/mcp) — one `mcp.json` block, then pair.
4. [Links and URL scheme](/docs/links) — what `azula.app/i/…` and `azula://…`
   links are, and how they open the app.
5. [Source](/docs/source) — every repo on GitHub.

## The 60-second version

Install the CLI, start an MCP server, and scan the pairing code it prints with
the app:

```sh
azula mcp
```

Or skip MCP entirely and drive it from a shell:

```sh
azula message send --device phone "build finished"
azula watch --device phone --json
azula run --handoff on-error -- make test
```

That last one is the one people keep: it runs your command in a PTY, and if it
fails it holds the session open — scrollback included — so you can pick the
shell up from your phone where it died.

## Reading this site as an LLM

Every page here has a Markdown twin at the same path plus `.md` — this page is
[/docs.md](/docs.md), the CLI reference is [/docs/cli.md](/docs/cli.md).
[/llms.txt](/llms.txt) indexes all of them, and
[/llms-full.txt](/llms-full.txt) is the whole site as one document.
