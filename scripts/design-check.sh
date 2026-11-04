#!/usr/bin/env bash
# Screenshot the home page and the 1CRN workspace at 1440/768/390.
#
# Prefer the production preview (port 4173) when it is running; fall back to
# the Vite dev server. The allowances below are deliberate conflicts with the
# generic checker: DESIGN.md mandates the warm-paper palette, mono data type,
# hairline structure, and three typefaces, and this is a scientific tool with
# no video. See docs/DEVLOG.md for the rationale.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHROME_PATH="${CHROME_PATH:-$HOME/.cache/ms-playwright/chromium-1169/chrome-linux/chrome}"

# shellcheck source=node-env.sh
source "$ROOT/scripts/node-env.sh" || exit 1
INSPECT_SCRIPT="$ROOT/.claude/skills/design-taste-frontend/scripts/inspect.mjs"
OUT_DIR="$ROOT/.taste-skill/inspect"

if [[ -n "${1:-}" ]]; then
  BASE_URL="$1"
elif curl -sf http://127.0.0.1:4173/ >/dev/null 2>&1; then
  BASE_URL="http://127.0.0.1:4173"
else
  BASE_URL="http://localhost:5173"
fi

export CHROME_PATH

if [[ ! -f "$INSPECT_SCRIPT" ]]; then
  echo "Design inspector missing at $INSPECT_SCRIPT" >&2
  echo "Restore the local AI toolchain with: npx skills experimental_install" >&2
  exit 1
fi

ALLOW="mono,micro-label,hairline,outlined-box,palette-claude,focal-point,font-count,no-footage,name-only-title"
STATUS=0

mkdir -p "$OUT_DIR"

echo "==> Home ($BASE_URL)"
node "$INSPECT_SCRIPT" "$BASE_URL/" --allow "$ALLOW" --out "$OUT_DIR/home" || STATUS=1

echo "==> Workspace ($BASE_URL/entry/1CRN)"
node "$INSPECT_SCRIPT" "$BASE_URL/entry/1CRN" --app --allow "$ALLOW" \
  --out "$OUT_DIR/workspace" || STATUS=1

echo "Screenshots written to $OUT_DIR"
exit "$STATUS"
