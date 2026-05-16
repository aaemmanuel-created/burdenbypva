import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'pva-6m',
      project: 'burdenbypva',
      url: 'https://de.sentry.io/',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: { assets: './dist/**' },
      telemetry: false,
    }),
  ],
  base: '/burdenbypva/',
  build: {
    sourcemap: true,
  },
  server: {
    port: 5174,
  },
})
