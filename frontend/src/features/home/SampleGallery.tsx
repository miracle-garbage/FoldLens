import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/LoadingState'
import { useSamples } from '@/lib/use-entry'
import { SampleCard } from './SampleCard'

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="overflow-hidden rounded-md border border-line bg-surface"
        >
          <div className="aspect-[16/10] animate-breathe bg-viewport-grid" />
          <div className="flex flex-col gap-3 p-5">
            <Skeleton lines={3} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SampleGallery() {
  const { t } = useTranslation()
  const { state, retry } = useSamples()

  return (
    <section
      aria-labelledby="samples-title"
      className="animate-panel-in pb-16"
    >
      <div className="mb-8 flex flex-col gap-2">
        <h2
          id="samples-title"
          className="font-display text-display-m text-ink"
        >
          {t('home.samples.title')}
        </h2>
        <p className="max-w-[60ch] text-body-s text-muted">
          {t('home.samples.lede')}
        </p>
      </div>

      {state.status === 'loading' || state.status === 'idle' ? (
        <div>
          <p className="sr-only" role="status">
            {t('home.samples.loading')}
          </p>
          <GallerySkeleton />
        </div>
      ) : null}

      {state.status === 'error' ? (
        <ErrorState
          error={state.error}
          title={t('home.samples.error')}
          onRetry={retry}
        />
      ) : null}

      {state.status === 'success' && state.data.length === 0 ? (
        <EmptyState title={t('home.samples.empty')} />
      ) : null}

      {state.status === 'success' && state.data.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {state.data.map((sample) => (
            <SampleCard key={sample.pdbId} sample={sample} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
