import { useTranslation } from 'react-i18next'

import { Button } from '@/components/Button'
import type { ApiError } from '@/lib/api'

interface ErrorStateProps {
  error: ApiError
  onRetry?: () => void
  title?: string
  compact?: boolean
}

export function ErrorState({
  error,
  onRetry,
  title,
  compact = false,
}: ErrorStateProps) {
  const { t } = useTranslation()
  const knownMessage = t(`errors.${error.code}`, {
    defaultValue: t('errors.UNKNOWN'),
  })

  return (
    <div
      role="alert"
      className={`border-l-[3px] border-danger bg-surface ${
        compact ? 'px-4 py-3' : 'px-5 py-4'
      }`}
    >
      <p className="text-body-s font-medium text-danger">
        {title ?? t('errors.UNKNOWN')}
      </p>
      <p className="mt-1 text-body-s text-ink">{knownMessage}</p>
      <p className="mt-1 font-mono text-mono-s text-muted">{error.code}</p>
      {onRetry ? (
        <Button className="mt-3" onClick={onRetry}>
          {t('actions.retry')}
        </Button>
      ) : null}
    </div>
  )
}
