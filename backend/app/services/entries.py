"""Entry-level orchestration: resolve → parse → analyse → cache."""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings
from app.core.errors import entry_not_found, invalid_entry_id
from app.models.schemas import EntryAnalysis
from app.services import cache, rcsb
from app.services.analysis import build_analysis
from app.services.structure import parse_structure

logger = logging.getLogger(__name__)


def _analysis_cache_path(entry_id: str):
    return settings.analysis_cache_dir / f"{entry_id}.json"


def _enrich_from_rcsb(analysis: EntryAnalysis) -> EntryAnalysis:
    """Fill missing archive fields from the RCSB data API.

    Bundled samples already carry complete headers, so this path is only used
    for downloaded entries with sparse metadata.  Failure is non-fatal.
    """
    meta = analysis.meta
    if meta.title and meta.resolution is not None:
        return analysis
    if rcsb.is_upload_id(meta.entry_id):
        return analysis
    payload = rcsb.fetch_metadata(meta.entry_id)
    if not payload:
        return analysis

    def first(value: Any) -> Any:
        if isinstance(value, list):
            return value[0] if value else None
        return value

    struct = payload.get("struct") or {}
    exptl = first(payload.get("exptl")) or {}
    refine = first(payload.get("refine")) or {}
    accession = payload.get("rcsb_accession_info") or {}

    title = struct.get("title")
    if not meta.title and isinstance(title, str):
        meta.title = title.strip()
    method = exptl.get("method")
    if meta.method is None and isinstance(method, str):
        meta.method = method
    resolution = refine.get("ls_d_res_high")
    if meta.resolution is None and isinstance(resolution, (int, float)):
        meta.resolution = round(float(resolution), 2)
    r_free = refine.get("ls_R_free")
    if meta.r_free is None and isinstance(r_free, (int, float)):
        meta.r_free = round(float(r_free), 3)
    deposit_date = accession.get("deposit_date")
    if meta.deposited_at is None and isinstance(deposit_date, str):
        meta.deposited_at = deposit_date[:10]
    return analysis


def get_entry_analysis(entry_id: str, refresh: bool = False) -> EntryAnalysis:
    """Return the analysis payload for an entry, using the file cache if fresh."""
    source = rcsb.resolve_structure(entry_id)
    cache.ensure_dirs()
    cache_path = _analysis_cache_path(source.entry_id)

    if not refresh and cache.cache_is_fresh(cache_path, source.path):
        cached = cache.read_json(cache_path)
        if cached is not None:
            try:
                return EntryAnalysis.model_validate(cached)
            except ValueError:
                logger.warning("Invalid cached analysis for %s; recomputing", entry_id)

    parsed = parse_structure(source.path, source.format)
    analysis = build_analysis(parsed, source.entry_id)
    if not source.is_sample:
        analysis = _enrich_from_rcsb(analysis)
    cache.write_json(cache_path, analysis.model_dump(by_alias=True))
    logger.info(
        "Analysed %s: %d residues, %d contacts",
        source.entry_id,
        analysis.meta.residue_count,
        len(analysis.contacts),
    )
    return analysis


def get_structure_text(entry_id: str) -> tuple[str, str]:
    """Return ``(text, filename)`` for the raw structure endpoint."""
    source = rcsb.resolve_structure(entry_id)
    text = rcsb.read_structure_text(source)
    extension = "pdb" if source.format == "pdb" else "cif"
    return text, f"{source.entry_id}.{extension}"


def get_thumbnail(pdb_id: str) -> bytes:
    """Read a bundled thumbnail; the id is validated to prevent traversal."""
    normalized = pdb_id.strip().upper()
    if not rcsb.PDB_ID_PATTERN.match(normalized):
        raise invalid_entry_id(pdb_id)
    path = settings.thumbnails_dir / f"{normalized.lower()}_assembly-1.jpeg"
    try:
        return path.read_bytes()
    except FileNotFoundError as exc:
        raise entry_not_found(normalized) from exc
