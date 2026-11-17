import { ColorTheme } from 'molstar/lib/mol-theme/color'
import type { ColorTypeLocation } from 'molstar/lib/mol-geo/geometry/color-data'
import type { Location } from 'molstar/lib/mol-model/location'
import {
  Bond,
  StructureElement,
  StructureProperties,
} from 'molstar/lib/mol-model/structure'
import { Color } from 'molstar/lib/mol-util/color'
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition'

import { keyString, type ResidueIndex } from '@/lib/residue-index'
import type {
  EntryAnalysis,
  ResidueRecord,
  Scheme,
} from '@/types/api'

import {
  SSE_COLORS,
  UI_COLORS,
  colorForBFactor,
  colorForChain,
  colorForCharge,
  colorForElement,
  colorForHydrophobicity,
  colorForPosition,
} from './colors'

export const FOLDLENS_COLOR_THEME_NAME = 'foldlens'

const SCHEMES: Scheme[] = [
  'ss',
  'chain',
  'position',
  'hydrophobicity',
  'charge',
  'bfactor',
  'element',
]

const FoldLensColorThemeParams = {
  scheme: PD.Select<Scheme>(
    'ss',
    SCHEMES.map((scheme) => [scheme, scheme] as [Scheme, string]),
  ),
}

function toColor(hex: string): Color {
  return Color(Number.parseInt(hex.slice(1), 16))
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

/** Per-entry values shared by every atom of a colour scheme. */
interface ColorContext {
  bRange: [number, number]
  positionScale: PositionScale | null
}

function createColorContext(
  analysis: EntryAnalysis,
  scheme: Scheme,
): ColorContext {
  return {
    bRange: bFactorRange(analysis.residues),
    positionScale:
      scheme === 'position' ? buildPositionScale(analysis.residues) : null,
  }
}

/**
 * Mol* colour themes receive element and bond locations. Bond locations point
 * at the first atom, which is enough to recover the residue and element used by
 * every FoldLens scheme.
 */
function elementLocation(location: Location): StructureElement.Location | null {
  if (StructureElement.Location.is(location)) {
    return location
  }
  if (Bond.isLocation(location)) {
    return StructureElement.Location.create(
      location.aStructure,
      location.aUnit,
      location.aUnit.elements[location.aIndex],
    )
  }
  return null
}

function residueForLocation(
  location: StructureElement.Location,
  index: ResidueIndex,
): ResidueRecord | undefined {
  const chainId = StructureProperties.chain.auth_asym_id(location)
  const resId = StructureProperties.residue.auth_seq_id(location)
  const insCode =
    StructureProperties.residue.pdbx_PDB_ins_code(location) ?? ''
  return (
    index.byKey.get(`${chainId}|${resId}|${insCode}`) ??
    index.byChainResidue.get(`${chainId}|${resId}`)
  )
}

function colorForLocation(
  location: Location,
  scheme: Scheme,
  index: ResidueIndex,
  context: ColorContext,
): string {
  const structureLocation = elementLocation(location)
  if (!structureLocation) {
    return UI_COLORS.muted
  }

  const element = StructureProperties.atom.type_symbol(structureLocation)
  const chainId = StructureProperties.chain.auth_asym_id(structureLocation)
  const residue = residueForLocation(structureLocation, index)

  switch (scheme) {
    case 'chain':
      return colorForChain(chainId)
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
      return colorForElement(element)
    case 'ss':
    default:
      return residue ? SSE_COLORS[residue.sse] : UI_COLORS.muted
  }
}

/**
 * A FoldLens-owned colour theme. Using the project palette directly keeps the
 * Mol* renderer visually consistent with the rest of FoldLens instead of
 * inheriting Mol*'s default schemes.
 */
export function createFoldLensColorThemeProvider(
  analysis: EntryAnalysis,
  index: ResidueIndex,
): ColorTheme.Provider<
  typeof FoldLensColorThemeParams,
  typeof FOLDLENS_COLOR_THEME_NAME
> {
  const factory: ColorTheme.Factory<
    typeof FoldLensColorThemeParams,
    ColorTypeLocation
  > = (_ctx, props) => {
    const context = createColorContext(analysis, props.scheme)
    return {
      factory,
      granularity: 'group',
      color: (location) =>
        toColor(colorForLocation(location, props.scheme, index, context)),
      props,
      description: 'FoldLens token palette',
    }
  }

  return {
    name: FOLDLENS_COLOR_THEME_NAME,
    label: 'FoldLens',
    category: ColorTheme.Category.Residue,
    factory,
    getParams: () => PD.clone(FoldLensColorThemeParams),
    defaultValues: PD.getDefaultValues(FoldLensColorThemeParams),
    isApplicable: () => true,
  }
}
