"""File-system cache with atomic writes.

The cache is intentionally boring: plain files under ``.cache/``.  There is no
database and no background process.
"""

from __future__ import annotations

import json
import logging
import os
import tempfile
import time
from pathlib import Path
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

UPLOAD_MAX_AGE_SECONDS = 24 * 60 * 60


def ensure_dirs() -> None:
    """Create every cache directory the service may write to."""
    for directory in (
        settings.structures_cache_dir,
        settings.meta_cache_dir,
        settings.analysis_cache_dir,
        settings.uploads_cache_dir,
    ):
        directory.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, text: str) -> None:
    """Write text atomically via a sibling temporary file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    file_descriptor, temp_name = tempfile.mkstemp(
        dir=path.parent, prefix=f".{path.name}.", suffix=".tmp"
    )
    try:
        with os.fdopen(file_descriptor, "w", encoding="utf-8") as handle:
            handle.write(text)
        os.replace(temp_name, path)
    except BaseException:
        Path(temp_name).unlink(missing_ok=True)
        raise


def read_text(path: Path) -> str | None:
    """Read cached text, returning ``None`` when the file does not exist."""
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, ensure_ascii=False, indent=2))


def read_json(path: Path) -> Any | None:
    text = read_text(path)
    if text is None:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.warning("Ignoring corrupt cache file %s", path)
        path.unlink(missing_ok=True)
        return None


def cache_is_fresh(cache_path: Path, source_path: Path) -> bool:
    """Return whether ``cache_path`` is newer than its source structure file."""
    try:
        return cache_path.stat().st_mtime >= source_path.stat().st_mtime
    except FileNotFoundError:
        return False


def cleanup_uploads() -> None:
    """Delete uploaded structures older than 24 hours."""
    directory = settings.uploads_cache_dir
    if not directory.exists():
        return
    cutoff = time.time() - UPLOAD_MAX_AGE_SECONDS
    for path in directory.iterdir():
        if not path.is_file():
            continue
        try:
            if path.stat().st_mtime < cutoff:
                path.unlink()
        except OSError:
            logger.warning("Could not clean upload cache file %s", path)
