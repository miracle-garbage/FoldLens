"""Public JSON schemas.

All models serialise to camelCase; internal code keeps snake_case field names.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


Sse = Literal["helix", "strand", "coil"]


class ResidueRecord(CamelModel):
    index: int
    chain_id: str
    res_id: int
    ins_code: str = ""
    name3: str
    name1: str | None = None
    sse: Sse
    phi: float | None = None
    psi: float | None = None
    b_factor: float | None = None
    hydrophobicity: float | None = None


class LigandRecord(CamelModel):
    chain_id: str
    res_id: int
    ins_code: str = ""
    comp_id: str
    name: str
    atom_count: int


class MissingRange(CamelModel):
    chain_id: str
    start: int
    end: int


class EntryMeta(CamelModel):
    entry_id: str
    pdb_id: str | None = None
    structure_format: Literal["cif", "pdb"] = "cif"
    title: str = ""
    method: str | None = None
    resolution: float | None = None
    r_free: float | None = None
    deposited_at: str | None = None
    atom_count: int = 0
    residue_count: int = 0
    chain_count: int = 0
    ligands: list[LigandRecord] = []
    missing_residues: list[MissingRange] = []


class EntryStats(CamelModel):
    helix_count: int = 0
    strand_count: int = 0
    coil_count: int = 0
    mean_b_factor: float | None = None
    hydrophobic_fraction: float | None = None


class EntryAnalysis(CamelModel):
    meta: EntryMeta
    residues: list[ResidueRecord] = []
    contacts: list[tuple[int, int]] = []
    stats: EntryStats = EntryStats()


class SampleSummary(CamelModel):
    pdb_id: str
    name: str
    description: str
    thumbnail_url: str
    chain_count: int
    residue_count: int
    resolution: float | None = None


class HealthResponse(CamelModel):
    status: str
    version: str


class UploadResponse(CamelModel):
    entry_id: str
    analysis: EntryAnalysis


class ErrorBody(CamelModel):
    code: str
    message: str
    detail: object | None = None


class ErrorResponse(CamelModel):
    error: ErrorBody
