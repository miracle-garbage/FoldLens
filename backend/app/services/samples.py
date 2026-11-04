"""Bundled sample catalogue enriched with measured structure counts."""

from __future__ import annotations

import logging

from app.core.samples_catalog import SAMPLE_CATALOG
from app.models.schemas import SampleSummary
from app.services.entries import get_entry_analysis

logger = logging.getLogger(__name__)

_samples_cache: list[SampleSummary] | None = None


def reset_samples_cache() -> None:
    """Clear the in-process sample summary cache (used by tests)."""
    global _samples_cache
    _samples_cache = None


def list_samples(force: bool = False) -> list[SampleSummary]:
    """Return the six samples in catalogue order with measured counts."""
    global _samples_cache
    if _samples_cache is not None and not force:
        return _samples_cache

    summaries: list[SampleSummary] = []
    for definition in SAMPLE_CATALOG:
        try:
            analysis = get_entry_analysis(definition.pdb_id)
        except Exception as exc:  # A broken sample should not hide the others.
            logger.error("Could not analyse sample %s: %s", definition.pdb_id, exc)
            continue
        summaries.append(
            SampleSummary(
                pdb_id=definition.pdb_id,
                name=definition.name,
                description=definition.description,
                thumbnail_url=f"/api/thumbnails/{definition.pdb_id.lower()}",
                chain_count=analysis.meta.chain_count,
                residue_count=analysis.meta.residue_count,
                resolution=analysis.meta.resolution,
            )
        )
    _samples_cache = summaries
    return summaries
