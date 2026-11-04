import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { thumbnailUrl } from '@/lib/api'
import { DASH, formatResolution } from '@/lib/format'
import { useLocale } from '@/lib/use-locale'
import type { SampleSummary } from '@/types/api'

interface SampleCardProps {
  sample: SampleSummary
}

export function SampleCard({ sample }: SampleCardProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const description = t(`home.samples.descriptions.${sample.pdbId}`, {
    defaultValue: sample.description,
  })

  return (
    <Link
      to={`/entry/${sample.pdbId}?scheme=ss`}
      aria-label={t('home.samples.open', { id: sample.pdbId })}
      className="group flex animate-panel-in flex-col overflow-hidden rounded-md border border-line bg-surface transition-colors duration-[180ms] ease-instrument hover:border-ink"
    >
      <div className="aspect-[16/10] overflow-hidden border-b border-line bg-surface p-4">
        <img
          src={thumbnailUrl(sample.pdbId)}
          alt=""
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-[240ms] ease-instrument motion-safe:group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="font-mono text-mono-s uppercase tracking-[0.08em] text-muted">
          {sample.pdbId}
        </p>
        <h3 className="font-display text-[1.25rem] leading-tight text-ink">
          {sample.name}
        </h3>
        <p className="text-body-s text-muted">{description}</p>
        <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 font-mono text-mono-s text-ink">
          <div className="flex gap-1">
            <dt className="text-muted">{t('common.chains')}</dt>
            <dd className="tabular">{sample.chainCount}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-muted">{t('common.residues')}</dt>
            <dd className="tabular">{sample.residueCount}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-muted">{t('workspace.archive.resolution')}</dt>
            <dd className="tabular">
              {sample.resolution === null
                ? DASH
                : formatResolution(sample.resolution, locale)}
            </dd>
          </div>
        </dl>
      </div>
    </Link>
  )
}
