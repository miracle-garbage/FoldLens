import type { GLViewer } from '3dmol'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { StructureView } from '@/features/structure/StructureView'
import {
  buildResidueIndex,
  keyOfResidue,
  resolveSelection,
} from '@/lib/residue-index'
import {
  buildResidueCsv,
  copyText,
  downloadDataUri,
  downloadText,
} from '@/lib/export'
import { sameResidue } from '@/lib/format'
import { useAppStore } from '@/stores/app-store'
import type {
  EntryAnalysis,
  Representation,
  ResidueKey,
  Scheme,
} from '@/types/api'
import { REPRESENTATIONS, SCHEMES } from '@/types/domain'
import { SidePanel } from './SidePanel'
import { WorkspaceHeader } from './WorkspaceHeader'

function isScheme(value: string | null): value is Scheme {
  return value !== null && (SCHEMES as string[]).includes(value)
}

function isRepresentation(value: string | null): value is Representation {
  return value !== null && (REPRESENTATIONS as string[]).includes(value)
}

interface WorkspaceContentProps {
  analysis: EntryAnalysis
}

export function WorkspaceContent({ analysis }: WorkspaceContentProps) {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const selection = useAppStore((state) => state.selection)
  const scheme = useAppStore((state) => state.scheme)
  const representation = useAppStore((state) => state.representation)
  const hiddenChains = useAppStore((state) => state.hiddenChains)
  const selectResidue = useAppStore((state) => state.selectResidue)
  const setScheme = useAppStore((state) => state.setScheme)
  const setRepresentation = useAppStore(
    (state) => state.setRepresentation,
  )
  const setHiddenChains = useAppStore((state) => state.setHiddenChains)
  const showToast = useAppStore((state) => state.showToast)

  const index = useMemo(() => buildResidueIndex(analysis), [analysis])
  const viewerRef = useRef<GLViewer | null>(null)
  const appliedEntryRef = useRef<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  const onViewerReady = useCallback((viewer: GLViewer | null) => {
    viewerRef.current = viewer
  }, [])

  const handleSelect = useCallback(
    (key: ResidueKey | null) => {
      selectResidue(key)
    },
    [selectResidue],
  )

  useEffect(() => {
    if (appliedEntryRef.current === analysis.meta.entryId) {
      return
    }
    appliedEntryRef.current = analysis.meta.entryId

    const schemeParam = searchParams.get('scheme')
    setScheme(isScheme(schemeParam) ? schemeParam : 'ss')
    const reprParam = searchParams.get('repr')
    setRepresentation(
      isRepresentation(reprParam) ? reprParam : 'cartoon',
    )

    const chainId = searchParams.get('chain')
    const resValue = searchParams.get('res')
    const insCode = searchParams.get('ins') ?? ''
    let nextSelection: ResidueKey | null = null
    if (chainId && resValue) {
      const resId = Number.parseInt(resValue, 10)
      if (Number.isFinite(resId)) {
        const candidate = { chainId, resId, insCode }
        nextSelection = resolveSelection(index, candidate)
          ? candidate
          : null
      }
    }
    selectResidue(nextSelection)
    setHiddenChains([])
    setIsHydrated(true)
  }, [
    analysis.meta.entryId,
    index,
    searchParams,
    selectResidue,
    setHiddenChains,
    setRepresentation,
    setScheme,
  ])

  useEffect(() => {
    if (!isHydrated) {
      return
    }
    // Keep the URL in sync with in-workspace state without dispatching a
    // router navigation. A pending `setSearchParams` navigation can race the
    // header's back link and leave the URL and the rendered route out of sync
    // (the back button appears to do nothing, or the workspace stays mounted
    // at `/`). The spec only requires `replaceState` here, and nothing reads
    // the search params after mount, so write history directly.
    if (!window.location.pathname.startsWith('/entry/')) {
      return
    }
    const params = new URLSearchParams()
    params.set('scheme', scheme)
    params.set('repr', representation)
    if (selection) {
      params.set('chain', selection.chainId)
      params.set('res', String(selection.resId))
      if (selection.insCode) {
        params.set('ins', selection.insCode)
      }
    }
    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (currentUrl !== nextUrl) {
      window.history.replaceState(window.history.state, '', nextUrl)
    }
  }, [isHydrated, selection, scheme, representation])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"]',
        )
      ) {
        return
      }
      if (event.key === 'Escape') {
        selectResidue(null)
        return
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return
      }
      event.preventDefault()
      const residues = analysis.residues
      if (residues.length === 0) {
        return
      }
      if (!selection) {
        selectResidue(keyOfResidue(residues[0]))
        return
      }
      const currentPosition = residues.findIndex((residue) =>
        sameResidue(keyOfResidue(residue), selection),
      )
      if (currentPosition === -1) {
        selectResidue(keyOfResidue(residues[0]))
        return
      }
      const chainId = residues[currentPosition].chainId
      const step = event.key === 'ArrowRight' ? 1 : -1
      let nextPosition = currentPosition + step
      while (nextPosition >= 0 && nextPosition < residues.length) {
        if (residues[nextPosition].chainId === chainId) {
          selectResidue(keyOfResidue(residues[nextPosition]))
          return
        }
        nextPosition += step
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [analysis.residues, selection, selectResidue])

  const identifier = analysis.meta.pdbId ?? analysis.meta.entryId

  const handleExportPng = () => {
    const viewer = viewerRef.current
    if (!viewer) {
      showToast(t('workspace.export.empty'))
      return
    }
    try {
      const dataUri = viewer.pngURI()
      downloadDataUri(dataUri, `${identifier}-${scheme}.png`)
      showToast(t('workspace.export.pngSuccess'))
    } catch {
      showToast(t('workspace.export.empty'))
    }
  }

  const handleExportCsv = () => {
    downloadText(
      buildResidueCsv(analysis.residues),
      `${identifier}.csv`,
      'text/csv',
    )
    showToast(t('workspace.export.csvSuccess'))
  }

  const handleCopyLink = () => {
    const url = new URL(window.location.href)
    url.pathname = `/entry/${encodeURIComponent(analysis.meta.entryId)}`
    const params = new URLSearchParams()
    params.set('scheme', scheme)
    params.set('repr', representation)
    if (selection) {
      params.set('chain', selection.chainId)
      params.set('res', String(selection.resId))
      if (selection.insCode) {
        params.set('ins', selection.insCode)
      }
    }
    url.search = params.toString()
    void copyText(url.toString())
      .then(() => showToast(t('workspace.export.copySuccess')))
      .catch(() => showToast(t('errors.UNKNOWN')))
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink lg:h-screen lg:overflow-hidden">
      <a
        href="#workspace-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-surface"
      >
        {t('app.skipToContent')}
      </a>
      <div className="shrink-0">
        <WorkspaceHeader
          analysis={analysis}
          chains={index.chains}
          onExportPng={handleExportPng}
          onExportCsv={handleExportCsv}
          onCopyLink={handleCopyLink}
        />
      </div>
      <main
        id="workspace-main"
        className="min-h-0 p-3 lg:flex-1 lg:p-4"
      >
        {analysis.meta.residueCount > 3000 ? (
          <div
            role="status"
            className="mb-3 border-l-[3px] border-warning bg-surface px-4 py-2 text-body-s text-ink"
          >
            {t('workspace.performanceNotice', {
              count: analysis.meta.residueCount,
            })}
          </div>
        ) : null}
        <div
          className={`grid grid-cols-1 gap-4 lg:grid-cols-[62fr_38fr] ${
            analysis.meta.residueCount > 3000
              ? 'lg:h-[calc(100%-3.25rem)]'
              : 'lg:h-full'
          }`}
        >
          <div className="h-[56vh] min-h-[360px] min-w-0 lg:h-full lg:min-h-0">
            <StructureView
              analysis={analysis}
              index={index}
              scheme={scheme}
              representation={representation}
              selection={selection}
              hiddenChains={hiddenChains}
              onSelect={handleSelect}
              onViewerReady={onViewerReady}
              onShowAllChains={() => setHiddenChains([])}
            />
          </div>
          <div className="min-h-[560px] min-w-0 lg:h-full lg:min-h-0">
            <SidePanel
              analysis={analysis}
              index={index}
              selection={selection}
              onSelect={(key) => selectResidue(key)}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
