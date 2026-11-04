import type {
  EntryAnalysis,
  LigandRecord,
  ResidueKey,
  ResidueRecord,
} from '@/types/api'
import type { SelectedEntity } from '@/types/domain'

export interface ResidueIndex {
  byKey: Map<string, ResidueRecord>
  byChainResidue: Map<string, ResidueRecord>
  ligandsByKey: Map<string, LigandRecord>
  chains: string[]
}

export function keyString(key: ResidueKey): string {
  return `${key.chainId}|${key.resId}|${key.insCode}`
}

export function chainResidueString(chainId: string, resId: number): string {
  return `${chainId}|${resId}`
}

export function keyOfResidue(residue: ResidueRecord): ResidueKey {
  return {
    chainId: residue.chainId,
    resId: residue.resId,
    insCode: residue.insCode,
  }
}

export function buildResidueIndex(analysis: EntryAnalysis): ResidueIndex {
  const byKey = new Map<string, ResidueRecord>()
  const byChainResidue = new Map<string, ResidueRecord>()
  const ligandsByKey = new Map<string, LigandRecord>()
  const chains: string[] = []
  const seenChains = new Set<string>()

  for (const residue of analysis.residues) {
    byKey.set(keyString(residue), residue)
    const chainKey = chainResidueString(residue.chainId, residue.resId)
    if (!byChainResidue.has(chainKey)) {
      byChainResidue.set(chainKey, residue)
    }
    if (!seenChains.has(residue.chainId)) {
      seenChains.add(residue.chainId)
      chains.push(residue.chainId)
    }
  }

  for (const ligand of analysis.meta.ligands) {
    const key = keyString(ligand)
    if (!ligandsByKey.has(key)) {
      ligandsByKey.set(key, ligand)
    }
  }

  return { byKey, byChainResidue, ligandsByKey, chains }
}

export function resolveSelection(
  index: ResidueIndex,
  selection: ResidueKey | null,
): SelectedEntity | null {
  if (!selection) {
    return null
  }
  const residue =
    index.byKey.get(keyString(selection)) ??
    index.byChainResidue.get(
      chainResidueString(selection.chainId, selection.resId),
    )
  if (residue) {
    return { kind: 'residue', residue }
  }
  const ligand = index.ligandsByKey.get(keyString(selection))
  if (ligand) {
    return { kind: 'ligand', ligand }
  }
  return null
}
