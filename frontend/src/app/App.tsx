import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'

import { Toast } from '@/components/Toast'
import { useAppStore } from '@/stores/app-store'
import { AppRoutes } from './router'

export function App() {
  const language = useAppStore((state) => state.language)
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language)
    }
  }, [i18n, language])

  return (
    <BrowserRouter>
      <AppRoutes />
      <Toast />
    </BrowserRouter>
  )
}
