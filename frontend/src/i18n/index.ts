import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { getStoredLanguage } from '@/lib/language'
import { en } from './en'
import { zh } from './zh'

void i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: getStoredLanguage(),
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
})

export default i18n
