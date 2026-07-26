---
title: Install the CLI
description: Homebrew, cargo, or npx — plus building from source, which works today.
order: 2
---

`azula` is a single Rust binary with no runtime dependencies. Prebuilt
binaries, an npm wrapper and a Homebrew tap all publish from the same GitHub
Release.

> **Not released yet.** The three package channels below go live with the
> first tagged release. Until that tag exists, [build from
> source](#build-from-source) — it takes one `cargo build`.

## Homebrew — macOS, Linux

```sh
brew install azula-app/azula/azula
```

## cargo — anywhere with a Rust toolchain

```sh
cargo install azula
```

Builds and installs the `azula` binary from the crates.io source package.

## npx — no install at all

```sh
npx -y azula-cli --version
```

`azula-cli` is a meta package: it fetches the right prebuilt binary for your
platform as an npm optional dependency (`@azula-app/cli-darwin-arm64`,
`-darwin-x64`, `-linux-x64`, or `-linux-arm64`) and execs it. Nothing to
install ahead of time, which makes it the most portable way to get azula into
an ephemeral environment — a container, a CI runner, a coding-agent sandbox.
Pin an exact version with `npx -y azula-cli@<version> …` if you don't want to
float on latest.

## Build from source

```sh
git clone https://github.com/Azula-App/azula-cli
cd azula-cli
cargo build --release
```

The binary lands at `target/release/azula`. Requires a recent stable Rust
toolchain; the first build fetches crates from crates.io, so it needs network
access. `cargo build` at the workspace root also builds the `azula-demos`
binary — add `-p azula` to build just the production CLI.

## Verify it works

```sh
azula status
```

`status` reads local state and binds nothing, so it's safe to run anywhere. It
prints this machine's identity, the devices you've paired, and any local
sessions.

## Networks without UDP

iroh prefers a direct hole-punched QUIC path and falls back to relaying over
HTTPS when it can't get one. In an environment whose egress is proxied HTTPS
only — some CI runners and agent sandboxes — the fallback is the *only* path,
so the proxy allowlist has to permit n0's relay hosts:

| Region  | Hostname                    |
| ------- | --------------------------- |
| NA East | `use1-1.relay.n0.iroh.link` |
| NA West | `usw1-1.relay.n0.iroh.link` |
| EU      | `euc1-1.relay.n0.iroh.link` |
| AP      | `aps1-1.relay.n0.iroh.link` |

All over HTTPS on 443. If those hosts are blocked, azula cannot reach the
phone from that environment at all.
