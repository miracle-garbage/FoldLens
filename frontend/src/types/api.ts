/** Wire types mirroring `docs/ARCHITECTURE.md` sections 6-7. */

export type Sse = 'helix' | 'strand' | 'coil'

export type Scheme =
  | 'ss'
  | 'chain'
  | 'position'
  | 'hydrophobicity'
  | 'charge'
  | 'bfactor'
  | 'element'

export type Representation = 'cartoon' | 'stick' | 'sphere'

export interface ResidueKey {
  chainId: string
  resId: number
  insCode: string
}

export interface ResidueRecord extends ResidueKey {
  index: number
  name3: string
  name1: string | null
  sse: Sse
  phi: number | null
  psi: number | null
  bFactor: number | null
  hydrophobicity: number | null
}

export interface LigandRecord extends ResidueKey {
  compId: string
  name: string
  atomCount: number
}

export interface MissingRange {
  chainId: string
  start: number
  end: number
}

export interface EntryMeta {
  entryId: string
  pdbId: string | null
  structureFormat: 'cif' | 'pdb'
  title: string
  method: string | null
  resolution: number | null
  rFree: number | null
  depositedAt: string | null
  atomCount: number
  residueCount: number
  chainCount: number
  ligands: LigandRecord[]
  missingResidues: MissingRange[]
}

export interface EntryStats {
  helixCount: number
  strandCount: number
  coilCount: number
  meanBFactor: number | null
  hydrophobicFraction: number | null
}

export interface EntryAnalysis {
  meta: EntryMeta
  residues: ResidueRecord[]
  contacts: [number, number][]
  stats: EntryStats
}

export interface SampleSummary {
  pdbId: string
  name: string
  description: string
  thumbnailUrl: string
  chainCount: number
  residueCount: number
  resolution: number | null
}

export interface UploadResponse {
  entryId: string
  analysis: EntryAnalysis
}

export interface HealthResponse {
  status: string
  version: string
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    detail: unknown
  }
}
