import type {
  AtomSpec,
  AtomStyleSpec,
  GLModel,
  GLViewer,
  ViewerSpec,
} from '3dmol'

import type { ResidueIndex } from '@/lib/residue-index'
import { keyString } from '@/lib/residue-index'
import type {
  EntryAnalysis,
  Representation,
  ResidueKey,
  ResidueRecord,
  Scheme,
} from '@/types/api'
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
  let minimum = Number.POSITIVE_INFINITY
  let maximum = Number.NEGATIVE_INFINITY
  let found = false
  for (const residue of residues) {
    if (residue.bFactor === null) {
      continue
    }
    found = true
    minimum = Math.min(minimum, residue.bFactor)
    maximum = Math.max(maximum, residue.bFactor)
  }
  return found ? [minimum, maximum] : [0, 1]
}

export interface PositionScale {
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

/**
 * Per-entry values shared by every atom of a colour scheme. Computing these
 * once per analysis/scheme keeps them out of the click/selection path.
 */
export interface ColorContext {
  bRange: [number, number]
  positionScale: PositionScale | null
}

export function createColorContext(
  analysis: EntryAnalysis,
  scheme: Scheme,
): ColorContext {
  return {
    bRange: bFactorRange(analysis.residues),
    positionScale:
      scheme === 'position' ? buildPositionScale(analysis.residues) : null,
  }
}

function colorForAtom(
  atom: AtomSpec,
  scheme: Scheme,
  index: ResidueIndex,
  context: ColorContext,
): string {
  const residue = residueForAtom(atom, index)
  switch (scheme) {
    case 'ss':
      return residue ? SSE_COLORS[residue.sse] : UI_COLORS.muted
    case 'chain':
      return colorForChain(String(atom.chain ?? ''))
    case 'position': {
      if (!residue || !context.positionScale) {
        return UI_COLORS.muted
      }
      return colorForPosition(
        context.positionScale.localIndex.get(keyString(residue)) ?? 0,
        context.positionScale.totals.get(residue.chainId) ?? 1,
      )
    }
    case 'hydrophobicity':
      return colorForHydrophobicity(residue?.hydrophobicity ?? null)
    case 'charge':
      return colorForCharge(residue?.name3)
    case 'bfactor':
      return colorForBFactor(
        residue?.bFactor ?? null,
        context.bRange[0],
        context.bRange[1],
      )
    case 'element':
      return colorForElement(atom.elem)
    default:
      return UI_COLORS.muted
  }
}

export function createColorFunc(
  scheme: Scheme,
  index: ResidueIndex,
  context: ColorContext,
): (atom: AtomSpec) => string {
  return (atom) => colorForAtom(atom, scheme, index, context)
}

/**
 * Representation sizes. 3Dmol's defaults (cartoon thickness 0.4, stick
 * radius 0.16, sphere scale 0.28) make ribbons and atoms interpenetrate in
 * dense structures such as 4HHB and 6M0J, so every unit is reduced while
 * keeping selection highlights clearly thicker than the base style.
 */
const CARTOON_THICKNESS = 0.25
const STICK_RADIUS = 0.12
const SPHERE_SCALE = 0.22
const LIGAND_STICK_RADIUS = 0.11
const SELECTED_OVERLAY_RADIUS = 0.16
const SELECTED_STICK_RADIUS = 0.2

/**
 * Viewer-level quality settings. They are applied once at creation and do not
 * change the colour scheme or representation sizes.
 *
 * - `cartoonQuality` raises the spline subdivision from the default 10 to 16,
 *   smoothing ribbon turns; 20 was noticeably more expensive for little gain.
 * - `ambientOcclusion` adds contact shading in crevices, improving depth
 *   without altering the base token colours.
 * - `outline` is capped at ~1.2 screen pixels so dense ribbons stay legible
 *   on the dark viewport without turning the view illustrative.
 */
export const VIEWER_OPTIONS: ViewerSpec = {
  backgroundColor: UI_COLORS.viewport,
  antialias: true,
  cartoonQuality: 16,
  ambientOcclusion: { strength: 1.0, radius: 5 },
  outline: { width: 0.03, color: UI_COLORS.viewportGrid, maxpixels: 1.2 },
}

export function baseStyleFor(
  representation: Representation,
  colorfunc: (atom: AtomSpec) => string,
): AtomStyleSpec {
  switch (representation) {
    case 'stick':
      return { stick: { colorfunc, radius: STICK_RADIUS } }
    case 'sphere':
      return { sphere: { colorfunc, scale: SPHERE_SCALE } }
    case 'cartoon':
    default:
      return { cartoon: { colorfunc, thickness: CARTOON_THICKNESS } }
  }
}

/** Selected residues use a thicker accent stick in every representation. */
function selectedStickRadius(representation: Representation): number {
  return representation === 'stick'
    ? SELECTED_STICK_RADIUS
    : SELECTED_OVERLAY_RADIUS
}

/**
 * Full style for the accent overlay. When the selected residue's chain is
 * hidden, the overlay must also carry the base representation so the residue
 * stays visible instead of degrading to a lone stick.
 */
function selectionStyle(
  representation: Representation,
  colorfunc: (atom: AtomSpec) => string,
): AtomStyleSpec {
  return {
    ...baseStyleFor(representation, colorfunc),
    stick: {
      color: SELECTED_STYLE.color,
      radius: selectedStickRadius(representation),
    },
  }
}

export function selectionOverlayStyle(
  representation: Representation,
  colorfunc: (atom: AtomSpec) => string,
  includeBaseRepresentation: boolean,
): AtomStyleSpec {
  if (includeBaseRepresentation) {
    return selectionStyle(representation, colorfunc)
  }
  return {
    stick: {
      color: SELECTED_STYLE.color,
      radius: selectedStickRadius(representation),
    },
  }
}

/**
 * Apply styles to the main structure model only. The selection overlay lives
 * in a separate model so clicking a residue never invalidates the main
 * model's cached geometry (3Dmol rebuilds an entire model on any setStyle).
 */
export function applyBaseStyles(
  model: GLModel,
  baseStyle: AtomStyleSpec,
  hiddenChains: string[],
): void {
  model.setStyle({}, baseStyle)
  model.setStyle(
    { hetflag: true },
    { stick: { colorscheme: 'Jmol', radius: LIGAND_STICK_RADIUS } },
  )
  for (const chainId of hiddenChains) {
    model.setStyle({ chain: chainId }, {})
  }
}

/**
 * Rebuild the tiny selection overlay model from the main model's atoms.
 * Only the overlay's geometry is regenerated, so the cost is proportional to
 * the selected residue rather than the whole structure.
 */
export function updateSelectionOverlay(
  overlay: GLModel,
  model: GLModel,
  selection: ResidueKey | null,
  style: AtomStyleSpec,
): boolean {
  overlay.removeAtoms(overlay.selectedAtoms({}))
  if (!selection) {
    return false
  }
  const atoms = model.selectedAtoms({
    chain: selection.chainId,
    resi: selection.resId,
  })
  if (atoms.length === 0) {
    return false
  }
  overlay.addAtoms(atoms)
  overlay.setStyle({}, style)
  return true
}

export function updateSelectionLabel(
  viewer: GLViewer,
  model: GLModel,
  selection: ResidueKey | null,
  label: string,
): void {
  viewer.removeAllLabels()
  if (!selection || !label) {
    return
  }
  const atoms = model.selectedAtoms({
    chain: selection.chainId,
    resi: selection.resId,
  })
  if (atoms.length === 0) {
    return
  }
  const anchor = atoms.find((atom) => atom.atom === 'CA') ?? atoms[0]
  viewer.addLabel(label, {
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
