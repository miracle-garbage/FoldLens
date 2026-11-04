"""FastAPI application entry point."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import (
    routes_entries,
    routes_health,
    routes_samples,
    routes_thumbnails,
    routes_uploads,
)
from app.core.config import settings
from app.core.errors import AppError, error_payload
from app.core.logging import configure_logging
from app.services import cache

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    cache.ensure_dirs()
    cache.cleanup_uploads()
    logger.info("FoldLens backend %s ready", settings.version)
    yield


app = FastAPI(
    title="FoldLens",
    version=settings.version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(routes_health.router, prefix="/api")
app.include_router(routes_samples.router, prefix="/api")
app.include_router(routes_entries.router, prefix="/api")
app.include_router(routes_thumbnails.router, prefix="/api")
app.include_router(routes_uploads.router, prefix="/api")


@app.exception_handler(AppError)
async def handle_app_error(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=error_payload(exc),
    )


@app.exception_handler(Exception)
async def handle_unexpected_error(_request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal error occurred.",
                "detail": None,
            }
        },
    )
