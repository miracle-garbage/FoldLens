import { useEffect } from 'react'

import { useAppStore } from '@/stores/app-store'

export function Toast() {
  const toast = useAppStore((state) => state.toast)
  const clearToast = useAppStore((state) => state.clearToast)

  useEffect(() => {
    if (!toast) {
      return
    }
    const timeout = window.setTimeout(clearToast, 3000)
    return () => window.clearTimeout(timeout)
  }, [toast, clearToast])

  if (!toast) {
    return null
  }

  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-xs animate-panel-in rounded-sm bg-ink px-4 py-3 text-body-s text-surface shadow-none"
    >
      {toast.message}
    </div>
  )
}
