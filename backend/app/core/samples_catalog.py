"""The six bundled samples.

Counts and resolution are *not* stored here: they are computed from the bundled
mmCIF files so the gallery never shows invented numbers.  Names and one-line
descriptions are stable catalogue data.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SampleDefinition:
    pdb_id: str
    name: str
    description: str


SAMPLE_CATALOG: tuple[SampleDefinition, ...] = (
    SampleDefinition(
        "1CRN",
        "Crambin",
        "A 46-residue plant seed protein and a classic first structure.",
    ),
    SampleDefinition(
        "1UBQ",
        "Ubiquitin",
        "A 76-residue regulatory protein used widely in teaching.",
    ),
    SampleDefinition(
        "1LYZ",
        "Lysozyme",
        "A 129-residue enzyme with a bound ligand.",
    ),
    SampleDefinition(
        "4HHB",
        "Hemoglobin",
        "A four-chain oxygen carrier with heme groups.",
    ),
    SampleDefinition(
        "6M0J",
        "Spike RBD-ACE2",
        "A protein-protein interface and a larger performance sample.",
    ),
    SampleDefinition(
        "1L2Y",
        "Trp-cage",
        "A 20-residue NMR miniprotein with a compact fold.",
    ),
)

SAMPLE_IDS: tuple[str, ...] = tuple(sample.pdb_id for sample in SAMPLE_CATALOG)
SAMPLE_MAP: dict[str, SampleDefinition] = {
    sample.pdb_id: sample for sample in SAMPLE_CATALOG
}
