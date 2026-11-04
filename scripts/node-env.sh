#!/usr/bin/env bash
# Put a Node.js version compatible with Vite 8 first on PATH.
#
# Vite 8 requires ^20.19.0 || >=22.12.0.  Interactive shells on this machine
# may resolve /usr/bin/node (v18) before the nvm-managed Node 26.  Set
# FOLDLENS_NODE=/path/to/node to override the search.
#
# Usage from another script:
#   source "$ROOT/scripts/node-env.sh" || exit 1

node_is_supported() {
  local binary="$1"
  "$binary" -e '
    const [major, minor] = process.versions.node.split(".").map(Number);
    const ok = (major === 20 && minor >= 19) || (major >= 22 && (major > 22 || minor >= 12));
    process.exit(ok ? 0 : 1);
  ' >/dev/null 2>&1
}

find_supported_node() {
  if [[ -n "${FOLDLENS_NODE:-}" ]]; then
    if [[ -x "$FOLDLENS_NODE" ]] && node_is_supported "$FOLDLENS_NODE"; then
      printf '%s\n' "$FOLDLENS_NODE"
      return 0
    fi
    echo "FOLDLENS_NODE=$FOLDLENS_NODE does not exist or is not Node ^20.19 / >=22.12" >&2
    return 1
  fi

  local current
  current="$(command -v node 2>/dev/null || true)"
  if [[ -n "$current" ]] && node_is_supported "$current"; then
    printf '%s\n' "$current"
    return 0
  fi

  local candidates=()
  shopt -s nullglob
  candidates+=("$HOME"/.nvm/versions/node/*/bin/node)
  candidates+=("$HOME"/.local/share/fnm/node-versions/*/installation/bin/node)
  candidates+=("$HOME"/.volta/bin/node)
  shopt -u nullglob

  local candidate
  while IFS= read -r candidate; do
    if [[ -n "$candidate" && -x "$candidate" ]] && node_is_supported "$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done < <(printf '%s\n' "${candidates[@]}" | sort -Vr)
  return 1
}

if NODE_BIN="$(find_supported_node)"; then
  export PATH="$(dirname "$NODE_BIN"):$PATH"
  export FOLDLENS_NODE="$NODE_BIN"
else
  echo "No Node.js compatible with Vite 8 was found." >&2
  echo "Required: ^20.19.0 || >=22.12.0 (this machine's project uses 26.13.0)." >&2
  echo "Install/select one with nvm, or set FOLDLENS_NODE=/path/to/node." >&2
  return 1 2>/dev/null || exit 1
fi
