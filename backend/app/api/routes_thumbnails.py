"""Bundled thumbnail endpoint."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import Response

from app.services.entries import get_thumbnail

router = APIRouter(tags=["thumbnails"])


@router.get("/thumbnails/{pdb_id}")
def thumbnail(pdb_id: str) -> Response:
    payload = get_thumbnail(pdb_id)
    return Response(
        content=payload,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=86400"},
    )
