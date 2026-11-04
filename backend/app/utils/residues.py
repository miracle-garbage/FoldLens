"""Residue-name tables and residue-key helpers."""

from __future__ import annotations

THREE_TO_ONE: dict[str, str] = {
    "ALA": "A",
    "ARG": "R",
    "ASN": "N",
    "ASP": "D",
    "CYS": "C",
    "GLN": "Q",
    "GLU": "E",
    "GLY": "G",
    "HIS": "H",
    "ILE": "I",
    "LEU": "L",
    "LYS": "K",
    "MET": "M",
    "PHE": "F",
    "PRO": "P",
    "SER": "S",
    "THR": "T",
    "TRP": "W",
    "TYR": "Y",
    "VAL": "V",
}

SOLVENT_NAMES: frozenset[str] = frozenset({"HOH", "WAT", "DOD", "H2O"})


def one_letter(name3: str) -> str | None:
    """Map a three-letter residue name to a one-letter code."""
    return THREE_TO_ONE.get(name3.upper())


def residue_key(chain_id: str, res_id: int, ins_code: str = "") -> str:
    """Build the frontend-facing residue key."""
    return f"{chain_id}|{res_id}|{ins_code}"
