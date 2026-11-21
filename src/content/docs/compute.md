---
title: Remote compute for cloud agents
description: Give Claude Code or Codex cloud sandboxes Linux VMs on your Apple silicon Mac — commands, files, output and exit codes over iroh, with nothing exposed on your network.
order: 5
---

Cloud coding agents run in Linux containers that can't reach your machines.
`azula compute` lets one run commands and move files inside a VM on your
Apple silicon Mac: the Mac runs a small broker, the agent runs the same
`azula` binary as a client, and the two meet over iroh — through the relay if
the sandbox has no UDP, as Claude Code's doesn't. Nothing listens on your
network, and nothing the agent sends runs on the Mac itself: every command
runs in a VM.

```
cloud sandbox             your Mac                                VM (Debian 13, arm64)
azula compute exec ──iroh──▶ azula compute serve ──▶ azula-vm ──vsock──▶ azula-guest
```

## On the Mac

Hosting needs Apple silicon and macOS 13 or later. Install azula with npm or
from a release archive — both ship the VM helper (`azula-vm`) next to `azula`.

```sh
azula vm create build            # first run downloads the Debian 13 arm64 image (~300 MB, checksum-verified)
azula compute serve              # foreground broker; Ctrl-C stops it and every VM it started
```

While a VM runs, `serve` keeps the Mac from idle-sleeping (`--allow-sleep`
turns that off); closing the lid still sleeps it. In another terminal, mint a
grant for the agent:

```sh
azula compute grant --vm build --ttl 7d --label claude-code
```

It prints a token once. Store it as `AZULA_COMPUTE_TOKEN` in the cloud
environment's secrets. The token names your Mac's endpoint and relay and
carries a 256-bit secret; the Mac keeps only its hash. Mint one grant per
agent or session: a grant owns the jobs it starts. `azula compute grants`
lists grants with their last use, and `azula compute revoke <id>` ends one —
live connections close within seconds, and `--cancel-jobs` also stops its
running jobs.

## In the cloud sandbox

Allow these hosts in the environment's network settings:
`use1-1.relay.n0.iroh.link`, `usw1-1.relay.n0.iroh.link`,
`euc1-1.relay.n0.iroh.link`, `aps1-1.relay.n0.iroh.link` and `dns.iroh.link`.
Then:

```sh
npx -y @azula-app/cli compute doctor --vm build
npx -y @azula-app/cli compute exec -- uname -a
```

`doctor` checks each hop with its own deadline — relay, dial, grant, guest —
and names the one that failed. azula sends relay traffic through
`HTTPS_PROXY` and trusts the system certificate store whenever a proxy is
set, which is what sandboxes with a TLS-inspecting proxy need. Set
`AZULA_RELAY_ONLY=1` to skip direct UDP attempts entirely.

## Running commands

```sh
azula compute exec -- cargo test                       # argv runs directly, no shell
azula compute exec -- sh -c 'make -j8 && ./bin/check'   # ask for a shell explicitly
azula compute exec --cwd /home/azula/src --env RUST_LOG=debug -- cargo run
azula compute exec --timeout 1h -- ./long-build.sh
```

- stdout and stderr stay separate, and the job's exit code becomes yours.
- Jobs run as the `azula` user (passwordless `sudo` inside the VM), with a
  clean environment plus your `--env` values.
- The default timeout is 15 minutes (24 hours at most, and never past the
  grant's expiry). Ctrl-C cancels the job; a second Ctrl-C detaches instead.
- If the VM isn't running, `exec` starts it (if the grant allows VM control).
  `azula vm start|stop|status` do that explicitly.

### Jobs outlive the connection

A job keeps running if your connection drops or your sandbox goes away. Its
output is kept on the VM's disk, so nothing is lost:

- `exec` reconnects by itself for up to 5 minutes (`--reconnect`) and picks
  the output up at the exact byte where it stopped.
- If it gives up, it prints the command to get back in:
  `azula compute attach build/j_3f9a1c2b7d4e8a60`.
- `exec --detach` starts a job and prints its ref straight away.
  `azula compute jobs` lists your jobs, `logs <ref> [--follow] [--tail N]`
  reads their output, `attach <ref>` follows one to the end and exits with its
  code, and `cancel <ref>` stops one.
- A new sandbox with the same token can find and finish what an old one
  started. Results are kept for 24 hours.
- `--cancel-on-disconnect` is for work that's pointless unwatched: the job is
  cancelled once no client has been attached for 60 seconds. A job reading
  `--stdin` is always cancelled if its input is cut off partway.

Exit codes that come from azula rather than your job: `125` broker or grant
error, `124` timeout, `126` bad working directory, `127` command not found,
`130` cancelled, `255` couldn't reach the Mac, lost the connection for good,
or the job was interrupted (its VM or worker stopped).

## Moving files

Files move between your sandbox and the VM. Nothing on the Mac itself is
reachable.

```sh
azula compute push ./app.tgz build/                 # into ~/build/app.tgz in the VM
azula compute pull build/out/report.json ./         # back out
azula compute push -r ./src work/src                 # a whole tree
azula compute pull -r work/src/target/release ./out
```

Single files are checked with SHA-256 on arrival and land atomically: the
destination is the old file or the complete new one, never half of each. A
transfer cut off mid-way resumes where it stopped, and so does simply
rerunning the same command. If the remote file changed in between, the pull
starts over instead of mixing two versions. Trees go through `tar`; on the way
out, azula refuses entries with absolute paths, `..`, links pointing outside
the destination, and device files.

The public n0 relays limit how fast a single client can send. Big transfers
over the relay slow down; that's the relay's fair-use limit, not a fault.

## Several agents, several VMs

- **Two agents, one VM.** Give each its own grant. Each sees and controls only
  its own jobs, but they share the VM's files, packages and CPU — handy for a
  shared build cache, and also the risk. `vm stop` refuses while anyone's jobs
  are running unless forced.
- **Isolation.** For agents that mustn't interfere, use a VM each:
  `azula vm create agent-a`, `azula vm create agent-b`. A VM is a copy-on-write
  clone of the image and boots in about six seconds.
- **One agent, several VMs.** A grant can name several VMs or a pattern
  (`--vm 'ci-*'`). Pick one per command with `--vm` or `AZULA_COMPUTE_VM`; job
  refs carry the VM name (`ci-arm/j_…`).
- **Limits.** 16 running jobs per grant and 64 per VM. The Mac won't start a
  VM that would leave it with less than 4 GiB of free memory.

## What's isolated from what

- The VM is a clone of a pristine image with its own disk, machine identifier
  and MAC address. It reaches the internet through NAT; like any device on
  your network, it can reach services the Mac serves on its network
  interfaces, but not ones bound to `127.0.0.1`.
  `azula vm create --network none` gives a VM no network at all.
- The worker inside the VM is reachable only over the VM's virtio socket,
  through a Unix socket only your user can open. The guest holds no azula
  key, token or credential, and its only share is the read-only directory the
  worker runs from. Nothing else in the guest listens.
- A grant can't do anything on the Mac except what the broker exposes: run
  jobs and move files in the VMs it names and, if allowed, start and stop
  them.

VMs live in `~/.azula/vm/vms/<name>`; `azula vm delete <name>` removes one.
