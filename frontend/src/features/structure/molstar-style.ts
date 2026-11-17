import { DefaultCanvas3DParams } from 'molstar/lib/mol-canvas3d/canvas3d'
import type { PluginContext } from 'molstar/lib/mol-plugin/context'
import type { StructureRepresentationProps } from 'molstar/lib/mol-plugin-state/helpers/structure-representation-params'
import {
  Bond,
  StructureElement,
  StructureProperties,
} from 'molstar/lib/mol-model/structure'
import type { Structure } from 'molstar/lib/mol-model/structure'
import type { Loci as ModelLoci } from 'molstar/lib/mol-model/loci'
import { BallAndStickRepresentationProvider } from 'molstar/lib/mol-repr/structure/representation/ball-and-stick'
import { CartoonRepresentationProvider } from 'molstar/lib/mol-repr/structure/representation/cartoon'
import { LabelRepresentationProvider } from 'molstar/lib/mol-repr/structure/representation/label'
import { SpacefillRepresentationProvider } from 'molstar/lib/mol-repr/structure/representation/spacefill'
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder'
import type { Expression } from 'molstar/lib/mol-script/language/expression'
import type { ColorTheme } from 'molstar/lib/mol-theme/color'
import { UniformColorThemeProvider } from 'molstar/lib/mol-theme/color/uniform'
import { Color } from 'molstar/lib/mol-util/color'

import type {
  Representation,
  ResidueKey,
  Scheme,
} from '@/types/api'

import { SELECTED_STYLE, UI_COLORS } from './colors'

function molstarColor(hex: string): Color {
  return Color(Number.parseInt(hex.slice(1), 16))
}

/**
 * Mol* 5.13 creates the camera-axes helper meshes from its default props and
 * its `axes: off` branch only flips the flag without clearing those meshes.
 * Turn the default off before Canvas3D is created so the corner widget never
 * exists; applyViewerOptions keeps the same setting for future versions.
 */
export function disableDefaultCameraAxes(): void {
  DefaultCanvas3DParams.camera.helper.axes.name = 'off'
}

/** Match the FoldLens viewport and avoid Mol*'s bright default. */
export function applyViewerOptions(plugin: PluginContext): void {
  const canvas = plugin.canvas3d
  if (!canvas) {
    return
  }
  const defaults = DefaultCanvas3DParams
  const disableAxes = () =>
    canvas.setProps({
      camera: { helper: { axes: { name: 'off', params: {} } } },
    })
  disableAxes()
  // Some Mol* versions re-apply the default helper props after the first
  // canvas commit. Re-assert the project viewport on the next frame.
  requestAnimationFrame(() => {
    disableAxes()
    canvas.requestDraw()
  })
  canvas.setProps({
    renderer: {
      ...defaults.renderer,
      backgroundColor: molstarColor(UI_COLORS.viewport),
    },
    postprocessing: {
      ...defaults.postprocessing,
      // Bloom adds a soft glow that conflicts with the instrument-like
      // viewport; ambient occlusion is enough.
      bloom: { name: 'off', params: {} },
      outline: {
        name: 'on',
        params: {
          scale: 1,
          threshold: 0.33,
          color: molstarColor(UI_COLORS.viewportGrid),
          includeTransparent: false,
        },
      },
    },
  })
}

/** Map FoldLens representations onto Mol* providers and our theme. */
export function baseRepresentationProps(
  representation: Representation,
  colorTheme: ColorTheme.Provider,
  scheme: Scheme,
): StructureRepresentationProps {
  switch (representation) {
    case 'stick':
      return {
        type: BallAndStickRepresentationProvider,
        typeParams: {
          sizeFactor: 0.15,
          sizeAspectRatio: 2 / 3,
          // FoldLens calls this representation "Stick"; omit the atom spheres
          // so it reads as sticks rather than ball-and-stick.
          visuals: ['intra-bond', 'inter-bond'],
        },
        color: colorTheme,
        colorParams: { scheme },
      }
    case 'sphere':
      return {
        type: SpacefillRepresentationProvider,
        typeParams: { sizeFactor: 0.22 },
        color: colorTheme,
        colorParams: { scheme },
      }
    case 'cartoon':
    default:
      return {
        type: CartoonRepresentationProvider,
        typeParams: { sizeFactor: 0.2 },
        color: colorTheme,
        colorParams: { scheme },
      }
  }
}

export function ligandRepresentationProps(
  colorTheme: ColorTheme.Provider,
): StructureRepresentationProps {
  return {
    type: BallAndStickRepresentationProvider,
    typeParams: { sizeFactor: 0.15, sizeAspectRatio: 2 / 3 },
    color: colorTheme,
    colorParams: { scheme: 'element' },
  }
}

export function selectionRepresentationProps(): StructureRepresentationProps {
  return {
    type: BallAndStickRepresentationProvider,
    typeParams: { sizeFactor: 0.22, sizeAspectRatio: 2 / 3 },
    color: UniformColorThemeProvider,
    colorParams: { value: molstarColor(SELECTED_STYLE.color) },
  }
}

export function selectionLabelProps(): StructureRepresentationProps {
  return {
    type: LabelRepresentationProvider,
    typeParams: {
      level: 'residue',
      background: true,
      backgroundOpacity: 0.92,
      backgroundColor: molstarColor(SELECTED_STYLE.color),
      borderWidth: 0,
      sizeFactor: 0.8,
    },
    color: UniformColorThemeProvider,
    colorParams: { value: molstarColor(SELECTED_STYLE.labelText) },
  }
}

function chainExpression(chainId: string): Expression {
  return MS.struct.generator.atomGroups({
    'chain-test': MS.core.rel.eq([
      MS.struct.atomProperty.macromolecular.auth_asym_id(),
      chainId,
    ]),
  })
}

/** Polymer component covering every chain. */
export function polymerExpression(): Expression {
  return MS.struct.generator.atomGroups({
    'entity-test': MS.core.rel.eq([MS.ammp('entityType'), 'polymer']),
  })
}

/** Non-water HETATM component covering every chain. */
export function ligandExpression(): Expression {
  return MS.struct.generator.atomGroups({
    'atom-test': MS.core.logic.and([
      MS.core.rel.eq([MS.ammp('isHet'), true]),
      MS.core.rel.neq([MS.ammp('entityType'), 'water']),
    ]),
  })
}

/** Bundle used to make hidden chains fully transparent without rebuilding. */
export function hiddenChainsBundle(
  structure: Structure,
  hiddenChains: string[],
): StructureElement.Bundle {
  if (hiddenChains.length === 0) {
    return StructureElement.Bundle.Empty
  }
  let loci = StructureElement.Loci.none(structure)
  for (const chainId of hiddenChains) {
    const chainLoci = StructureElement.Loci.fromExpression(
      structure,
      chainExpression(chainId),
    )
    loci = StructureElement.Loci.union(loci, chainLoci)
  }
  return StructureElement.Bundle.fromLoci(loci)
}

/** Expression matching one author-numbered residue (or ligand). */
export function residueExpression(
  key: ResidueKey,
  compId?: string,
): Expression {
  const conditions: Expression[] = [
    MS.core.rel.eq([
      MS.struct.atomProperty.macromolecular.auth_seq_id(),
      key.resId,
    ]),
  ]
  if (key.insCode) {
    conditions.push(
      MS.core.rel.eq([
        MS.struct.atomProperty.macromolecular.pdbx_PDB_ins_code(),
        key.insCode,
      ]),
    )
  }
  if (compId) {
    conditions.push(
      MS.core.rel.eq([
        MS.struct.atomProperty.macromolecular.auth_comp_id(),
        compId,
      ]),
    )
  }
  return MS.struct.generator.atomGroups({
    'chain-test': MS.core.rel.eq([
      MS.struct.atomProperty.macromolecular.auth_asym_id(),
      key.chainId,
    ]),
    'residue-test':
      conditions.length === 1
        ? conditions[0]
        : MS.core.logic.and(conditions),
  })
}

export function firstStructureLocation(
  loci: ModelLoci,
): StructureElement.Location | null {
  if (StructureElement.Loci.is(loci)) {
    return StructureElement.Loci.getFirstLocation(loci) ?? null
  }
  if (Bond.isLoci(loci)) {
    const bond = loci.bonds[0]
    if (!bond) {
      return null
    }
    return StructureElement.Location.create(
      bond.aStructure,
      bond.aUnit,
      bond.aUnit.elements[bond.aIndex],
    )
  }
  return null
}

export function residueKeyFromLocation(
  location: StructureElement.Location,
): ResidueKey {
  return {
    chainId: StructureProperties.chain.auth_asym_id(location),
    resId: StructureProperties.residue.auth_seq_id(location),
    insCode:
      StructureProperties.residue.pdbx_PDB_ins_code(location) ?? '',
  }
}
