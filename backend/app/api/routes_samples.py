"""Sample catalogue endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from app.models.schemas import SampleSummary
from app.services.samples import list_samples

router = APIRouter(tags=["samples"])


@router.get("/samples", response_model=list[SampleSummary])
def samples() -> list[SampleSummary]:
    return list_samples()
