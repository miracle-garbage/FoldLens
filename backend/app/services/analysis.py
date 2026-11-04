"""Protein structure analysis.

The functions here are deliberately pure with respect to the parsed
``AtomArray``: they do not read files or touch the network.  Values are rounded
only at the boundary, matching the display precision in ``docs/CONVENTIONS.md``.
"""

from __future__ import annotations

import itertools
import logging
import math
from collections import defaultdict

import biotite.structure as struc
import numpy as np

from app.models.schemas import (
    EntryAnalysis,
    EntryMeta,
    EntryStats,
    LigandRecord,
    MissingRange,
    ResidueRecord,
    Sse,
)
from app.services.rcsb import pdb_id_of
from app.services.structure import ParsedStructure, require_protein
from app.utils.hydrophobicity import hydrophobicity
from app.utils.residues import one_letter

logger = logging.getLogger(__name__)

CONTACT_THRESHOLD_ANGSTROM = 8.0
MIN_SEQUENCE_SEPARATION = 3

_SSE_MAP: dict[int, Sse] = {-1: "coil", 0: "coil", 1: "helix", 2: "strand"}


def _round(value: float, digits: int) -> float | None:
    if value is None or math.isnan(value) or math.isinf(value):
        return None
    return round(float(value), digits)


def _residue_bounds(protein: struc.AtomArray) -> tuple[np.ndarray, np.ndarray]:
    starts = struc.get_residue_starts(protein)
    stops = np.append(starts[1:], protein.array_length())
    return starts, stops


def _sse_per_residue(protein: struc.AtomArray, residue_count: int) -> list[Sse]:
    try:
        raw_sse = struc.annotate_sse(protein)
    except (ValueError, IndexError) as exc:
        logger.warning("P-SEA failed, falling back to coil: %s", exc)
        return ["coil"] * residue_count
    if len(raw_sse) != residue_count:
        logger.warning(
            "Unexpected SSE length %d for %d residues", len(raw_sse), residue_count
        )
        return ["coil"] * residue_count
    return [_SSE_MAP.get(int(value), "coil") for value in raw_sse]


def _dihedrals(
    protein: struc.AtomArray, residue_count: int
) -> tuple[np.ndarray, np.ndarray]:
    try:
        phi, psi, _omega = struc.dihedral_backbone(protein)
    except (ValueError, IndexError) as exc:
        logger.warning("Dihedral calculation failed: %s", exc)
        empty = np.full(residue_count, np.nan)
        return empty, empty
    if len(phi) != residue_count or len(psi) != residue_count:
        logger.warning("Unexpected dihedral length; padding with NaN")
        padded_phi = np.full(residue_count, np.nan)
        padded_psi = np.full(residue_count, np.nan)
        count = min(residue_count, len(phi), len(psi))
        padded_phi[:count] = phi[:count]
        padded_psi[:count] = psi[:count]
        return padded_phi, padded_psi
    return phi, psi


def _contacts(
    protein: struc.AtomArray,
    starts: np.ndarray,
    stops: np.ndarray,
    residue_count: int,
) -> list[tuple[int, int]]:
    """CA-CA contacts at 8 angstrom, excluding pairs closer than three residues."""
    ca_atom_indices: list[int] = []
    residue_indices: list[int] = []
    for residue_index, (start, stop) in enumerate(zip(starts, stops, strict=True)):
        names = protein.atom_name[start:stop]
        local = np.where(names == "CA")[0]
        if len(local) == 0:
            continue
        ca_atom_indices.append(int(start + local[0]))
        residue_indices.append(residue_index)

    if len(ca_atom_indices) < 2:
        return []

    ca_array = protein[np.asarray(ca_atom_indices)]
    try:
        adjacency = struc.CellList(
            ca_array, cell_size=CONTACT_THRESHOLD_ANGSTROM
        ).create_adjacency_matrix(CONTACT_THRESHOLD_ANGSTROM)
    except (ValueError, IndexError) as exc:
        logger.warning("Contact matrix failed: %s", exc)
        return []

    contacts: list[tuple[int, int]] = []
    for first, second in np.argwhere(np.triu(adjacency, k=1)):
        mapped_first = residue_indices[int(first)]
        mapped_second = residue_indices[int(second)]
        if abs(mapped_first - mapped_second) < MIN_SEQUENCE_SEPARATION:
            continue
        contacts.append(
            (min(mapped_first, mapped_second), max(mapped_first, mapped_second))
        )
    contacts.sort()
    return contacts


def _ligands(
    array: struc.AtomArray, component_names: dict[str, str]
) -> list[LigandRecord]:
    solvent = struc.filter_solvent(array)
    mask = array.hetero & ~solvent
    if not mask.any():
        return []
    subsets = array[mask]
    grouped: dict[tuple[str, int, str, str], int] = defaultdict(int)
    for index in range(subsets.array_length()):
        key = (
            str(subsets.chain_id[index]),
            int(subsets.res_id[index]),
            str(subsets.ins_code[index]),
            str(subsets.res_name[index]),
        )
        grouped[key] += 1
    records = [
        LigandRecord(
            chain_id=chain_id,
            res_id=res_id,
            ins_code=ins_code,
            comp_id=comp_id,
            name=component_names.get(comp_id, comp_id),
            atom_count=atom_count,
        )
        for (chain_id, res_id, ins_code, comp_id), atom_count in grouped.items()
    ]
    records.sort(key=lambda record: (record.chain_id, record.res_id))
    return records


def _missing_residues(
    residue_records: list[ResidueRecord],
) -> list[MissingRange]:
    """Report gaps between observed residue numbers; never infer termini."""
    by_chain: dict[str, list[int]] = defaultdict(list)
    for record in residue_records:
        by_chain[record.chain_id].append(record.res_id)
    missing: list[MissingRange] = []
    for chain_id in sorted(by_chain):
        observed = sorted(set(by_chain[chain_id]))
        for previous, current in itertools.pairwise(observed):
            if current - previous > 1:
                missing.append(
                    MissingRange(
                        chain_id=chain_id,
                        start=previous + 1,
                        end=current - 1,
                    )
                )
    return missing


def _residue_records(
    protein: struc.AtomArray,
    starts: np.ndarray,
    stops: np.ndarray,
    sse: list[Sse],
    phi: np.ndarray,
    psi: np.ndarray,
) -> list[ResidueRecord]:
    records: list[ResidueRecord] = []
    for index, (start, stop) in enumerate(zip(starts, stops, strict=True)):
        name3 = str(protein.res_name[start]).upper()
        name1 = one_letter(name3)
        b_factor_values = protein.b_factor[start:stop]
        b_factor = _round(float(np.nanmean(b_factor_values)), 2)
        hydrophobicity_value = _round(hydrophobicity(name1), 2)
        records.append(
            ResidueRecord(
                index=index,
                chain_id=str(protein.chain_id[start]),
                res_id=int(protein.res_id[start]),
                ins_code=str(protein.ins_code[start]),
                name3=name3,
                name1=name1,
                sse=sse[index],
                phi=_round(float(np.degrees(phi[index])), 1)
                if not math.isnan(phi[index])
                else None,
                psi=_round(float(np.degrees(psi[index])), 1)
                if not math.isnan(psi[index])
                else None,
                b_factor=b_factor,
                hydrophobicity=hydrophobicity_value,
            )
        )
    return records


def _stats(residues: list[ResidueRecord]) -> EntryStats:
    helix = sum(1 for residue in residues if residue.sse == "helix")
    strand = sum(1 for residue in residues if residue.sse == "strand")
    coil = sum(1 for residue in residues if residue.sse == "coil")
    b_factors = [
        residue.b_factor for residue in residues if residue.b_factor is not None
    ]
    hydrophobicity_values = [
        residue.hydrophobicity
        for residue in residues
        if residue.hydrophobicity is not None
    ]
    mean_b = _round(float(np.mean(b_factors)), 2) if b_factors else None
    if hydrophobicity_values:
        hydrophobic = sum(1 for value in hydrophobicity_values if value > 0)
        fraction = _round(hydrophobic / len(hydrophobicity_values), 2)
    else:
        fraction = None
    return EntryStats(
        helix_count=helix,
        strand_count=strand,
        coil_count=coil,
        mean_b_factor=mean_b,
        hydrophobic_fraction=fraction,
    )


def build_analysis(
    parsed: ParsedStructure,
    entry_id: str,
) -> EntryAnalysis:
    """Compute the complete analysis payload for one parsed structure."""
    protein = require_protein(parsed.array)
    starts, stops = _residue_bounds(protein)
    residue_count = len(starts)

    sse = _sse_per_residue(protein, residue_count)
    phi, psi = _dihedrals(protein, residue_count)
    residues = _residue_records(protein, starts, stops, sse, phi, psi)
    contacts = _contacts(protein, starts, stops, residue_count)
    ligands = _ligands(parsed.array, parsed.component_names)
    missing = _missing_residues(residues)

    header = parsed.header
    meta = EntryMeta(
        entry_id=entry_id,
        pdb_id=pdb_id_of(entry_id),
        structure_format=parsed.format,
        title=header.get("title") or "",
        method=header.get("method"),
        resolution=header.get("resolution"),
        r_free=header.get("r_free"),
        deposited_at=header.get("deposited_at"),
        atom_count=int(parsed.array.array_length()),
        residue_count=residue_count,
        chain_count=len({residue.chain_id for residue in residues}),
        ligands=ligands,
        missing_residues=missing,
    )
    return EntryAnalysis(
        meta=meta,
        residues=residues,
        contacts=contacts,
        stats=_stats(residues),
    )
