---
title: azula
description: Peer-to-peer chat, remote shells, and an LLM bridge over a direct, end-to-end encrypted iroh link.
---

azula links two devices straight to each other over
[iroh](https://iroh.computer): UDP holepunched, QUIC encrypted, no server in the
middle. Chat with a peer, drive a remote shell, or push messages into an LLM
session — all over the same direct link.

## What it does

- **Peer chat.** Paste a friend's code and you're talking over a direct,
  encrypted link. No account.
- **LLM via MCP.** Connect an LLM to your session through an MCP server running
  on your own machine — it talks to your app, not a third party.
- **Remote shell.** Hand a server's shell to your phone or desktop and drive it
  from anywhere.

## Getting started

The app is coming to the App Store and Google Play. Install the CLI today:

```sh
cargo install azula
```

Then start an MCP server and scan the pairing code it prints:

```sh
azula mcp
```

- [Install the CLI](https://azula.app/docs/install)
- [Command reference](https://azula.app/docs/cli)
- [Connect an LLM over MCP](https://azula.app/docs/mcp)
- [Links and URL scheme](https://azula.app/docs/links)
- [Source on GitHub](https://github.com/Azula-App)
- [Privacy](https://azula.app/privacy)
