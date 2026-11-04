import type { LigandRecord, ResidueRecord, Scheme, Representation } from '@/types/api'

export type Language = 'zh' | 'en'

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: import('@/lib/api').ApiError }

export interface WorkspaceQuery {
  chain?: string
  res?: string
  ins?: string
  scheme?: Scheme
  repr?: Representation
}

export type SelectedEntity =
  | { kind: 'residue'; residue: ResidueRecord }
  | { kind: 'ligand'; ligand: LigandRecord }

export const SCHEMES: Scheme[] = [
  'ss',
  'chain',
  'hydrophobicity',
  'bfactor',
  'element',
]

export const REPRESENTATIONS: Representation[] = ['cartoon', 'stick', 'sphere']
