"""Upload endpoint."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, UploadFile

from app.models.schemas import UploadResponse
from app.services.uploads import save_upload

router = APIRouter(tags=["uploads"])


@router.post("/uploads", response_model=UploadResponse, status_code=201)
async def upload(file: Annotated[UploadFile, File()]) -> UploadResponse:
    content = await file.read()
    return save_upload(file.filename or "", content)
