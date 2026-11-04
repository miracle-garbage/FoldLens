import { create } from 'zustand'

import { getStoredLanguage, storeLanguage } from '@/lib/language'
import type { Representation, ResidueKey, Scheme } from '@/types/api'
import type { Language } from '@/types/domain'

export interface ToastMessage {
  id: number
  message: string
}

interface AppState {
  selection: ResidueKey | null
  scheme: Scheme
  representation: Representation
  hiddenChains: string[]
  language: Language
  toast: ToastMessage | null

  selectResidue: (key: ResidueKey | null) => void
  setScheme: (scheme: Scheme) => void
  setRepresentation: (representation: Representation) => void
  setHiddenChains: (chains: string[]) => void
  toggleChain: (chainId: string) => void
  setLanguage: (language: Language) => void
  showToast: (message: string) => void
  clearToast: () => void
  resetViewState: () => void
}

let toastCounter = 0

export const useAppStore = create<AppState>((set) => ({
  selection: null,
  scheme: 'ss',
  representation: 'cartoon',
  hiddenChains: [],
  language: getStoredLanguage(),
  toast: null,

  selectResidue: (key) => set({ selection: key }),
  setScheme: (scheme) => set({ scheme }),
  setRepresentation: (representation) => set({ representation }),
  setHiddenChains: (chains) => set({ hiddenChains: chains }),
  toggleChain: (chainId) =>
    set((state) => ({
      hiddenChains: state.hiddenChains.includes(chainId)
        ? state.hiddenChains.filter((chain) => chain !== chainId)
        : [...state.hiddenChains, chainId],
    })),
  setLanguage: (language) => {
    storeLanguage(language)
    set({ language })
  },
  showToast: (message) =>
    set({ toast: { id: ++toastCounter, message } }),
  clearToast: () => set({ toast: null }),
  resetViewState: () =>
    set({
      selection: null,
      scheme: 'ss',
      representation: 'cartoon',
      hiddenChains: [],
    }),
}))
