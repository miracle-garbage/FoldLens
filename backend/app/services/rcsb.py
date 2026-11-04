"""Resolve structure files from bundled samples, cache, or RCSB.

Only this module performs network I/O for structure data.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import httpx

from app.core.config import settings
from app.core.errors import (
    AppError,
    entry_not_found,
    invalid_entry_id,
    parse_failed,
    unsupported_format,
)
from app.core.samples_catalog import SAMPLE_MAP
from app.services import cache

logger = logging.getLogger(__name__)

PDB_ID_PATTERN = re.compile(r"^[A-Za-z0-9]{4}$")
UPLOAD_ID_PATTERN = re.compile(r"^upload-[0-9a-f]{12}$")
PLAINTEXT_FORMAT = "cif"

StructureFormat = Literal["cif", "pdb"]


@dataclass(frozen=True)
class StructureSource:
    entry_id: str
    path: Path
    format: StructureFormat
    is_sample: bool


def normalize_entry_id(raw: str) -> str:
    """Validate and normalise an entry id.

    PDB ids become upper-case; upload ids stay lower-case.
    """
    entry_id = raw.strip()
    if UPLOAD_ID_PATTERN.match(entry_id):
        return entry_id
    upper = entry_id.upper()
    if PDB_ID_PATTERN.match(upper):
        return upper
    raise invalid_entry_id(raw)


def is_upload_id(entry_id: str) -> bool:
    return entry_id.startswith("upload-")


def pdb_id_of(entry_id: str) -> str | None:
    """Return the PDB accession for sample/cached entries, or ``None``."""
    return None if is_upload_id(entry_id) else entry_id


def _sample_path(entry_id: str) -> Path | None:
    if entry_id not in SAMPLE_MAP:
        return None
    directory = settings.samples_dir
    for suffix in (".cif", ".pdb"):
        candidate = directory / f"{entry_id}{suffix}"
        if candidate.exists():
            return candidate
    return None


def _upload_path(entry_id: str) -> Path | None:
    directory = settings.uploads_cache_dir
    if not directory.exists():
        return None
    for candidate in sorted(directory.glob(f"{entry_id}.*")):
        if candidate.suffix.lower() in {".cif", ".mmcif", ".pdb"}:
            return candidate
    return None


def _cache_path(entry_id: str) -> Path:
    return settings.structures_cache_dir / f"{entry_id}.cif"


def _format_from_path(path: Path) -> StructureFormat:
    suffix = path.suffix.lower()
    if suffix in {".cif", ".mmcif"}:
        return "cif"
    if suffix == ".pdb":
        return "pdb"
    raise unsupported_format(f"Unsupported structure suffix: {suffix}")


def _fetch_from_rcsb(entry_id: str) -> tuple[bytes, StructureFormat, str]:
    """Download a PDB entry, retrying once.  Raises a mapped ``AppError``."""
    url = f"https://files.rcsb.org/download/{entry_id}.cif"
    timeout = settings.rcsb_timeout_seconds
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                response = client.get(url)
            if response.status_code == 404:
                raise entry_not_found(entry_id)
            if response.status_code >= 500:
                raise httpx.HTTPStatusError(
                    f"Upstream returned {response.status_code}",
                    request=response.request,
                    response=response,
                )
            response.raise_for_status()
            text = response.text
            if "data_" not in text[:2000]:
                raise parse_failed("Downloaded file is not mmCIF.")
            return response.content, "cif", text
        except AppError:
            raise
        except httpx.TimeoutException as exc:
            last_error = exc
            logger.warning(
                "RCSB timeout for %s (attempt %d/2)", entry_id, attempt + 1
            )
        except httpx.HTTPError as exc:
            last_error = exc
            logger.warning(
                "RCSB request failed for %s (attempt %d/2): %s",
                entry_id,
                attempt + 1,
                exc,
            )
    if isinstance(last_error, httpx.TimeoutException):
        raise AppError(
            "UPSTREAM_TIMEOUT",
            f"RCSB timed out while fetching {entry_id}.",
            504,
        )
    raise AppError(
        "UPSTREAM_UNAVAILABLE",
        f"RCSB was unavailable while fetching {entry_id}.",
        502,
    )


def resolve_structure(entry_id: str) -> StructureSource:
    """Return a local file for ``entry_id``, downloading and caching if needed."""
    normalized = normalize_entry_id(entry_id)
    cache.ensure_dirs()

    sample_path = _sample_path(normalized)
    if sample_path is not None:
        return StructureSource(
            normalized, sample_path, _format_from_path(sample_path), True
        )

    if is_upload_id(normalized):
        upload_path = _upload_path(normalized)
        if upload_path is None:
            raise entry_not_found(normalized)
        return StructureSource(
            normalized, upload_path, _format_from_path(upload_path), False
        )

    cached = _cache_path(normalized)
    if cached.exists():
        return StructureSource(normalized, cached, "cif", False)

    _content, file_format, text = _fetch_from_rcsb(normalized)
    cache.write_text(cached, text)
    logger.info("Cached structure %s at %s", normalized, cached)
    return StructureSource(normalized, cached, file_format, False)


def read_structure_text(source: StructureSource) -> str:
    try:
        return source.path.read_text(encoding="utf-8")
    except OSError as exc:
        raise parse_failed(f"Could not read {source.entry_id}.") from exc


def fetch_metadata(entry_id: str) -> dict[str, object] | None:
    """Fetch entry metadata from the RCSB data API.

    Returns ``None`` on any failure; callers fall back to CIF headers.
    """
    if is_upload_id(entry_id):
        return None
    url = f"https://data.rcsb.org/rest/v1/core/entry/{entry_id}"
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(url)
        if response.status_code != 200:
            return None
        payload = response.json()
        return payload if isinstance(payload, dict) else None
    except httpx.HTTPError:
        return None
