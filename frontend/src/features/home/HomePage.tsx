import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { LanguageSwitch } from '@/components/LanguageSwitch'
import { SampleGallery } from './SampleGallery'
import { SearchForm } from './SearchForm'
import { StructureMotif } from './StructureMotif'
import { UploadStructure } from './UploadStructure'

export function HomePage() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = t('app.title')
  }, [t])

  return (
    <div className="min-h-screen bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-surface"
      >
        {t('app.skipToContent')}
      </a>

      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-12">
          <Link to="/" className="flex items-baseline gap-3">
            <span className="font-display text-[1.375rem] font-semibold tracking-[-0.01em]">
              {t('app.name')}
            </span>
            <span className="hidden text-body-s text-muted sm:inline">
              {t('app.subtitle')}
            </span>
          </Link>
          <LanguageSwitch />
        </div>
      </header>

      <main id="main">
        <section className="mx-auto max-w-[1440px] px-6 pb-16 pt-14 lg:px-12 lg:pb-24 lg:pt-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="animate-panel-in lg:col-span-7">
              <h1 className="whitespace-pre-line font-display text-display-l font-semibold text-ink sm:text-display-xl">
                {t('home.title')}
              </h1>
              <p className="mt-6 max-w-[54ch] text-body-l text-ink">
                {t('home.lede')}
              </p>
              <div className="mt-10">
                <SearchForm />
                <UploadStructure />
              </div>
            </div>
            <div className="animate-panel-in lg:col-span-5">
              <StructureMotif />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="border-t border-line pt-12">
            <SampleGallery />
          </div>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] animate-panel-in flex-col gap-2 px-6 py-8 text-body-s text-muted sm:flex-row sm:items-center sm:justify-between lg:px-12">
          <p>{t('home.footer.source')}</p>
          <p>{t('home.footer.course')}</p>
        </div>
      </footer>
    </div>
  )
}
