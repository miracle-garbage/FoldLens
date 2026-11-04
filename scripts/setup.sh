#!/usr/bin/env bash
# One-time dependency installation. The system Python has no pip/ensurepip, so
# every Python operation goes through uv (see docs/ENVIRONMENT.md).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UV_BIN="${UV_BIN:-$HOME/.local/bin/uv}"

# Vite 8 needs Node ^20.19 / >=22.12; interactive shells may default to Node 18.
# shellcheck source=node-env.sh
source "$ROOT/scripts/node-env.sh" || exit 1

if [[ ! -x "$UV_BIN" ]]; then
  echo "uv not found at $UV_BIN" >&2
  echo "Install it with: UV_NO_MODIFY_PATH=1 curl -LsSf https://astral.sh/uv/install.sh | sh" >&2
  exit 1
fi

echo "==> Backend"
cd "$ROOT/backend"
"$UV_BIN" sync --locked --extra dev --python 3.12

echo "==> Frontend"
cd "$ROOT/frontend"
npm install

echo "==> Samples"
"$ROOT/scripts/fetch-samples.sh"

echo "Setup complete. Start with: ./scripts/dev.sh"
