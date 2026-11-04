import '@fontsource-variable/fraunces'
import '@fontsource-variable/instrument-sans'
import '@fontsource/ibm-plex-mono/400.css'
import '@/styles/tokens.css'
import '@/styles/globals.css'
import '@/i18n'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/App'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element was not found.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
