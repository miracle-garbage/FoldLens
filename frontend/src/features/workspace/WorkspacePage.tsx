import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LanguageSwitch } from '@/components/LanguageSwitch'
import { LoadingState, Skeleton } from '@/components/LoadingState'
import type { ApiError } from '@/lib/api'
import { useEntry } from '@/lib/use-entry'
import { WorkspaceContent } from './WorkspaceContent'

function errorTitleKey(error: ApiError): string {
  switch (error.code) {
    case 'INVALID_ENTRY_ID':
      return 'workspace.error.invalid'
    case 'ENTRY_NOT_FOUND':
      return 'workspace.error.notFound'
    case 'UPSTREAM_TIMEOUT':
      return 'workspace.error.timeout'
    case 'UPSTREAM_UNAVAILABLE':
      return 'workspace.error.upstream'
    default:
      return 'workspace.error.generic'
  }
}

function MinimalHeader({ label }: { label: string }) {
  const { t } = useTranslation()
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            aria-label={t('nav.backHome')}
            title={t('nav.backHome')}
            className="inline-flex size-8 items-center justify-center rounded-sm text-ink hover:bg-surface"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Link>
          <span className="truncate font-mono text-mono-s uppercase tracking-[0.08em] text-ink">
            {label}
          </span>
        </div>
        <LanguageSwitch />
      </div>
    </header>
  )
}

function SkipLink() {
  const { t } = useTranslation()
  return (
    <a
      href="#workspace-main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-surface"
    >
      {t('app.skipToContent')}
    </a>
  )
}

function WorkspaceLoader({ entryId }: { entryId: string }) {
  const { t } = useTranslation()
  const { state, retry } = useEntry(entryId)

  useEffect(() => {
    if (state.status === 'success') {
      const identifier =
        state.data.meta.pdbId ??
        (state.data.meta.entryId.startsWith('upload-')
          ? t('workspace.uploadEntry')
          : state.data.meta.entryId)
      const label = state.data.meta.title || t('workspace.entryFallback')
      document.title = `${identifier} · ${label} — FoldLens`
      return
    }
    if (state.status === 'error') {
      document.title = `${t('workspace.error.title')} — FoldLens`
      return
    }
    document.title = t('app.title')
  }, [state, t])

  if (state.status === 'success') {
    return <WorkspaceContent analysis={state.data} />
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SkipLink />
      <MinimalHeader label={entryId} />
      <main id="workspace-main">
        {state.status === 'loading' || state.status === 'idle' ? (
          <div className="mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[62fr_38fr]">
            <div className="flex h-[56vh] items-center justify-center rounded-lg border border-line bg-viewport lg:h-[calc(100vh-88px)]">
              <LoadingState label={t('workspace.structure.loading')} dark />
            </div>
            <div className="flex min-h-[420px] flex-col gap-6 rounded-lg border border-line bg-surface p-5">
              <Skeleton lines={4} />
              <LoadingState label={t('workspace.loading')} compact />
            </div>
          </div>
        ) : null}

        {state.status === 'error' ? (
          <div className="mx-auto max-w-[720px] px-6 py-16">
            <h1 className="mb-2 font-display text-display-m text-ink">
              {t(errorTitleKey(state.error))}
            </h1>
            <p className="mb-6 text-body-s text-muted">
              {t('workspace.error.hint')}
            </p>
            <ErrorState
              error={state.error}
              title={t('workspace.error.title')}
              onRetry={retry}
            />
            <Link
              to="/"
              className="mt-6 inline-flex h-10 items-center rounded-sm border border-line px-4 text-body-s text-ink hover:bg-surface"
            >
              {t('workspace.error.back')}
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  )
}

function InvalidEntryPage() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = `${t('workspace.error.invalid')} — FoldLens`
  }, [t])

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SkipLink />
      <MinimalHeader label="—" />
      <main id="workspace-main">
        <div className="mx-auto max-w-[720px] px-6 py-16">
          <EmptyState
            title={t('workspace.error.invalid')}
            hint={t('workspace.error.hint')}
          />
          <Link
            to="/"
            className="mt-6 inline-flex h-10 items-center rounded-sm border border-line px-4 text-body-s text-ink hover:bg-surface"
          >
            {t('workspace.error.back')}
          </Link>
        </div>
      </main>
    </div>
  )
}

export function WorkspacePage() {
  const { entryId } = useParams<{ entryId: string }>()
  const normalizedId = entryId?.trim() || null

  if (!normalizedId) {
    return <InvalidEntryPage />
  }

  // Remounting per entry lets the hooks seed their state from the in-session
  // cache without ever setting state synchronously inside an effect.
  return <WorkspaceLoader key={normalizedId} entryId={normalizedId} />
}
