"""User upload handling.

Uploaded files never touch ``data/samples/`` and their original filenames are
never used as paths.  Only the validated extension chooses the cache suffix.
"""

from __future__ import annotations

import logging
import secrets
from pathlib import Path

from app.core.config import settings
from app.core.errors import AppError, parse_failed, unsupported_format
from app.models.schemas import UploadResponse
from app.services import cache
from app.services.entries import get_entry_analysis

logger = logging.getLogger(__name__)

_CIF_SUFFIXES = {".cif", ".mmcif"}
_PDB_SUFFIXES = {".pdb"}


def _detect_format(filename: str, content: bytes) -> tuple[str, str]:
    suffix = Path(filename).suffix.lower()
    if suffix in _CIF_SUFFIXES:
        head = content[:4096].decode("utf-8", errors="ignore")
        if "data_" not in head:
            raise unsupported_format("CIF content does not contain a data block.")
        return "cif", ".cif"
    if suffix in _PDB_SUFFIXES:
        head = content[:200_000].decode("utf-8", errors="ignore")
        if not any(record in head for record in ("ATOM", "HEADER", "MODEL")):
            raise unsupported_format("PDB content does not contain ATOM records.")
        return "pdb", ".pdb"
    raise unsupported_format(f"Unsupported file extension: {suffix or '(none)'}")


def save_upload(filename: str, content: bytes) -> UploadResponse:
    """Validate, persist and analyse an uploaded structure file."""
    limit = settings.max_upload_mb * 1024 * 1024
    if len(content) == 0:
        raise parse_failed("Uploaded file is empty.")
    if len(content) > limit:
        raise AppError(
            "FILE_TOO_LARGE",
            f"Upload exceeds {settings.max_upload_mb} MB.",
            413,
        )

    _file_format, suffix = _detect_format(filename, content)
    entry_id = f"upload-{secrets.token_hex(6)}"
    path = settings.uploads_cache_dir / f"{entry_id}{suffix}"
    cache.ensure_dirs()
    cache.write_text(path, content.decode("utf-8", errors="replace"))
    logger.info("Stored upload %s (%d bytes)", entry_id, len(content))

    try:
        analysis = get_entry_analysis(entry_id, refresh=True)
    except AppError:
        path.unlink(missing_ok=True)
        raise
    return UploadResponse(entry_id=entry_id, analysis=analysis)
