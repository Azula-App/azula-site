#!/usr/bin/env sh
# unpublished: `azula qr` appears in the command table rather than in a fenced
# block, so there is nothing to keep in sync — but the table row is only true
# if the command actually renders, so it is covered here.
#
# Offline by construction: `cmd_qr` (cli/legacy.rs) is `parse_ticket` plus
# `render_qr`, both pure string work.
#
# Note `qr` uses `parse_ticket`, NOT the invite-aware `parse`. `parse_ticket`
# now takes a bare ticket only — every URL form is rejected, including an
# `azula.app/i/<azi…>` invite link — so the table's "any ticket, URL or token"
# should be read as "a bare ticket". Asserted below.
set -eu
. "$(dirname "$0")/_lib.sh"
example_workspace

run_doc_region <<'EXAMPLE'
azula qr cccccccc-phone-new
EXAMPLE

assert_rc 0

assert_out "Pairing code:"
assert_out "cccccccc-phone-new"
assert_out "Scan with your phone's camera"

# The QR itself: half-block glyphs from the Dense1x2 renderer.
assert_out "▀"

# A URL-wrapped ticket is no longer a ticket: the retired legacy forms, and any
# other URL, are rejected rather than passed through as a bare token. Checked
# outside the published region, so it stays out of the doc block.
set +e
legacy_err=$(azula qr https://azula.app/s/cccccccc-phone-new 2>&1)
legacy_rc=$?
set -e
[ "$legacy_rc" = 1 ] || fail "expected a legacy URL to be rejected, got exit $legacy_rc"
printf '%s\n' "$legacy_err" | grep -qF -- "could not extract a token" ||
  fail "expected the rejection to name the parse failure, got: $legacy_err"
