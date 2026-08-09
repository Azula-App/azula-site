#!/usr/bin/env sh
# Shared harness for azula-site's executable documentation examples.
#
# Every example sources this, calls `example_workspace`, then feeds its
# published region to `run_doc_region` as a quoted heredoc:
#
#     run_doc_region <<'EXAMPLE'
#     azula status
#     EXAMPLE
#
# Nothing else in the file is published. The heredoc body is the only text that
# appears on the site, and the doc-examples skill's check-doc-examples.mjs
# asserts it is byte-identical to the fenced block it is tagged from.
#
# The heredoc matters: it makes the region *data* rather than live code. Marker
# comments around ordinary shell lines would run inline as the script executed
# and then run a second time inside the harness — and any example whose region
# exits non-zero (run-exit-code.sh) would kill the script outright under
# `set -e`. Quoting the delimiter also stops the shell expanding `$?` or `$1`
# in the region before it is published.
#
# ISOLATION. These run on a real machine, not a throwaway CI runner, so an
# example that leaked would write into the reader's actual identity and paired
# devices. `azula` resolves every stateful path from HOME, TMPDIR, or an
# AZULA_*_DIR override (registry.rs:61, identity.rs:20, session.rs:133,
# invite.rs:240, mailbox.rs:16, linked_identity.rs:41, filexfer.rs:149,
# core/state.rs:33, cli/terminal_cmd.rs:364). We redirect all of them into a
# mktemp tree that is removed on exit.
#
# Two deliberate choices:
#
#   * AZULA_REGISTRY_DIR is left UNSET. Setting it makes `override_dir`
#     (registry.rs:60-70) collapse the project and global registries into one
#     directory distinguished only by filename — which would bypass exactly the
#     git-root/$HOME behaviour docs/cli.md documents and registry-precedence.sh
#     proves. Isolation comes from HOME and cwd instead.
#
#   * TMPDIR is redirected because `session_statuses` (core/status.rs:104-106)
#     scans `std::env::temp_dir()` for ephemeral session keys with no override
#     available. Without this, `azula status` would report sessions belonging
#     to whatever else is running on the machine.

set -eu

: "${AZULA_BIN:?AZULA_BIN must point at the azula binary under test}"

# A fresh, empty state tree. Called first by every example.
example_workspace() {
  WORK=$(mktemp -d "${TMPDIR:-/tmp}/azula-example-XXXXXX")
  export WORK
  mkdir -p "$WORK/home" "$WORK/tmp" "$WORK/project" "$WORK/bin" "$WORK/state"

  HOME="$WORK/home";  export HOME
  TMPDIR="$WORK/tmp"; export TMPDIR

  # Everything that derives from neither HOME nor TMPDIR, made explicit.
  AZULA_KEY_DIR="$WORK/state/keys";           export AZULA_KEY_DIR
  AZULA_SESSIONS_DIR="$WORK/state/sessions";  export AZULA_SESSIONS_DIR
  AZULA_STATE_DIR="$WORK/state/runtime";      export AZULA_STATE_DIR
  AZULA_RUNTIME_DIR="$WORK/state/terminals";  export AZULA_RUNTIME_DIR
  AZULA_INVITES_DIR="$WORK/state/invites";    export AZULA_INVITES_DIR
  AZULA_MAILBOX_DIR="$WORK/state/mailbox";    export AZULA_MAILBOX_DIR
  AZULA_LINK_DIR="$WORK/state/link";          export AZULA_LINK_DIR
  AZULA_RECEIVED_DIR="$WORK/state/received";  export AZULA_RECEIVED_DIR
  unset AZULA_REGISTRY_DIR || true
  unset AZULA_SESSION || true

  # `azula` on PATH is the binary under test, so a published line can say
  # `azula` and the same text runs against a local cargo build or a published
  # release depending only on $AZULA_BIN.
  ln -sf "$AZULA_BIN" "$WORK/bin/azula"
  PATH="$WORK/bin:$PATH"; export PATH

  cd "$WORK/project"
  trap 'cd /; rm -rf "$WORK"' EXIT
}

# Mark cwd as a project root. `registry::project_path` (registry.rs:80) only
# tests `dir.join(".git").exists()` — no git binary, no real repository.
example_git_root() { mkdir -p .git; }

# Run the published region — read verbatim from stdin — in a fresh `sh`, the
# same interpreter the ```sh fence claims, capturing stdout, stderr and the
# exit status. The region executes exactly as published: no wrapper, no
# `set -e`, no substitutions. That is what makes the published text the tested
# text rather than a copy of it.
run_doc_region() {
  cat > "$WORK/region.sh"
  set +e
  sh "$WORK/region.sh" > "$WORK/stdout" 2> "$WORK/stderr"
  DOC_RC=$?
  set -e
  # `azula run` mirrors through a PTY, so its output carries CRLF and line
  # discipline bytes. Strip CR before any comparison.
  DOC_OUT=$(tr -d '\r' < "$WORK/stdout")
  DOC_ERR=$(tr -d '\r' < "$WORK/stderr")
  export DOC_RC DOC_OUT DOC_ERR
}

fail() {
  printf '  x %s\n' "$1" >&2
  printf '    exit: %s\n' "${DOC_RC-?}" >&2
  printf '    stdout:\n' >&2
  printf '%s\n' "${DOC_OUT-}" | sed 's/^/      /' >&2
  printf '    stderr:\n' >&2
  printf '%s\n' "${DOC_ERR-}" | sed 's/^/      /' >&2
  exit 1
}

assert_rc() {
  [ "$DOC_RC" = "$1" ] || fail "expected exit $1, got $DOC_RC"
}

# Substring, not equality: see the header note on JSON key ordering and PTY
# output. `grep -F` so callers never have to escape anything.
assert_out() {
  printf '%s\n' "$DOC_OUT" | grep -qF -- "$1" || fail "stdout does not contain: $1"
}

assert_err() {
  printf '%s\n' "$DOC_ERR" | grep -qF -- "$1" || fail "stderr does not contain: $1"
}

assert_out_missing() {
  printf '%s\n' "$DOC_OUT" | grep -qF -- "$1" && fail "stdout unexpectedly contains: $1"
  return 0
}

# A row of `azula devices`' aligned table, matched as an extended regex.
assert_row() {
  printf '%s\n' "$DOC_OUT" | grep -qE -- "$1" || fail "no output row matching: $1"
}

assert_no_row() {
  printf '%s\n' "$DOC_OUT" | grep -qE -- "$1" && fail "unexpected output row matching: $1"
  return 0
}

assert_file() {
  [ -f "$1" ] || fail "expected file to exist: $1"
}

# Evaluate a jq filter against the LAST non-empty line of stdout, which is
# where a `--json` verb's payload lands when the region also printed
# human-readable lines before it. Used instead of golden JSON comparison: the
# same binary emits alphabetical keys for `json!`-built maps and declaration
# order for derived structs, so key order is not a contract worth pinning to.
assert_json() {
  printf '%s\n' "$DOC_OUT" | grep -v '^[[:space:]]*$' | tail -1 \
    | jq -e "$1" > /dev/null 2>&1 || fail "jq filter failed on last output line: $1"
}
