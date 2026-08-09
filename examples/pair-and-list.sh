#!/usr/bin/env sh
# docs/cli.md: `azula pair <URL>` saves a device's ticket to the registry, and
# `azula devices` lists the merged result.
#
# Offline by construction — see registry-precedence.sh for why `cmd_pair`
# touches no network and why a placeholder token is enough. Note this uses the
# legacy `/s/<token>` form deliberately: the `azula.app/i/<azi…>` invite form
# goes through `InvitePayload::decode`, which needs a real minted invite, and
# minting one binds an endpoint.
set -eu
. "$(dirname "$0")/_lib.sh"
example_workspace
example_git_root

run_doc_region <<'EXAMPLE'
azula pair cccccccc-phone-new --name phone
azula devices --json
EXAMPLE

assert_rc 0

# Confirmation names the device and abbreviates the ticket.
assert_out "Paired device 'phone'"

# Assert on structure with jq rather than a golden string: `devices --json` is
# built with `json!`, whose maps serialise alphabetically, while `status --json`
# derives from structs and serialises in declaration order. Key order is not a
# contract worth pinning a doc example to.
assert_json 'length == 1'
assert_json '.[0].name == "phone"'
assert_json '.[0].source == "project"'
assert_json '.[0].fingerprint == "cccccccc"'
