import { ArrowLeft, ChevronDown, Download, Eye, Palette } from 'lucide-react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { LanguageSwitch } from '@/components/LanguageSwitch'
import { useAppStore } from '@/stores/app-store'
import type {
  EntryAnalysis,
  Representation,
  Scheme,
} from '@/types/api'
import { REPRESENTATIONS, SCHEMES } from '@/types/domain'

const REPRESENTATION_LABELS: Record<Representation, string> = {
  cartoon: 'workspace.representation.cartoon',
  stick: 'workspace.representation.stick',
  sphere: 'workspace.representation.sphere',
}

const SCHEME_LABELS: Record<Scheme, string> = {
  ss: 'workspace.scheme.ss',
  chain: 'workspace.scheme.chain',
  hydrophobicity: 'workspace.scheme.hydrophobicity',
  bfactor: 'workspace.scheme.bfactor',
  element: 'workspace.scheme.element',
}

interface WorkspaceHeaderProps {
  analysis: EntryAnalysis
  chains: string[]
  onExportPng: () => void
  onExportCsv: () => void
  onCopyLink: () => void
}

const SUMMARY_CLASS =
  'inline-flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-sm border border-line bg-surface px-2.5 text-body-s text-ink transition-colors duration-[180ms] ease-instrument hover:bg-paper [&::-webkit-details-marker]:hidden'

export function WorkspaceHeader({
  analysis,
  chains,
  onExportPng,
  onExportCsv,
  onCopyLink,
}: WorkspaceHeaderProps) {
  const { t } = useTranslation()
  const scheme = useAppStore((state) => state.scheme)
  const representation = useAppStore((state) => state.representation)
  const hiddenChains = useAppStore((state) => state.hiddenChains)
  const setScheme = useAppStore((state) => state.setScheme)
  const setRepresentation = useAppStore((state) => state.setRepresentation)
  const setHiddenChains = useAppStore((state) => state.setHiddenChains)
  const toggleChain = useAppStore((state) => state.toggleChain)
  const exportRef = useRef<HTMLDetailsElement>(null)

  const identifier =
    analysis.meta.pdbId ??
    (analysis.meta.entryId.startsWith('upload-')
      ? t('workspace.uploadEntry')
      : analysis.meta.entryId)
  const title = analysis.meta.title || t('workspace.entryFallback')

  const closeExport = () => {
    exportRef.current?.removeAttribute('open')
  }

  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-2 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            aria-label={t('nav.backHome')}
            title={t('nav.backHome')}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-ink hover:bg-surface"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-mono-s uppercase tracking-[0.08em] text-muted">
                {identifier}
              </span>
              <h1
                className="truncate font-display text-[1.0625rem] text-ink"
                title={title}
              >
                {title}
              </h1>
            </div>
          </div>
          <div className="hidden shrink-0 md:block">
            <LanguageSwitch />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label={t('workspace.representation.label')}
            className="inline-flex overflow-hidden rounded-sm border border-line"
          >
            {REPRESENTATIONS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={representation === value}
                onClick={() => setRepresentation(value)}
                className={`h-8 px-2.5 text-body-s transition-colors duration-[180ms] ease-instrument ${
                  representation === value
                    ? 'bg-ink text-surface'
                    : 'bg-surface text-ink hover:bg-paper'
                }`}
              >
                {t(REPRESENTATION_LABELS[value])}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-1.5">
            <span className="sr-only">{t('workspace.scheme.label')}</span>
            <Palette aria-hidden="true" className="size-4 text-muted" />
            <select
              value={scheme}
              onChange={(event) =>
                setScheme(event.target.value as Scheme)
              }
              aria-label={t('workspace.scheme.label')}
              className="h-8 rounded-sm border border-line bg-surface px-1.5 text-body-s text-ink"
            >
              {SCHEMES.map((value) => (
                <option key={value} value={value}>
                  {t(SCHEME_LABELS[value])}
                </option>
              ))}
            </select>
          </label>

          <details className="relative">
            <summary className={SUMMARY_CLASS}>
              <Eye aria-hidden="true" className="size-4" />
              {t('workspace.chains.label')}
              <ChevronDown aria-hidden="true" className="size-3" />
            </summary>
            <div className="absolute left-0 top-full z-40 mt-1 min-w-52 rounded-md border border-line bg-surface p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-mono text-mono-s uppercase tracking-[0.06em] text-muted">
                  {t('workspace.chains.label')}
                </span>
                <button
                  type="button"
                  onClick={() => setHiddenChains([])}
                  className="text-body-s text-accent-ink hover:underline"
                >
                  {t('workspace.chains.all')}
                </button>
              </div>
              <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto thin-scrollbar">
                {chains.map((chainId) => (
                  <li key={chainId}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-xs px-1 py-1 text-body-s hover:bg-paper">
                      <input
                        type="checkbox"
                        checked={!hiddenChains.includes(chainId)}
                        onChange={() => toggleChain(chainId)}
                        className="size-3.5 accent-accent-ink"
                      />
                      <span className="font-mono">
                        {t('common.chain')} {chainId}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </details>

          <details ref={exportRef} className="relative">
            <summary className={SUMMARY_CLASS}>
              <Download aria-hidden="true" className="size-4" />
              {t('workspace.export.label')}
              <ChevronDown aria-hidden="true" className="size-3" />
            </summary>
            <div className="absolute right-0 top-full z-40 mt-1 flex min-w-52 flex-col rounded-md border border-line bg-surface p-1">
              <button
                type="button"
                onClick={() => {
                  closeExport()
                  onExportPng()
                }}
                className="rounded-xs px-3 py-2 text-left text-body-s text-ink hover:bg-paper"
              >
                {t('workspace.export.png')}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeExport()
                  onExportCsv()
                }}
                className="rounded-xs px-3 py-2 text-left text-body-s text-ink hover:bg-paper"
              >
                {t('workspace.export.csv')}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeExport()
                  onCopyLink()
                }}
                className="rounded-xs px-3 py-2 text-left text-body-s text-ink hover:bg-paper"
              >
                {t('workspace.export.copy')}
              </button>
            </div>
          </details>

          <div className="md:hidden">
            <LanguageSwitch />
          </div>
        </div>
      </div>
    </header>
  )
}
