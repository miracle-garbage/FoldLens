#!/usr/bin/env bash
# Unix wrapper around the cross-platform sample fetcher.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# shellcheck source=node-env.sh
source "$ROOT/scripts/node-env.sh" || exit 1

exec node "$ROOT/scripts/fetch-samples.mjs" "$@"
