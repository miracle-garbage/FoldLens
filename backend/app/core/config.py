"""Runtime configuration.

Values can be overridden with ``FOLDLENS_*`` environment variables.  Paths are
resolved from the project root so the service can be started from any cwd.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]


def _path_from_env(name: str, default: Path) -> Path:
    raw = os.environ.get(name)
    if not raw:
        return default
    path = Path(raw).expanduser()
    return path if path.is_absolute() else (PROJECT_ROOT / path).resolve()


def _int_from_env(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


@dataclass
class Settings:
    host: str = field(
        default_factory=lambda: os.environ.get("FOLDLENS_HOST", "127.0.0.1")
    )
    port: int = field(
        default_factory=lambda: _int_from_env("FOLDLENS_PORT", 8000)
    )
    data_dir: Path = field(
        default_factory=lambda: _path_from_env(
            "FOLDLENS_DATA_DIR", PROJECT_ROOT / "data"
        )
    )
    cache_dir: Path = field(
        default_factory=lambda: _path_from_env(
            "FOLDLENS_CACHE_DIR", PROJECT_ROOT / ".cache"
        )
    )
    rcsb_timeout_seconds: int = field(
        default_factory=lambda: _int_from_env("FOLDLENS_RCSB_TIMEOUT", 15)
    )
    max_upload_mb: int = field(
        default_factory=lambda: _int_from_env("FOLDLENS_MAX_UPLOAD_MB", 50)
    )
    version: str = "0.1.0"

    @property
    def samples_dir(self) -> Path:
        return self.data_dir / "samples"

    @property
    def thumbnails_dir(self) -> Path:
        return self.data_dir / "thumbnails"

    @property
    def structures_cache_dir(self) -> Path:
        return self.cache_dir / "structures"

    @property
    def meta_cache_dir(self) -> Path:
        return self.cache_dir / "meta"

    @property
    def analysis_cache_dir(self) -> Path:
        return self.cache_dir / "analysis"

    @property
    def uploads_cache_dir(self) -> Path:
        return self.cache_dir / "uploads"


settings = Settings()
