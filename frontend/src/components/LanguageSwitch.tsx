import { useTranslation } from 'react-i18next'

import { useAppStore } from '@/stores/app-store'
import type { Language } from '@/types/domain'

const LANGUAGES: { value: Language; labelKey: 'lang.zh' | 'lang.en' }[] = [
  { value: 'zh', labelKey: 'lang.zh' },
  { value: 'en', labelKey: 'lang.en' },
]

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const language = useAppStore((state) => state.language)
  const setLanguage = useAppStore((state) => state.setLanguage)

  const handleSelect = (next: Language) => {
    if (next === language) {
      return
    }
    setLanguage(next)
    void i18n.changeLanguage(next)
  }

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label={t('lang.switch')}
    >
      {LANGUAGES.map((entry, index) => (
        <span key={entry.value} className="flex items-center gap-1">
          {index > 0 ? (
            <span aria-hidden="true" className="text-mono-s text-line">
              /
            </span>
          ) : null}
          <button
            type="button"
            aria-pressed={language === entry.value}
            onClick={() => handleSelect(entry.value)}
            className={`rounded-xs px-1 py-0.5 text-body-s transition-colors duration-[180ms] ease-instrument ${
              language === entry.value
                ? 'text-ink underline decoration-accent decoration-2 underline-offset-4'
                : 'text-muted hover:text-ink'
            }`}
          >
            {t(entry.labelKey)}
          </button>
        </span>
      ))}
    </div>
  )
}
