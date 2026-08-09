#!/usr/bin/env sh
# docs/cli.md, `azula run`: "`never` is a pure PTY passthrough", and "exits
# with the command's *original* exit code".
#
# Offline by construction: with `--handoff never`, `run_inner` returns at
# cli/run_cmd.rs:140-142 — before any endpoint is bound, any session is created
# or any connect block is printed. `on-error` and `always` would bind, so they
# cannot be examples.
#
# No TTY is needed either: `local_pty_size` falls back to 50x200 when stdout is
# not a terminal (run_cmd.rs:238-243, whose comment calls this "the common CI
# case"), and stdin is never forwarded (`drop(pty.in_tx)`, run_cmd.rs:179).
set -eu
. "$(dirname "$0")/_lib.sh"
example_workspace

run_doc_region <<'EXAMPLE'
azula run --handoff never -- sh -c 'echo building; exit 3'
echo "exit code: $?"
EXAMPLE

assert_rc 0

# The wrapped command's output is mirrored through the PTY unmodified...
assert_out "building"
# ...and its exit code becomes azula's own, which is the property CI depends on.
assert_out "exit code: 3"
