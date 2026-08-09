#!/usr/bin/env sh
# unpublished: baseline for the empty registry. The site never shows a
# "you have nothing yet" screenshot, but every other registry example depends
# on starting from this state, so it is worth asserting directly rather than
# assuming.
set -eu
. "$(dirname "$0")/_lib.sh"
example_workspace

run_doc_region <<'EXAMPLE'
azula devices
azula devices --json
EXAMPLE

assert_rc 0

# The human form points at the command that fixes it...
assert_out "No devices registered."
assert_out "azula pair <URL>"
# ...and the machine form is an empty array, not null and not an error.
assert_out "[]"
