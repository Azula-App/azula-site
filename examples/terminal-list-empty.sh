#!/usr/bin/env sh
# unpublished: `azula terminal list` is published only inside the terminal
# block, which is illustrative as a whole because `terminal new` and `attach`
# bind endpoints. `list` alone is pure disk, so it can still be covered here.
#
# Offline by construction: `read_all_states` walks AZULA_RUNTIME_DIR and checks
# `pid_alive` (cli/terminal_cmd.rs:492-524). No endpoint, no dial.
set -eu
. "$(dirname "$0")/_lib.sh"
example_workspace

run_doc_region <<'EXAMPLE'
azula terminal list
azula terminal list --json
EXAMPLE

assert_rc 0

assert_out "No detached terminal sessions."
assert_out "[]"
