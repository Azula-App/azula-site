#!/usr/bin/env sh
# docs/cli.md, "Scripting it directly": "learn the A2UI vocabulary once".
#
# Offline by construction: `cmd_catalog` prints a compile-time constant
# (cli/ui.rs:196-203). Zero I/O of any kind.
set -eu
. "$(dirname "$0")/_lib.sh"
example_workspace

run_doc_region <<'EXAMPLE'
azula ui catalog
EXAMPLE

assert_rc 0

# The three sections a script author needs before writing a component array.
assert_out "STRUCTURE:"
assert_out "COMPONENTS"
# The invariant every other example's payload has to satisfy.
assert_out '"id":"root"'
