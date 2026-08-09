#!/usr/bin/env sh
# unpublished: `azula qr` appears in the command table rather than in a fenced
# block, so there is nothing to keep in sync — but the table row is only true
# if the command actually renders, so it is covered here.
#
# Offline by construction: `cmd_qr` (cli/legacy.rs:283-293) is `parse_ticket`
# plus `render_qr`, both pure string work.
#
# Note `qr` uses `parse_ticket`, NOT the invite-aware `parse`. Feeding it an
# `azula.app/i/<azi…>` invite URL falls through to the bare-token branch and
# double-wraps the result, so the table's "any ticket, URL or token" should not
# be read as including invite links.
set -eu
. "$(dirname "$0")/_lib.sh"
example_workspace

run_doc_region <<'EXAMPLE'
azula qr https://azula.app/s/cccccccc-phone-new
EXAMPLE

assert_rc 0

assert_out "Pairing code:"
assert_out "https://azula.app/s/cccccccc-phone-new"
assert_out "Scan with your phone's camera"

# The QR itself: half-block glyphs from the Dense1x2 renderer.
assert_out "▀"
