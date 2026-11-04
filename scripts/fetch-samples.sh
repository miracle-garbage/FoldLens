#!/usr/bin/env bash
# Download the six bundled samples and their RCSB thumbnails.
# Existing files are kept unless --force is passed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FORCE="${1:-}"
PDB_IDS=(1CRN 1UBQ 1LYZ 4HHB 6M0J 1L2Y)

mkdir -p "$ROOT/data/samples" "$ROOT/data/thumbnails"

for pdb_id in "${PDB_IDS[@]}"; do
  cif_path="$ROOT/data/samples/${pdb_id}.cif"
  if [[ "$FORCE" != "--force" && -s "$cif_path" ]]; then
    echo "keep ${pdb_id}.cif"
  else
    echo "fetch ${pdb_id}.cif"
    curl -fsSL --retry 2 -o "$cif_path" \
      "https://files.rcsb.org/download/${pdb_id}.cif"
  fi

  lower_id="$(printf '%s' "$pdb_id" | tr '[:upper:]' '[:lower:]')"
  thumb_path="$ROOT/data/thumbnails/${lower_id}_assembly-1.jpeg"
  if [[ "$FORCE" != "--force" && -s "$thumb_path" ]]; then
    echo "keep ${lower_id}_assembly-1.jpeg"
  else
    echo "fetch ${lower_id}_assembly-1.jpeg"
    curl -fsSL --retry 2 -o "$thumb_path" \
      "https://cdn.rcsb.org/images/structures/${lower_id}_assembly-1.jpeg"
  fi
done

echo "Samples ready in data/."
