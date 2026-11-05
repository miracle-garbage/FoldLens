import type { AtomSpec, GLViewer } from '3dmol'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  LigandRecord,
  Representation,
  ResidueKey,
  Scheme,
} from '@/types/api'
import { UI_COLORS } from './colors'
import { applyStructureStyles, residueForAtom } from './style'

interface StructureViewProps {
  analysis: EntryAnalysis
  index: ResidueIndex
  scheme: Scheme
  representation: Representation
  selection: ResidueKey | null
  hiddenChains: string[]
  onSelect: (key: ResidueKey | null) => void
  onViewerReady: (viewer: GLViewer | null) => void
  onShowAllChains: () => void
}

interface HoverState {
  label: string
  x: number
  y: number
}

function ligandForAtom(
  atom: AtomSpec,
  analysis: EntryAnalysis,
): LigandRecord | undefined {
  if (atom.chain === undefined || atom.resi === undefined) {
    return undefined
  }
  return analysis.meta.ligands.find(
    (ligand) =>
      ligand.chainId === String(atom.chain) &&
      ligand.resId === Number(atom.resi),
  )
}

export function StructureView({
  analysis,
  index,
  scheme,
  representation,
  selection,
  hiddenChains,
  onSelect,
  onViewerReady,
  onShowAllChains,
}: StructureViewProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const lastAtomClickRef = useRef(0)
  const [viewer, setViewer] = useState<GLViewer | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [initFailed, setInitFailed] = useState(false)
  const [hover, setHover] = useState<HoverState | null>(null)
  const { state: textState, retry: retryText } = useStructureText(
    analysis.meta.entryId,
  )
  const structureText =
    textState.status === 'success' ? textState.data : null
  const fileFormat = analysis.meta.structureFormat

  const updatePointer = useCallback((event: MouseEvent) => {
    const container = containerRef.current
    if (!container) {
      return
    }
    const bounds = container.getBoundingClientRect()
    setHover((current) =>
      current
        ? {
            ...current,
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          }
        : current,
    )
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!structureText || !container) {
      return
    }
    let disposed = false
    let localViewer: GLViewer | null = null
    setIsInitializing(true)
    setInitFailed(false)

    void import('3dmol')
      .then((imported) => {
        if (disposed) {
          return
        }
        const fallback = (
          imported as unknown as {
            default?: { createViewer: typeof imported.createViewer }
          }
        ).default
        const createViewer = imported.createViewer ?? fallback?.createViewer
        if (!createViewer) {
          throw new Error('3Dmol createViewer is unavailable.')
        }
        const created = createViewer(container, {
          backgroundColor: UI_COLORS.viewport,
          antialias: true,
        })
        created.addModel(structureText, fileFormat)
        created.zoomTo()
        created.render()
        localViewer = created
        setViewer(created)
        onViewerReady(created)
        setIsInitializing(false)
      })
      .catch(() => {
        if (!disposed) {
          setInitFailed(true)
          setIsInitializing(false)
        }
      })

    return () => {
      disposed = true
      if (localViewer) {
        // 3Dmol's clear() ends with a render. React runs passive cleanups
        // after detaching the subtree, and 3Dmol's OffscreenCanvas path can
        // throw while drawing the final frame into the detached canvas
        // ("Failed to create ImageBitmap from OffscreenCanvas"). An exception
        // here would escape into React's unmount commit, so teardown must
        // never throw.
        try {
          localViewer.clear()
        } catch {
          // The viewer is being discarded; skipping its last frame is safe.
        }
        container.innerHTML = ''
        onViewerReady(null)
      }
      setViewer(null)
    }
  }, [structureText, fileFormat, onViewerReady])

  useEffect(() => {
    const container = containerRef.current
    if (!viewer || !container) {
      return
    }
    let timer = 0
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        // Skip zero/detached sizes: resizing to 0 during unmount leaves the
        // canvas without a drawable image for 3Dmol's final render.
        if (
          !container.isConnected ||
          container.clientWidth === 0 ||
          container.clientHeight === 0
        ) {
          return
        }
        viewer.resize()
      }, 100)
    })
    observer.observe(container)
    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [viewer])

  useEffect(() => {
    if (!viewer) {
      return
    }
    viewer.setClickable({}, true, (atom: AtomSpec) => {
      lastAtomClickRef.current = performance.now()
      const residue = residueForAtom(atom, index)
      if (residue) {
        onSelect(keyOfResidue(residue))
        return
      }
      const ligand = ligandForAtom(atom, analysis)
      if (ligand) {
        onSelect({
          chainId: ligand.chainId,
          resId: ligand.resId,
          insCode: ligand.insCode,
        })
        return
      }
      onSelect(null)
    })
    viewer.setHoverable(
      {},
      true,
      (atom: AtomSpec) => {
        const residue = residueForAtom(atom, index)
        if (residue) {
          setHover((current) => ({
            label: `${residue.name3} ${formatResidueId(
              residue.resId,
              residue.insCode,
            )} · ${t(`residue.sse.${residue.sse}`)}`,
            x: current?.x ?? 16,
            y: current?.y ?? 16,
          }))
          return
        }
        const ligand = ligandForAtom(atom, analysis)
        if (ligand) {
          setHover((current) => ({
            label: `${ligand.compId} ${ligand.resId} · ${t(
              'workspace.structure.ligand',
            )}`,
            x: current?.x ?? 16,
            y: current?.y ?? 16,
          }))
          return
        }
        setHover(null)
      },
      () => setHover(null),
    )
    return () => {
      viewer.setClickable({}, false, () => undefined)
      viewer.setHoverable(
        {},
        false,
        () => undefined,
        () => undefined,
      )
    }
  }, [viewer, index, analysis, onSelect, t])

  const selected = resolveSelection(index, selection)
  const selectedLabel = selected
    ? selected.kind === 'residue'
      ? `${selected.residue.name3} ${formatResidueId(
          selected.residue.resId,
          selected.residue.insCode,
        )}`
      : `${selected.ligand.compId} ${selected.ligand.resId}`
    : ''

  useEffect(() => {
    if (!viewer) {
      return
    }
    applyStructureStyles(viewer, {
      analysis,
      index,
      scheme,
      representation,
      selection,
      hiddenChains,
      selectedLabel,
    })
    viewer.render()
  }, [
    viewer,
    analysis,
    index,
    scheme,
    representation,
    selection,
    hiddenChains,
    selectedLabel,
  ])

  const allHidden =
    index.chains.length > 0 &&
    index.chains.every((chainId) => hiddenChains.includes(chainId))

  const handleBackgroundClick = () => {
    if (performance.now() - lastAtomClickRef.current < 80) {
      return
    }
    onSelect(null)
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
            <Button onClick={retryText} className="w-fit">
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
