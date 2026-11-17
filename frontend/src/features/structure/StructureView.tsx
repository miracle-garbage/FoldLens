import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { formatResidueId } from '@/lib/format'
import {
  keyOfResidue,
  resolveSelection,
  type ResidueIndex,
} from '@/lib/residue-index'
import { useStructureText } from '@/lib/use-entry'
import type {
  EntryAnalysis,
  Representation,
  ResidueKey,
  Scheme,
} from '@/types/api'

import { setSubtreeVisibility } from 'molstar/lib/mol-plugin/behavior/static/state'
import { PluginConfig } from 'molstar/lib/mol-plugin/config'
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms'
import { PluginContext } from 'molstar/lib/mol-plugin/context'
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec'
import { StructureElement } from 'molstar/lib/mol-model/structure'
import type { Structure } from 'molstar/lib/mol-model/structure'
import { StateSelection } from 'molstar/lib/mol-state'
import type { StateTransform } from 'molstar/lib/mol-state'
import type { ColorTheme } from 'molstar/lib/mol-theme/color'

import { createFoldLensColorThemeProvider } from './molstar-color-theme'
import {
  applyViewerOptions,
  baseRepresentationProps,
  disableDefaultCameraAxes,
  firstStructureLocation,
  hiddenChainsBundle,
  ligandExpression,
  ligandRepresentationProps,
  polymerExpression,
  residueExpression,
  residueKeyFromLocation,
  selectionLabelProps,
  selectionRepresentationProps,
} from './molstar-style'

export interface StructureExportHandle {
  exportPng(): Promise<string>
}

interface StructureViewProps {
  analysis: EntryAnalysis
  index: ResidueIndex
  scheme: Scheme
  representation: Representation
  selection: ResidueKey | null
  hiddenChains: string[]
  onSelect: (key: ResidueKey | null) => void
  onExportReady: (handle: StructureExportHandle | null) => void
  onShowAllChains: () => void
}

interface SceneRuntime {
  plugin: PluginContext
  structure: Structure
  structureRef: StateTransform.Ref
  colorTheme: ColorTheme.Provider
  polymerRef?: StateTransform.Ref
  ligandRef?: StateTransform.Ref
  polymerRepresentationRef?: StateTransform.Ref
  ligandRepresentationRef?: StateTransform.Ref
  ligandRepresentationsAdded: boolean
}

interface HoverState {
  label: string
  x: number
  y: number
}

async function applyHiddenChains(
  runtime: SceneRuntime,
  hiddenChains: string[],
): Promise<void> {
  const refs = [
    runtime.polymerRepresentationRef,
    runtime.ligandRepresentationRef,
  ].filter((ref): ref is StateTransform.Ref => ref !== undefined)
  if (refs.length === 0) {
    return
  }

  const layers =
    hiddenChains.length === 0
      ? []
      : [
          {
            bundle: hiddenChainsBundle(runtime.structure, hiddenChains),
            value: 1,
          },
        ]
  const update = runtime.plugin.state.data.build()
  for (const ref of refs) {
    const existing = runtime.plugin.state.data.select(
      StateSelection.Generators.ofTransformer(
        StateTransforms.Representation.TransparencyStructureRepresentation3DFromBundle,
        ref,
      ).withTag('foldlens-hidden-chains'),
    )
    if (existing.length > 0) {
      update.to(existing[0]).update({ layers })
      for (const duplicate of existing.slice(1)) {
        update.delete(duplicate)
      }
    } else {
      update.to(ref).apply(
        StateTransforms.Representation.TransparencyStructureRepresentation3DFromBundle,
        { layers },
        { tags: 'foldlens-hidden-chains' },
      )
    }
  }
  await update.commit({ doNotUpdateCurrent: true })
  runtime.plugin.canvas3d?.requestDraw()
}

export function StructureView({
  analysis,
  index,
  scheme,
  representation,
  selection,
  hiddenChains,
  onSelect,
  onExportReady,
  onShowAllChains,
}: StructureViewProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<SceneRuntime | null>(null)
  const selectionRef = useRef<StateTransform.Ref | null>(null)
  const hiddenChainsRef = useRef(hiddenChains)
  const lastAtomClickRef = useRef(0)
  const pointerRef = useRef({ x: 16, y: 16 })
  const didInitialRepresentationRef = useRef(false)
  const onSelectRef = useRef(onSelect)
  const tRef = useRef(t)

  const [sceneVersion, setSceneVersion] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)
  const [initFailed, setInitFailed] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const [hover, setHover] = useState<HoverState | null>(null)

  const { state: textState, retry: retryText } = useStructureText(
    analysis.meta.entryId,
  )
  const structureText =
    textState.status === 'success' ? textState.data : null
  const fileFormat = analysis.meta.structureFormat

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    tRef.current = t
  }, [t])

  useEffect(() => {
    hiddenChainsRef.current = hiddenChains
  }, [hiddenChains])

  const updatePointer = useCallback((event: MouseEvent) => {
    const container = containerRef.current
    if (!container) {
      return
    }
    const bounds = container.getBoundingClientRect()
    pointerRef.current = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!structureText || !container) {
      return
    }

    let disposed = false
    let localPlugin: PluginContext | null = null
    let clickSubscription: { unsubscribe(): void } | null = null
    let hoverSubscription: { unsubscribe(): void } | null = null
    let resizeObserver: ResizeObserver | null = null

    runtimeRef.current = null
    selectionRef.current = null
    didInitialRepresentationRef.current = false
    setIsInitializing(true)
    setInitFailed(false)

    void (async () => {
      const spec = DefaultPluginSpec()
      // The custom React shell owns hover/selection/axes. Leaving Mol*'s
      // built-in interaction behaviors enabled would add duplicate markings,
      // camera jumps, and a corner axis widget that DESIGN.md does not allow.
      const excludedBehaviors = new Set([
        'camera-axis-helper',
        'camera-focus-loci',
        'representation-highlight-loci',
        'representation-select-loci',
        'representation-focus-loci',
        'create-structure-focus-representation',
      ])
      spec.behaviors = spec.behaviors.filter(
        (behavior) =>
          !excludedBehaviors.has(behavior.transformer.definition.name),
      )
      // FoldLens is a local instrument. Accepting the "major performance
      // caveat" keeps software WebGL (and headless Chromium) working instead
      // of failing to create a context outright.
      spec.config = [
        ...(spec.config ?? []),
        [PluginConfig.General.AllowMajorPerformanceCaveat, true],
      ]
      disableDefaultCameraAxes()

      const plugin = new PluginContext(spec)
      localPlugin = plugin
      await plugin.init()
      if (disposed) {
        plugin.dispose()
        return
      }

      const canvas = document.createElement('canvas')
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.display = 'block'
      canvas.style.touchAction = 'none'
      container.replaceChildren(canvas)

      const initialized = await plugin.initViewerAsync(canvas, container)
      if (!initialized) {
        throw new Error('Mol* viewer initialization failed')
      }
      await plugin.canvas3dInitialized
      if (disposed) {
        plugin.dispose()
        return
      }

      resizeObserver = new ResizeObserver(() => {
        if (
          container.isConnected &&
          container.clientWidth > 0 &&
          container.clientHeight > 0
        ) {
          plugin.handleResize()
        }
      })
      resizeObserver.observe(container)

      applyViewerOptions(plugin)

      const colorTheme = createFoldLensColorThemeProvider(analysis, index)
      plugin.representation.structure.themes.colorThemeRegistry.add(
        colorTheme,
      )

      const data = await plugin.builders.data.rawData({
        data: structureText,
        label: analysis.meta.entryId,
      })
      const trajectory = await plugin.builders.structure.parseTrajectory(
        data,
        fileFormat === 'pdb' ? 'pdb' : 'mmcif',
      )
      const model =
        await plugin.builders.structure.createModel(trajectory)
      // The backend analyses the asymmetric unit, so never apply an assembly
      // preset that would add symmetry mates to the viewport.
      const structure =
        await plugin.builders.structure.createStructure(model, {
          name: 'model',
          params: {},
        })

      if (disposed) {
        plugin.dispose()
        return
      }

      const structureValue = structure.data
      if (!structureValue) {
        throw new Error('Mol* structure is unavailable')
      }

      const polymer =
        await plugin.builders.structure.tryCreateComponentFromExpression(
          structure,
          polymerExpression(),
          'polymer',
          { label: 'Polymer' },
        )
      const ligand =
        await plugin.builders.structure.tryCreateComponentFromExpression(
          structure,
          ligandExpression(),
          'ligand',
          { label: 'Ligand' },
        )

      if (disposed) {
        plugin.dispose()
        return
      }

      // Frame the whole structure before any representation exists.
      plugin.managers.camera.focusLoci(
        StructureElement.Loci.all(structureValue),
        { durationMs: 0 },
      )

      runtimeRef.current = {
        plugin,
        structure: structureValue,
        structureRef: structure.ref,
        colorTheme,
        polymerRef: polymer?.ref,
        ligandRef: ligand?.ref,
        ligandRepresentationsAdded: false,
      }

      let skipInitialClick = true
      clickSubscription = plugin.behaviors.interaction.click.subscribe(
        (event) => {
          // Mol* uses BehaviorSubjects; subscribing immediately replays the
          // current (empty) click and would clear the selection restored from
          // the URL.
          if (skipInitialClick) {
            skipInitialClick = false
            return
          }
          lastAtomClickRef.current = performance.now()
          const location = firstStructureLocation(event.current.loci)
          if (!location) {
            onSelectRef.current(null)
            return
          }
          const key = residueKeyFromLocation(location)
          if (hiddenChainsRef.current.includes(key.chainId)) {
            onSelectRef.current(null)
            return
          }
          const selected = resolveSelection(index, key)
          if (selected?.kind === 'residue') {
            onSelectRef.current(keyOfResidue(selected.residue))
            return
          }
          if (selected?.kind === 'ligand') {
            onSelectRef.current({
              chainId: selected.ligand.chainId,
              resId: selected.ligand.resId,
              insCode: selected.ligand.insCode,
            })
            return
          }
          onSelectRef.current(null)
        },
      )

      let skipInitialHover = true
      hoverSubscription = plugin.behaviors.interaction.hover.subscribe(
        (event) => {
          if (skipInitialHover) {
            skipInitialHover = false
            return
          }
          const location = firstStructureLocation(event.current.loci)
          if (!location) {
            setHover(null)
            return
          }
          const key = residueKeyFromLocation(location)
          if (hiddenChainsRef.current.includes(key.chainId)) {
            setHover(null)
            return
          }
          const selected = resolveSelection(index, key)
          if (selected?.kind === 'residue') {
            setHover({
              label: `${selected.residue.name3} ${formatResidueId(
                selected.residue.resId,
                selected.residue.insCode,
              )} · ${tRef.current(
                `residue.sse.${selected.residue.sse}`,
              )}`,
              ...pointerRef.current,
            })
            return
          }
          if (selected?.kind === 'ligand') {
            setHover({
              label: `${selected.ligand.compId} ${
                selected.ligand.resId
              } · ${tRef.current('workspace.structure.ligand')}`,
              ...pointerRef.current,
            })
            return
          }
          setHover(null)
        },
      )

      onExportReady({
        exportPng: () => {
          const screenshot = plugin.helpers.viewportScreenshot
          if (!screenshot) {
            return Promise.reject(new Error('Screenshot helper unavailable'))
          }
          return screenshot.getImageDataUri()
        },
      })
      setSceneVersion((version) => version + 1)
    })().catch(() => {
      if (!disposed) {
        setInitFailed(true)
        setIsInitializing(false)
      }
    })

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      clickSubscription?.unsubscribe()
      hoverSubscription?.unsubscribe()
      runtimeRef.current = null
      selectionRef.current = null
      onExportReady(null)
      if (localPlugin) {
        try {
          localPlugin.dispose()
        } catch {
          // The viewer is being discarded; teardown must not throw.
        }
      }
      container.replaceChildren()
    }
  }, [
    structureText,
    fileFormat,
    analysis,
    index,
    onExportReady,
    retryNonce,
  ])

  // Polymer and ligand use one component each. Chain hiding is expressed as a
  // transparency layer, so toggling a chain never rebuilds the structure.
  useLayoutEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime) {
      return
    }
    let cancelled = false

    void (async () => {
      try {
        if (runtime.polymerRef) {
          const polymerRepresentation =
            await runtime.plugin.builders.structure.representation.addRepresentation(
              runtime.polymerRef,
              baseRepresentationProps(
                representation,
                runtime.colorTheme,
                scheme,
              ),
              { tag: 'polymer-representation' },
            )
          if (cancelled) {
            return
          }
          runtime.polymerRepresentationRef =
            polymerRepresentation?.ref
          await applyHiddenChains(runtime, hiddenChainsRef.current)
          runtime.plugin.canvas3d?.requestDraw()
        }

        if (!didInitialRepresentationRef.current) {
          didInitialRepresentationRef.current = true
          setIsInitializing(false)
        }

        if (
          runtime.ligandRepresentationsAdded ||
          !runtime.ligandRef ||
          cancelled
        ) {
          return
        }

        const ligandRepresentation =
          await runtime.plugin.builders.structure.representation.addRepresentation(
            runtime.ligandRef,
            ligandRepresentationProps(runtime.colorTheme),
            { tag: 'ligand-representation' },
          )
        if (cancelled) {
          return
        }
        runtime.ligandRepresentationRef = ligandRepresentation?.ref
        runtime.ligandRepresentationsAdded = true
        await applyHiddenChains(runtime, hiddenChainsRef.current)
        runtime.plugin.canvas3d?.requestDraw()
      } catch {
        if (!cancelled) {
          setInitFailed(true)
          setIsInitializing(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [sceneVersion, scheme, representation])

  // Hidden chains become fully transparent; geometry and picking stay intact,
  // and click/hover ignore them explicitly.
  useLayoutEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime) {
      return
    }
    void applyHiddenChains(runtime, hiddenChains).catch(() => undefined)
  }, [sceneVersion, hiddenChains])

  useLayoutEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime) {
      return
    }
    let cancelled = false

    void (async () => {
      try {
        if (!selection) {
          if (selectionRef.current) {
            setSubtreeVisibility(
              runtime.plugin.state.data,
              selectionRef.current,
              true,
            )
            runtime.plugin.canvas3d?.requestDraw()
          }
          return
        }

        const selected = resolveSelection(index, selection)
        if (!selected) {
          return
        }

        const expression =
          selected.kind === 'residue'
            ? residueExpression(keyOfResidue(selected.residue))
            : residueExpression(selected.ligand, selected.ligand.compId)

        const component =
          await runtime.plugin.builders.structure.tryCreateComponentFromExpression(
            runtime.structureRef,
            expression,
            'selection',
            { label: 'Selection' },
          )
        if (cancelled || !component) {
          return
        }

        if (selectionRef.current !== component.ref) {
          selectionRef.current = component.ref
          await runtime.plugin.builders.structure.representation.addRepresentation(
            component,
            selectionRepresentationProps(),
            { tag: 'selection-stick' },
          )
          await runtime.plugin.builders.structure.representation.addRepresentation(
            component,
            selectionLabelProps(),
            { tag: 'selection-label' },
          )
        }
        setSubtreeVisibility(
          runtime.plugin.state.data,
          component.ref,
          false,
        )
        runtime.plugin.canvas3d?.requestDraw()
      } catch {
        // A stale selection during teardown is safe to ignore.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [sceneVersion, selection, index])

  const allHidden =
    index.chains.length > 0 &&
    index.chains.every((chainId) => hiddenChains.includes(chainId))

  const handleBackgroundClick = () => {
    if (performance.now() - lastAtomClickRef.current < 80) {
      return
    }
    onSelect(null)
  }

  const handleRetry = () => {
    setRetryNonce((nonce) => nonce + 1)
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-lg border border-line bg-viewport"
      onMouseMove={(event) => updatePointer(event.nativeEvent)}
      onClick={handleBackgroundClick}
    >
      <div
        ref={containerRef}
        role="application"
        aria-label={t('a11y.structureCanvas')}
        className="absolute inset-0"
      />

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 font-mono text-mono-s text-surface/50">
        {t('workspace.structure.hoverHint')}
      </div>

      {hover && !allHidden ? (
        <div
          className="pointer-events-none absolute z-20 rounded-xs bg-ink px-2 py-1 font-mono text-mono-s text-surface"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          {hover.label}
        </div>
      ) : null}

      {textState.status === 'idle' ||
      textState.status === 'loading' ||
      (textState.status === 'success' && isInitializing) ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-viewport">
          <LoadingState label={t('workspace.structure.loading')} dark />
        </div>
      ) : null}

      {textState.status === 'error' ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-viewport p-6">
          <div className="w-full max-w-md rounded-sm bg-surface">
            <ErrorState
              error={textState.error}
              title={t('workspace.structure.error')}
              onRetry={retryText}
              compact
            />
          </div>
        </div>
      ) : null}

      {initFailed ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-viewport p-6">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-sm bg-surface p-5">
            <p className="text-body-s text-danger">
              {t('workspace.structure.error')}
            </p>
            <Button onClick={handleRetry} className="w-fit">
              {t('workspace.structure.retry')}
            </Button>
          </div>
        </div>
      ) : null}

      {allHidden && textState.status === 'success' && !isInitializing ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-viewport/95">
          <div className="flex flex-col items-center gap-4">
            <EmptyState
              title={t('workspace.structure.allHidden')}
              dark
              compact
            />
            <Button
              onClick={onShowAllChains}
              className="border-surface/40 text-surface hover:bg-viewport-grid"
            >
              {t('workspace.structure.showAll')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
