"""Shared pytest fixtures.

Every test uses an isolated cache directory; the six bundled samples are read
from ``data/samples/`` and never fetched from the network.
"""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
from app.core.config import PROJECT_ROOT, settings
from app.main import app
from app.services.samples import reset_samples_cache
from fastapi.testclient import TestClient

SAMPLES_DIR = PROJECT_ROOT / "data" / "samples"


@pytest.fixture(autouse=True)
def isolated_cache(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    monkeypatch.setattr(settings, "cache_dir", tmp_path / ".cache")
    monkeypatch.setattr(settings, "data_dir", PROJECT_ROOT / "data")
    reset_samples_cache()
    yield
    reset_samples_cache()


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_1crn_text() -> str:
    return (SAMPLES_DIR / "1CRN.cif").read_text(encoding="utf-8")
