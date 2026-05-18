import { useEffect, useState } from 'react'
import { colors } from '../theme.js'

// Splash — page 1. Fades in on mount, fades out on dismiss. The text
// reads as a single short sentence, left-aligned within the centred
// page column.

const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif'

// Phases drive the opacity transition:
//   entering → 0 (briefly, so we can transition to 1)
//   visible  → 1
//   leaving  → 0 (fading out before unmount)
const FADE_MS = 700

export default function Splash({ onDismiss }) {
  const [phase, setPhase] = useState('entering')

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([10, 80, 14]) } catch { /* no-op */ }
    }
    // Next frame, flip to visible so the opacity transition runs.
    const raf = requestAnimationFrame(() => setPhase('visible'))
    // Auto-dismiss after a moment of stillness.
    const t = setTimeout(() => dismiss(), 4200)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    setPhase((p) => (p === 'leaving' ? p : 'leaving'))
    setTimeout(onDismiss, FADE_MS)
  }

  const opacity = phase === 'visible' ? 1 : 0

  return (
    <div
      onClick={dismiss}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') dismiss() }}
      role="button"
      tabIndex={0}
      style={{
        position: 'fixed',
        inset: 0,
        background: colors.bg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        zIndex: 100,
        cursor: 'pointer',
        opacity,
        transition: `opacity ${FADE_MS}ms ease`,
        fontFamily: HELVETICA,
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 1080,
        margin: '0 auto',
        padding: '0 32px',
      }}>
        <p style={{
          fontFamily: HELVETICA,
          fontWeight: 300,
          fontSize: 'clamp(16px, 2.2vw, 26px)',
          lineHeight: 1.45,
          letterSpacing: -0.2,
          color: colors.ink,
          textAlign: 'left',
          maxWidth: 640,
          margin: 0,
        }}>
          Thank you for supporting a burden today.
        </p>
      </div>
    </div>
  )
}
