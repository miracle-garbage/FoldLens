import type { AtomSpec, AtomStyleSpec, GLViewer } from '3dmol'

import type {
  EntryAnalysis,
  Representation,
  ResidueKey,
  ResidueRecord,
  Scheme,
} from '@/types/api'
import type { ResidueIndex } from '@/lib/residue-index'
import { keyString } from '@/lib/residue-index'
import {
  SELECTED_STYLE,
  SSE_COLORS,
  UI_COLORS,
  colorForBFactor,
  colorForChain,
  colorForCharge,
  colorForElement,
  colorForHydrophobicity,
  colorForPosition,
} from './colors'

export interface StructureStyleOptions {
  analysis: EntryAnalysis
  index: ResidueIndex
  scheme: Scheme
  representation: Representation
  selection: ResidueKey | null
  hiddenChains: string[]
  selectedLabel: string
}

export function residueForAtom(
  atom: AtomSpec,
  index: ResidueIndex,
): ResidueRecord | undefined {
  if (atom.chain === undefined || atom.resi === undefined) {
    return undefined
  }
  const chain = String(atom.chain)
  const resId = Number(atom.resi)
  const exact = index.byKey.get(`${chain}|${resId}|${atom.icode ?? ''}`)
  if (exact) {
    return exact
  }
  // 3Dmol exposes the mmCIF altLoc as `icode`, not the author insertion code;
  // fall back to chain + author residue number (ARCHITECTURE.md 4.5).
  return index.byChainResidue.get(`${chain}|${resId}`)
}

function bFactorRange(residues: ResidueRecord[]): [number, number] {
  const values = residues
    .map((residue) => residue.bFactor)
    .filter((value): value is number => value !== null)
  if (values.length === 0) {
    return [0, 1]
  }
  return [Math.min(...values), Math.max(...values)]
}

interface PositionScale {
  localIndex: Map<string, number>
  totals: Map<string, number>
}

function buildPositionScale(residues: ResidueRecord[]): PositionScale {
  const localIndex = new Map<string, number>()
  const totals = new Map<string, number>()
  for (const residue of residues) {
    const position = totals.get(residue.chainId) ?? 0
    localIndex.set(keyString(residue), position)
    totals.set(residue.chainId, position + 1)
  }
  return { localIndex, totals }
}

function colorForAtom(
  atom: AtomSpec,
  options: StructureStyleOptions,
  bRange: [number, number],
  positionScale: PositionScale | null,
): string {
  const residue = residueForAtom(atom, options.index)
  switch (options.scheme) {
    case 'ss':
      return residue ? SSE_COLORS[residue.sse] : UI_COLORS.muted
    case 'chain':
      return colorForChain(String(atom.chain ?? ''))
    case 'position': {
      if (!residue || !positionScale) {
        return UI_COLORS.muted
      }
      return colorForPosition(
        positionScale.localIndex.get(keyString(residue)) ?? 0,
        positionScale.totals.get(residue.chainId) ?? 1,
      )
    }
    case 'hydrophobicity':
      return colorForHydrophobicity(residue?.hydrophobicity ?? null)
    case 'charge':
      return colorForCharge(residue?.name3)
    case 'bfactor':
      return colorForBFactor(residue?.bFactor ?? null, bRange[0], bRange[1])
    case 'element':
      return colorForElement(atom.elem)
    default:
      return UI_COLORS.muted
  }
}

function baseStyleFor(
  representation: Representation,
  colorfunc: (atom: AtomSpec) => string,
): AtomStyleSpec {
  switch (representation) {
    case 'stick':
      return { stick: { colorfunc, radius: 0.16 } }
    case 'sphere':
      return { sphere: { colorfunc, scale: 0.28 } }
    case 'cartoon':
    default:
      return { cartoon: { colorfunc, thickness: 0.4 } }
  }
}

function selectionStyle(
  representation: Representation,
  colorfunc: (atom: AtomSpec) => string,
): AtomStyleSpec {
  if (representation === 'cartoon') {
    return {
      cartoon: { colorfunc, thickness: 0.4 },
      stick: { color: SELECTED_STYLE.color, radius: 0.22 },
    }
  }
  if (representation === 'sphere') {
    return {
      sphere: { colorfunc, scale: 0.28 },
      stick: { color: SELECTED_STYLE.color, radius: 0.2 },
    }
  }
  return { stick: { color: SELECTED_STYLE.color, radius: 0.28 } }
}

export function applyStructureStyles(
  viewer: GLViewer,
  options: StructureStyleOptions,
): void {
  const bRange = bFactorRange(options.analysis.residues)
  const positionScale =
    options.scheme === 'position'
      ? buildPositionScale(options.analysis.residues)
      : null
  const colorfunc = (atom: AtomSpec) =>
    colorForAtom(atom, options, bRange, positionScale)

  viewer.setStyle({}, {})
  viewer.setStyle({}, baseStyleFor(options.representation, colorfunc))
  viewer.setStyle(
    { hetflag: true },
    { stick: { colorscheme: 'Jmol', radius: 0.14 } },
  )

  for (const chainId of options.hiddenChains) {
    viewer.setStyle({ chain: chainId }, {})
  }

  viewer.removeAllLabels()

  if (!options.selection) {
    return
  }
  const selector = {
    chain: options.selection.chainId,
    resi: options.selection.resId,
  }
  viewer.setStyle(
    selector,
    selectionStyle(options.representation, colorfunc),
  )

  const atoms = viewer.selectedAtoms(selector)
  if (atoms.length === 0) {
    return
  }
  const anchor =
    atoms.find((atom) => atom.atom === 'CA') ?? atoms[0]
  viewer.addLabel(options.selectedLabel, {
    position: { x: anchor.x ?? 0, y: anchor.y ?? 0, z: anchor.z ?? 0 },
    backgroundColor: SELECTED_STYLE.color,
    backgroundOpacity: 0.92,
    fontColor: SELECTED_STYLE.labelText,
    fontSize: 11,
    borderThickness: 0,
    inFront: true,
    showBackground: true,
  })
}

export function selectionKeyString(key: ResidueKey | null): string {
  return key ? keyString(key) : ''
}
