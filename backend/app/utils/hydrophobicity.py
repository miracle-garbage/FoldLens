"""Kyte-Doolittle hydrophobicity scale."""

from __future__ import annotations

KYTE_DOOLITTLE: dict[str, float] = {
    "A": 1.8,
    "C": 2.5,
    "D": -3.5,
    "E": -3.5,
    "F": 2.8,
    "G": -0.4,
    "H": -3.2,
    "I": 4.5,
    "K": -3.9,
    "L": 3.8,
    "M": 1.9,
    "N": -3.5,
    "P": -1.6,
    "Q": -3.5,
    "R": -4.5,
    "S": -0.8,
    "T": -0.7,
    "V": 4.2,
    "W": -0.9,
    "Y": -1.3,
}


def hydrophobicity(name1: str | None) -> float | None:
    """Return the Kyte-Doolittle value for a one-letter code, or ``None``."""
    if name1 is None:
        return None
    return KYTE_DOOLITTLE.get(name1.upper())
