"""Logging setup for the local service."""

from __future__ import annotations

import logging

_FORMAT = "%(asctime)s %(levelname)s %(name)s - %(message)s"


def configure_logging(level: int = logging.INFO) -> None:
    """Configure root logging once, without duplicating handlers."""
    root = logging.getLogger()
    if root.handlers:
        return
    logging.basicConfig(level=level, format=_FORMAT)
