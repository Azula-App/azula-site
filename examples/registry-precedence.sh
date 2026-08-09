#!/usr/bin/env sh
# docs/cli.md, "Where state lives": "Reads merge global then project, and
# project wins on a name collision."
#
# Offline by construction. `cmd_pair` (cli/legacy.rs:183) is a *synchronous*
# fn: it parses the link, builds a registry::Device and writes JSON. Nothing
# binds an endpoint. The legacy `/s/<token>` form needs no valid ticket —
# `link::parse_ticket` returns the token unvalidated (link.rs:327-334, "No
# network access is performed"), and `cmd_devices` only ever shows its first
# eight characters as a fingerprint. So the tokens below are readable
# placeholders, not credentials.
set -eu
. "$(dirname "$0")/_lib.sh"
example_workspace
example_git_root   # so plain `pair` writes <cwd>/.azula (registry.rs:80)

run_doc_region <<'EXAMPLE'
azula pair --global aaaaaaaa-backup-key --name backup
azula pair --global bbbbbbbb-phone-old --name phone
azula pair          cccccccc-phone-new --name phone

azula devices
EXAMPLE

assert_rc 0

# `backup` exists only globally, so it survives. `phone` exists in both and the
# project entry wins — which is only observable because the two were given
# different tickets.
assert_row '^backup +aaaaaaaa… +global$'
assert_row '^phone +cccccccc… +project$'

# The shadowed global entry appears nowhere in the table. Matched as a row
# rather than a bare substring: `pair`'s own confirmation line echoes the
# ticket it just saved, so `bbbbbbbb` legitimately appears earlier in stdout.
assert_no_row '^phone +bbbbbbbb'

# The two paths the page's table names are the two paths that were written.
assert_file "$HOME/.azula/devices.json"
assert_file "$WORK/project/.azula/devices.json"
