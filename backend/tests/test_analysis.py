"""Analysis unit tests locked to the bundled 1CRN and 4HHB samples."""

from __future__ import annotations

import pytest
from app.models.schemas import ResidueRecord
from app.services.analysis import _missing_residues
from app.services.entries import get_entry_analysis


@pytest.fixture(scope="module")
def analysis_1crn():
    return get_entry_analysis("1CRN")


def test_parse_1crn_counts(analysis_1crn) -> None:
    assert analysis_1crn.meta.atom_count == 327
    assert analysis_1crn.meta.residue_count == 46
    assert analysis_1crn.meta.chain_count == 1
    assert len(analysis_1crn.residues) == 46


def test_annotate_sse_1crn_counts(analysis_1crn) -> None:
    assert analysis_1crn.stats.helix_count == 18
    assert analysis_1crn.stats.strand_count == 4
    assert analysis_1crn.stats.coil_count == 24


def test_dihedral_range(analysis_1crn) -> None:
    values = [
        value
        for residue in analysis_1crn.residues
        for value in (residue.phi, residue.psi)
        if value is not None
    ]
    assert values
    assert all(-180.0 <= value <= 180.0 for value in values)
    assert analysis_1crn.residues[0].phi is None
    assert analysis_1crn.residues[-1].psi is None


def test_contacts_are_filtered(analysis_1crn) -> None:
    contacts = analysis_1crn.contacts
    assert len(contacts) == 114
    assert all(first < second for first, second in contacts)
    assert all(second - first >= 3 for first, second in contacts)
    assert len(set(contacts)) == len(contacts)


def test_ligands_4hhb() -> None:
    analysis = get_entry_analysis("4HHB")
    comp_ids = [ligand.comp_id for ligand in analysis.meta.ligands]
    assert comp_ids.count("HEM") == 4
    hem = next(ligand for ligand in analysis.meta.ligands if ligand.comp_id == "HEM")
    assert hem.atom_count == 43
    assert "PROTOPORPHYRIN" in hem.name.upper()


def test_missing_residues_are_gaps_only() -> None:
    def residue(index: int, res_id: int, chain: str = "A") -> ResidueRecord:
        return ResidueRecord(
            index=index,
            chain_id=chain,
            res_id=res_id,
            name3="ALA",
            name1="A",
            sse="coil",
        )

    residues = [residue(0, 1), residue(1, 2), residue(2, 5), residue(3, 6)]
    missing = _missing_residues(residues)
    assert [(item.chain_id, item.start, item.end) for item in missing] == [
        ("A", 3, 4)
    ]


def test_residue_keys_are_unique(analysis_1crn) -> None:
    keys = {
        (residue.chain_id, residue.res_id, residue.ins_code)
        for residue in analysis_1crn.residues
    }
    assert len(keys) == len(analysis_1crn.residues)
