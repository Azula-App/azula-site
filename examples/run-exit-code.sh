#!/usr/bin/env sh
# unpublished: run-passthrough.sh publishes the readable version of this. This
# one asserts the guarantee in its bare form — that `azula run` *itself* exits
# with the wrapped command's code, not merely that the code is observable
# through `$?` inside a script.
#
# docs/cli.md: "exits with the command's *original* exit code — so CI still
# reports the failure".
set -eu
. "$(dirname "$0")/_lib.sh"
example_workspace

run_doc_region <<'EXAMPLE'
azula run --handoff never -- false
EXAMPLE

# The last (and only) command's status is azula's own process status.
assert_rc 1
