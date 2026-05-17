import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.jsx'

const dsn = import.meta.env.VITE_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 0.0,
  })
}

// ?sentryTest=1 — fires a known captureException 5s after load so we can
// confirm DSN + transport without relying on a real error.
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('sentryTest') === '1') {
  setTimeout(() => {
    Sentry.captureException(new Error('Sentry test event from ?sentryTest=1 — wiring check, ignore.'))
  }, 5000)
}

const Fallback = () => (
  <div style={{ padding: '2rem', fontFamily: 'JetBrains Mono, monospace' }}>
    <h1>Something went wrong.</h1>
    <p>The page hit an unexpected error. Reload to try again.</p>
  </div>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<Fallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
