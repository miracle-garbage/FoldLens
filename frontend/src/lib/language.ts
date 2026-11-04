import type { Language } from '@/types/domain'

export const LANGUAGE_STORAGE_KEY = 'foldlens.lang'

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'zh'
  }
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'zh'
}

export function storeLanguage(language: Language): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
}
