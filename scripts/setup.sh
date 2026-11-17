#!/usr/bin/env bash
# Unix wrapper around the cross-platform Node setup (scripts/setup.mjs).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Vite 8 needs Node ^20.19 / >=22.12; interactive shells may default to Node 18.
# shellcheck source=node-env.sh
source "$ROOT/scripts/node-env.sh" || exit 1

exec node "$ROOT/scripts/setup.mjs" "$@"
