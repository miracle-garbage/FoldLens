#!/usr/bin/env bash
# Run the FastAPI service and the Vite dev server together.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""
FRONTEND_PID=""

# Vite 8 needs Node ^20.19 / >=22.12; interactive shells may default to Node 18.
# shellcheck source=node-env.sh
source "$ROOT/scripts/node-env.sh" || exit 1
echo "Node $(node -v) — $(command -v node)"

cleanup() {
  trap - EXIT INT TERM
  if [[ -n "$BACKEND_PID" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$FRONTEND_PID" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [[ ! -x "$ROOT/backend/.venv/bin/uvicorn" ]]; then
  echo "Backend venv missing. Run ./scripts/setup.sh first." >&2
  exit 1
fi
if [[ ! -d "$ROOT/frontend/node_modules" ]]; then
  echo "Frontend dependencies missing. Run ./scripts/setup.sh first." >&2
  exit 1
fi

echo "Backend  http://127.0.0.1:8000"
echo "Frontend http://localhost:5173"
echo "Press Ctrl+C to stop both."

(
  cd "$ROOT/backend"
  exec .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
) &
BACKEND_PID=$!

(
  cd "$ROOT/frontend"
  exec npm run dev
) &
FRONTEND_PID=$!

wait
