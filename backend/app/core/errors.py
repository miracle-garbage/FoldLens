"""Application error type and the stable error-code catalogue."""

from __future__ import annotations

from typing import Any


class AppError(Exception):
    """An error that is safe to expose to the frontend via the error envelope."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        detail: Any | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.detail = detail


ERROR_STATUS: dict[str, int] = {
    "INVALID_ENTRY_ID": 400,
    "ENTRY_NOT_FOUND": 404,
    "FILE_TOO_LARGE": 413,
    "UNSUPPORTED_FORMAT": 422,
    "PARSE_FAILED": 422,
    "UPSTREAM_UNAVAILABLE": 502,
    "UPSTREAM_TIMEOUT": 504,
    "INTERNAL_ERROR": 500,
}


def error_payload(error: AppError) -> dict[str, dict[str, Any]]:
    return {
        "error": {
            "code": error.code,
            "message": error.message,
            "detail": error.detail,
        }
    }


def invalid_entry_id(value: str) -> AppError:
    return AppError(
        "INVALID_ENTRY_ID",
        f"Invalid entry id: {value!r}.",
        ERROR_STATUS["INVALID_ENTRY_ID"],
    )


def entry_not_found(entry_id: str) -> AppError:
    return AppError(
        "ENTRY_NOT_FOUND",
        f"PDB entry {entry_id} was not found.",
        ERROR_STATUS["ENTRY_NOT_FOUND"],
    )


def unsupported_format(detail: str | None = None) -> AppError:
    return AppError(
        "UNSUPPORTED_FORMAT",
        "The structure format is not supported.",
        ERROR_STATUS["UNSUPPORTED_FORMAT"],
        detail,
    )


def parse_failed(detail: str | None = None) -> AppError:
    return AppError(
        "PARSE_FAILED",
        "The structure could not be parsed.",
        ERROR_STATUS["PARSE_FAILED"],
        detail,
    )
