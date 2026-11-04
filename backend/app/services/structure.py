"""Structure parsing with Biotite 2.0.

Only the first model is loaded.  Header metadata is read from the deposited
file first, so bundled samples remain fully offline.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import biotite.structure as struc
import numpy as np
from biotite.structure import AtomArray
from biotite.structure.io import pdb, pdbx

from app.core.errors import parse_failed, unsupported_format
from app.services.rcsb import StructureFormat

logger = logging.getLogger(__name__)


@dataclass
class ParsedStructure:
    array: AtomArray
    header: dict[str, Any]
    format: StructureFormat
    component_names: dict[str, str]


def _first_value(block: Any, category: str, column: str) -> str | None:
    """Read the first value of a CIF category/column."""
    try:
        values = block[category][column].as_array()
    except (KeyError, TypeError, AttributeError):
        return None
    if len(values) == 0:
        return None
    value = values[0]
    if value in (None, "", "?", "."):
        return None
    return str(value)


def _parse_cif_header(block: Any) -> dict[str, Any]:
    try:
        categories = set(block.keys())
    except AttributeError:
        categories = set()
    title = _first_value(block, "struct", "title") if "struct" in categories else None
    return {
        "title": " ".join(title.split()) if title else "",
        "method": (
            _first_value(block, "exptl", "method") if "exptl" in categories else None
        ),
        "resolution": (
            _first_value(block, "refine", "ls_d_res_high")
            if "refine" in categories
            else None
        ),
        "r_free": (
            _first_value(block, "refine", "ls_R_free")
            if "refine" in categories
            else None
        ),
        "deposited_at": (
            _first_value(
                block, "pdbx_database_status", "recvd_initial_deposition_date"
            )
            if "pdbx_database_status" in categories
            else None
        ),
    }


def _parse_pdb_header(path: Path) -> dict[str, Any]:
    """Read the handful of PDB header fields used by the archive panel."""
    title_parts: list[str] = []
    method: str | None = None
    resolution: str | None = None
    deposited_at: str | None = None
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return {}
    for line in lines:
        record = line[:6].strip()
        if record == "TITLE":
            title_parts.append(line[10:].strip())
        elif record == "EXPDTA":
            method = line[10:].strip() or None
        elif record == "REMARK" and line.startswith("REMARK   2 RESOLUTION."):
            resolution = line.split()[-2] if len(line.split()) >= 3 else None
        elif record == "HEADER":
            raw_date = line[50:59].strip()
            if raw_date:
                deposited_at = raw_date
    return {
        "title": " ".join(" ".join(title_parts).split()),
        "method": method,
        "resolution": resolution,
        "r_free": None,
        "deposited_at": deposited_at,
    }


def _parse_component_names(block: Any) -> dict[str, str]:
    """Map non-polymer component ids to their descriptive names."""
    try:
        category = block["pdbx_entity_nonpoly"]
        comp_ids = category["comp_id"].as_array()
        names = category["name"].as_array()
    except (KeyError, TypeError, AttributeError):
        return {}
    return {
        str(comp_id): str(name)
        for comp_id, name in zip(comp_ids, names, strict=False)
        if str(comp_id) and str(name)
    }


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_header(header: dict[str, Any]) -> dict[str, Any]:
    return {
        "title": header.get("title") or "",
        "method": header.get("method") or None,
        "resolution": _to_float(header.get("resolution")),
        "r_free": _to_float(header.get("r_free")),
        "deposited_at": header.get("deposited_at") or None,
    }


def parse_structure(path: Path, file_format: StructureFormat) -> ParsedStructure:
    """Parse the first model of a structure file into an ``AtomArray``."""
    try:
        if file_format == "cif":
            cif_file = pdbx.CIFFile.read(path)
            array = pdbx.get_structure(
                cif_file,
                model=1,
                extra_fields=["b_factor"],
                use_author_fields=True,
            )
            header = normalize_header(_parse_cif_header(cif_file.block))
            component_names = _parse_component_names(cif_file.block)
        else:
            pdb_file = pdb.PDBFile.read(path)
            # PDB files only carry author numbering, so there is no
            # ``use_author_fields`` switch on this reader.
            array = pdb.get_structure(
                pdb_file,
                model=1,
                extra_fields=["b_factor"],
            )
            header = normalize_header(_parse_pdb_header(path))
            component_names = {}
    except Exception as exc:  # Biotite raises several unrelated exception types.
        logger.warning("Could not parse %s: %s", path, exc)
        raise parse_failed(f"Could not parse structure file {path.name}.") from exc

    if array.array_length() == 0:
        raise parse_failed("Structure contains no atoms.")
    return ParsedStructure(
        array=array,
        header=header,
        format=file_format,
        component_names=component_names,
    )


def protein_mask(array: AtomArray) -> np.ndarray:
    """Boolean mask of standard amino-acid atoms."""
    mask = struc.filter_amino_acids(array)
    return np.asarray(mask, dtype=bool)


def require_protein(array: AtomArray) -> AtomArray:
    """Return the protein subset or raise ``UNSUPPORTED_FORMAT``."""
    mask = protein_mask(array)
    if not mask.any():
        raise unsupported_format("Only protein structures are supported.")
    return array[mask]
