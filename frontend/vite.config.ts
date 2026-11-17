import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // Mol* 5.x's ESM build breaks under Vite's dependency pre-bundling:
      // namespace re-exports used by BuiltInPluginBehaviors are evaluated
      // before their defining module. The published CommonJS build keeps the
      // require order intact. Revisit when Mol* ships a bundler-safe ESM fix.
      {
        find: /^molstar\/lib\/(?!commonjs\/)/,
        replacement: 'molstar/lib/commonjs/',
      },
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
})
