---
title: Using the CLI
description: The noun-verb command surface, the pair-once session model, and the workflows worth learning first.
order: 3
---

`azula` is a noun-verb CLI over one shared session core — the same core the
[MCP tools](/docs/mcp) use. Anything an LLM can do through the bridge, a shell
script can do by shelling out to these verbs.

## Command overview

| Command | Does |
| --- | --- |
| `azula mcp [--http BIND] [--session NAME] [--device URL]…` | MCP server for an LLM client — stdio by default, Streamable HTTP with `--http` |
| `azula message send [--device D] TEXT` | Send a chat-style message (queues via the relay or local mailbox if the device is unreachable) |
| `azula message recv [--device D] [--wait SECS]` | Drain, or long-poll for, inbound messages |
| `azula watch [--device D] [--json]` | Follow a device's inbox continuously: messages, UI events, files, connect/disconnect |
| `azula ui render [--device D] [--surface ID] FILE\|-` | Render an A2UI surface from a components JSON file or stdin |
| `azula ui update --surface ID POINTER VALUE` | Update a surface's data model at an RFC 6901 pointer |
| `azula ui delete --surface ID` | Remove a rendered surface |
| `azula ui catalog` | Print the A2UI component/prop vocabulary |
| `azula file send [--device D] PATH [--caption TEXT]` | Send a local file as an inline attachment (needs a live connection) |
| `azula run [--handoff on-error\|always\|never] -- CMD…` | Run a command in a PTY; on failure, hand off to a live shell in the same session |
| `azula terminal [new\|list\|attach\|kill]` | Host, manage, or attach to persistent named terminal sessions |
| `azula relay` | Serve the identity's always-on relay role |
| `azula status [--json]` | Machine identity, known devices, local sessions — reads disk, binds nothing |
| `azula devices [--json]` | List the merged device registry |
| `azula pair <URL> [--name N] [--global]` | Save a device's ticket to the registry |
| `azula qr <CODE>` | Print a QR code for any ticket, URL or token |
| `azula invite [--expires W] [--sign] [--single-use] [--bridge]` | Mint a signed invite; `azula invite revoke <id-prefix>` deletes one |
| `azula invites` | List invites this node has issued |
| `azula link [--name N] [--relay]` | Enroll this CLI as a sibling device of an existing identity |

Every command supports `--help`. The one-shot verbs (`message`, `ui`, `file`,
`watch`) also support `--json` for machine-readable output.

## Pair once, then every process is its own conversation

Every azula process binds its **own** session keypair and presents a
short-lived certificate signed by this machine's stable identity
(`~/.azula/machine.key`). The practical consequences:

- **You pair the machine, not the process.** Redeem one invite on the phone —
  from a startup banner, `azula invite --bridge`, or a connect block — and
  every session that machine's processes create afterward is auto-admitted,
  no further prompt.
- **Two agents don't collide.** Two Claude Code windows each running
  `azula mcp` show up as two separate conversations on the phone. That's the
  design, not a bug.
- **Reuse a conversation with `--session NAME`** (or `AZULA_SESSION`). The
  one-shot verbs default to a shared session named `cli`, so casual use from
  any terminal lands in one "CLI" conversation. `azula mcp`, `azula run` and
  `azula terminal` default to a fresh session per invocation.
- **Ephemeral environments pair per session.** A container or CI runner with
  no `~/.azula/machine.key` self-certifies instead of writing a standing
  credential: each process prints its own pairing URL and QR, and you approve
  it individually.

## `azula run` — hand a failing command to your phone

```sh
azula run --handoff on-error -- make test
```

Runs `make test` in a captured PTY, mirroring output to your real terminal or
CI log unmodified. On a nonzero exit it keeps that output as scrollback, spawns
a live shell in the *same* working directory, and prints a connect block — an
invite URL plus a QR you can scan straight off a CI log you're reading on your
phone. Whoever attaches sees the failed command's output followed by a live
prompt.

`azula run` stays alive until that session ends (or `--hold` expires, default
60 minutes), then exits with the command's **original** exit code — so CI still
reports the failure even though someone poked around afterwards.

`--handoff on-error` is the default; `always` hands off regardless of exit
code; `never` is a pure PTY passthrough — output is mirrored unmodified and the
wrapped command's exit code becomes azula's own, which is what lets you wrap a
CI step without changing what CI sees:

<!-- example: run-passthrough -->

```sh
azula run --handoff never -- sh -c 'echo building; exit 3'
echo "exit code: $?"
```

## `azula terminal` — persistent named shells

```sh
azula terminal                                 # host one interactive shell inline
azula terminal new --cmd "claude" --name work  # spawn a detached, named session
azula terminal list                            # see what's running (--json too)
azula terminal attach work                     # continue it from any shell
azula terminal kill work                       # tear it down
```

`attach` is a raw-mode passthrough with no terminal emulator in the way, and it
takes a name from `terminal list` *or* any invite URL or ticket — including one
from an `azula run` connect block. So a session started in CI can be continued
from a laptop shell as easily as from the phone. Detach with `Ctrl-\`.

## Scripting it directly

Everything the MCP tools do is available to a shell script through the same
verbs plus `azula watch --json`. Learn the vocabulary once:

<!-- example: ui-catalog -->

```sh
azula ui catalog
```

A component list is validated locally, before any device is dialed — a bad
tree fails fast with exit code 2 rather than half-drawing a surface:

<!-- example: ui-render-validation -->

```sh
echo '[{"id":"card","component":"Text","text":"hi"}]' | azula ui render -
echo "exit code: $?"
```

Put together: render a surface under a known id, then answer its events by
updating the data model at that same id.

```sh
echo '[
  {"id":"root","component":"Column","children":["title","face","roll"]},
  {"id":"title","component":"Text","text":"AZULA · DICE","variant":"caption"},
  {"id":"face","component":"Text","text":{"path":"/you"},"variant":"h1"},
  {"id":"rollL","component":"Text","text":"ROLL"},
  {"id":"roll","component":"Button","child":"rollL","variant":"primary",
   "action":{"event":{"name":"roll"}}}
]' | azula ui render --device phone --surface dice --data-model '{"you":"?"}' -

azula watch --device phone --json | while read -r line; do
  case "$line" in
    *'"type":"ui_event"'*'"name":"roll"'*)
      azula ui update --device phone --surface dice /you '"⚄"'
      ;;
  esac
done
```

## `azula relay` — the always-on sibling

```sh
azula link --relay   # enroll this device once
azula relay          # then run it, e.g. under systemd or launchd
```

A relay is an ordinary sibling device of your identity that commits to always
being reachable. It stores and forwards peer chat, bootstraps a brand-new
device's history, and — since a session can't always reach the phone directly —
relays agent chat and bounded A2UI snapshots for delivery on the phone's next
sync.

Delivery order for a session is: direct to the phone first, the relay second,
the local per-device mailbox last. Interactive terminal traffic and file
transfers are **never** relayed — those always need a direct connection.

## Where state lives

| Registry | Path | When used |
| --- | --- | --- |
| project | `<git-root>/.azula/devices.json` | Inside a git tree; commit it for team use |
| global | `~/.azula/devices.json` | Always consulted; written by `azula pair --global` |
| relay hints | `relay-hints.json` beside each `devices.json` | Which relay ticket to try for a device |
| sessions | `~/.azula/sessions/<name>.key`, `$TMPDIR/azula/sessions/` | Session key material |

`azula pair` writes a device into one of those registries — no network, it just
decodes the link and saves it — and `azula devices` reads the merged result.
The ticket below is a placeholder; a real one comes from the app or an
`azula invite`. `pair` takes an invite link, a bare `azi…` payload, or a bare
ticket like these.

<!-- example: pair-and-list -->

```sh
azula pair cccccccc-phone-new --name phone
azula devices --json
```

Reads merge global then project, and project wins on a name collision — so a
checkout can point a shared name at its own device without disturbing the
global entry:

<!-- example: registry-precedence -->

```sh
azula pair --global aaaaaaaa-backup-key --name backup
azula pair --global bbbbbbbb-phone-old --name phone
azula pair          cccccccc-phone-new --name phone

azula devices
```

`backup` is only global so it survives untouched; `phone` resolves to the
project ticket.
