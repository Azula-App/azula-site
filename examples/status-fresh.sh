#!/usr/bin/env sh
# docs/install.md, "Verify it works".
#
# Offline by construction: `core::status::compute` is documented as "computed
# purely from disk, binding no endpoint", and it reads the machine key with
# `load_machine_secret_if_exists` rather than creating one. This is the one
# command that is safe to run absolutely anywhere, which is exactly why the
# install page ends on it.
set -eu
. "$(dirname "$0")/_lib.sh"
example_workspace

run_doc_region <<'EXAMPLE'
azula status
EXAMPLE

assert_rc 0

# A machine that has never paired anything: no identity file, no registry, no
# sessions. Every line the page promises is present.
assert_out "Machine identity: none"
assert_out "No devices registered."
assert_out "No local sessions."

# The claim that makes it safe to run anywhere: nothing was created.
[ ! -e "$HOME/.azula" ] || fail "azula status created $HOME/.azula — it must bind and write nothing"
