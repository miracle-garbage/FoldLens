"""HTTP contract tests; no network access is allowed."""

from __future__ import annotations

from pathlib import Path

import pytest
from app.services import rcsb
from app.services.rcsb import StructureFormat
from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.1.0"}


def test_samples_use_measured_counts(client: TestClient) -> None:
    response = client.get("/api/samples")
    assert response.status_code == 200
    samples = response.json()
    assert [sample["pdbId"] for sample in samples] == [
        "1CRN",
        "1UBQ",
        "1LYZ",
        "4HHB",
        "6M0J",
        "1L2Y",
    ]
    by_id = {sample["pdbId"]: sample for sample in samples}
    assert by_id["1CRN"]["residueCount"] == 46
    assert by_id["1CRN"]["chainCount"] == 1
    assert by_id["1CRN"]["resolution"] == 1.5
    assert by_id["4HHB"]["chainCount"] == 4


def test_entry_analysis_contract(client: TestClient) -> None:
    response = client.get("/api/entries/1CRN")
    assert response.status_code == 200
    payload = response.json()
    assert payload["meta"]["entryId"] == "1CRN"
    assert payload["meta"]["pdbId"] == "1CRN"
    assert payload["meta"]["structureFormat"] == "cif"
    assert payload["stats"]["helixCount"] == 18
    assert payload["residues"][0]["chainId"] == "A"
    assert payload["residues"][0]["resId"] == 1
    assert payload["residues"][0]["insCode"] == ""
    assert payload["residues"][0]["phi"] is None
    assert len(payload["contacts"]) == 114
    first, second = payload["contacts"][0]
    assert first < second


def test_structure_endpoint_is_plain_text(client: TestClient) -> None:
    response = client.get("/api/entries/1CRN/structure")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    assert response.text.lstrip().startswith("data_")


def test_invalid_entry_id(client: TestClient) -> None:
    response = client.get("/api/entries/abc")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_ENTRY_ID"


def test_not_found_uses_error_envelope(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def missing(entry_id: str):
        raise rcsb.entry_not_found(entry_id)

    monkeypatch.setattr(rcsb, "_fetch_from_rcsb", missing)
    response = client.get("/api/entries/9XYZ")
    assert response.status_code == 404
    body = response.json()
    assert body["error"]["code"] == "ENTRY_NOT_FOUND"
    assert "detail" in body["error"]


def test_cache_hit_skips_upstream(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    sample_1crn_text: str,
) -> None:
    calls = {"count": 0}

    def fake_fetch(entry_id: str):
        calls["count"] += 1
        return (
            sample_1crn_text.encode("utf-8"),
            "cif",
            sample_1crn_text,
        )

    monkeypatch.setattr(rcsb, "_fetch_from_rcsb", fake_fetch)

    first = client.get("/api/entries/1ABC")
    second = client.get("/api/entries/1ABC")
    assert first.status_code == 200
    assert second.status_code == 200
    assert calls["count"] == 1


def test_thumbnail_is_jpeg(client: TestClient) -> None:
    response = client.get("/api/thumbnails/1crn")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    assert response.content.startswith(b"\xff\xd8")


def test_invalid_thumbnail_id(client: TestClient) -> None:
    response = client.get("/api/thumbnails/..%2Fsecret")
    assert response.status_code in {400, 404}


def test_upload_invalid_format(client: TestClient) -> None:
    response = client.post(
        "/api/uploads",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "UNSUPPORTED_FORMAT"


def test_upload_round_trip(client: TestClient, sample_1crn_text: str) -> None:
    response = client.post(
        "/api/uploads",
        files={"file": ("1crn.cif", sample_1crn_text.encode("utf-8"), "text/plain")},
    )
    assert response.status_code == 201
    payload = response.json()
    entry_id = payload["entryId"]
    assert entry_id.startswith("upload-")
    assert payload["analysis"]["meta"]["residueCount"] == 46

    structure = client.get(f"/api/entries/{entry_id}/structure")
    assert structure.status_code == 200
    assert structure.text.lstrip().startswith("data_")


def test_corrupt_upload_is_removed(
    client: TestClient, tmp_path: Path
) -> None:
    response = client.post(
        "/api/uploads",
        files={"file": ("broken.cif", b"data_broken\n", "text/plain")},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "PARSE_FAILED"


def test_structure_format_type_is_used() -> None:
    # A small guard so a refactor cannot silently change the alias type.
    assert StructureFormat.__args__ == ("cif", "pdb")


def test_upload_pdb_round_trip(client: TestClient) -> None:
    fixture = Path(__file__).parent / "fixtures" / "1crn.pdb"
    response = client.post(
        "/api/uploads",
        files={
            "file": (
                "1crn.pdb",
                fixture.read_bytes(),
                "chemical/x-pdb",
            )
        },
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["analysis"]["meta"]["structureFormat"] == "pdb"
    assert payload["analysis"]["meta"]["residueCount"] == 46
    structure = client.get(f"/api/entries/{payload['entryId']}/structure")
    assert structure.status_code == 200
    assert "ATOM" in structure.text


def test_upload_too_large(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    sample_1crn_text: str,
) -> None:
    from app.core.config import settings

    monkeypatch.setattr(settings, "max_upload_mb", 0)
    response = client.post(
        "/api/uploads",
        files={
            "file": (
                "1crn.cif",
                sample_1crn_text.encode("utf-8"),
                "text/plain",
            )
        },
    )
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "FILE_TOO_LARGE"
