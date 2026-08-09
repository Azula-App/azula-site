#!/usr/bin/env sh
# Run azula-site's executable documentation examples.
#
#   examples/run.sh                              # all of them
#   examples/run.sh ui-catalog registry-precedence   # a subset
#   AZULA_BIN=… examples/run.sh                  # against a specific binary
#
# $AZULA_BIN is the single seam. Point it at ../azula-cli/target/release/azula
# to find out whether a CLI change invalidated the docs; point it at a release
# to find out whether the docs match what readers actually have installed.
# The scripts and assertions are identical either way.
#
# Every example isolates itself into a mktemp tree (see _lib.sh) — nothing here
# touches your real ~/.azula.
set -eu

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [ -z "${AZULA_BIN:-}" ]; then
  for candidate in \
    "$DIR/../../azula-cli/target/release/azula" \
    "$DIR/../../azula-cli/target/debug/azula" \
    "$DIR/../../../azula-cli/target/release/azula"
  do
    if [ -x "$candidate" ]; then AZULA_BIN="$candidate"; break; fi
  done
fi
if [ -z "${AZULA_BIN:-}" ]; then
  AZULA_BIN=$(command -v azula || true)
fi
if [ -z "${AZULA_BIN:-}" ]; then
  echo "No azula binary found." >&2
  echo "Build one with \`cargo build --release -p azula\` in azula-cli, or set AZULA_BIN." >&2
  exit 1
fi
case "$AZULA_BIN" in /*) ;; *) AZULA_BIN=$(CDPATH= cd -- "$(dirname -- "$AZULA_BIN")" && pwd)/$(basename -- "$AZULA_BIN") ;; esac
export AZULA_BIN

command -v jq > /dev/null 2>&1 || { echo "jq is required (brew install jq)." >&2; exit 1; }

printf 'azula: %s\n' "$AZULA_BIN"
printf 'version: %s\n\n' "$("$AZULA_BIN" --version)"

if [ "$#" -eq 0 ]; then
  # shellcheck disable=SC2046 # deliberate word splitting over a generated list
  set -- $(cd "$DIR" && ls -1 ./*.sh | sed 's|^\./||;s|\.sh$||' | grep -Ev '^(_lib|run)$')
fi

failed=0
for name in "$@"; do
  printf '  . %-24s ' "$name"
  if out=$(sh "$DIR/$name.sh" 2>&1); then
    echo "ok"
  else
    echo "FAILED"
    printf '%s\n' "$out" | sed 's/^/      /'
    failed=$((failed + 1))
  fi
done

echo
if [ "$failed" -gt 0 ]; then
  printf 'FAIL: %s example(s) failed\n' "$failed" >&2
  exit 1
fi
echo "All examples passed."
