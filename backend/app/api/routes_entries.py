"""Entry analysis and raw structure endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Query
from fastapi.responses import PlainTextResponse

from app.models.schemas import EntryAnalysis
from app.services.entries import get_entry_analysis, get_structure_text

router = APIRouter(tags=["entries"])


@router.get("/entries/{entry_id}", response_model=EntryAnalysis)
def entry(entry_id: str, refresh: bool = Query(default=False)) -> EntryAnalysis:
    return get_entry_analysis(entry_id, refresh=refresh)


@router.get("/entries/{entry_id}/structure", response_class=PlainTextResponse)
def structure(entry_id: str) -> PlainTextResponse:
    text, filename = get_structure_text(entry_id)
    return PlainTextResponse(
        text,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
