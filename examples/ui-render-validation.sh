#!/usr/bin/env sh
# docs/cli.md, "Scripting it directly": a malformed component tree is rejected
# locally, before anything is sent.
#
# Offline by construction, and this is the one place that fact is load-bearing
# rather than incidental: `read_input` and `parse_and_validate_components` run
# at cli/ui.rs:101-117 and exit 2 on failure, with the source comment
# "Validation runs before any endpoint is bound or device dialed — nothing is
# sent on rejection." `core::establish` is only reached at line 131. A *valid*
# payload would proceed to bind, so only the rejection path can be an example.
set -eu
. "$(dirname "$0")/_lib.sh"
example_workspace

run_doc_region <<'EXAMPLE'
echo '[{"id":"card","component":"Text","text":"hi"}]' | azula ui render -
echo "exit code: $?"
EXAMPLE

assert_rc 0

# The specific complaint, not just "some error": every surface needs a root.
assert_err 'the component list needs one component with "id":"root"'
assert_out "exit code: 2"

# Rejected locally means no device was dialed and no state was written.
[ ! -e "$HOME/.azula" ] || fail "a rejected render wrote to $HOME/.azula"
