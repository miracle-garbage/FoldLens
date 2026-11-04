import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { LanguageSwitch } from '@/components/LanguageSwitch'

export function NotFoundPage() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = `${t('notFound.title')} — FoldLens`
  }, [t])

  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-12">
        <Link
          to="/"
          className="font-display text-display-m font-semibold text-ink"
        >
          {t('app.name')}
        </Link>
        <LanguageSwitch />
      </header>
      <main className="mx-auto flex max-w-[720px] flex-col gap-4 px-6 py-24">
        <p className="font-mono text-mono-s uppercase tracking-[0.08em] text-muted">
          404
        </p>
        <h1 className="font-display text-display-l text-ink">
          {t('notFound.title')}
        </h1>
        <p className="text-body-l text-muted">{t('notFound.body')}</p>
        <Link
          to="/"
          className="mt-2 inline-flex h-10 w-fit items-center rounded-sm bg-accent-ink px-4 text-body-s font-medium text-surface hover:bg-ink"
        >
          {t('notFound.back')}
        </Link>
      </main>
    </div>
  )
}
