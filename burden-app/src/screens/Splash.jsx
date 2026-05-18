import { useEffect, useState } from 'react'
import { colors } from '../theme.js'

// Splash — the moment the app opens. Reverent welcome in Helvetica
// (everything else in the app is JetBrains Mono — this is the one place
// the typography breaks for intentional warmth).
//
// Layout: text is anchored centre-left of the page — vertically centred,
// horizontally pinned to the left of a centred content column — and reads
// as a short sentence-style paragraph rather than a single headline.
//
// Dismisses on tap, on key press, or automatically after 4 seconds.

const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export default function Splash({ onDismiss }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Gentle pulse — like a doorbell, not an alarm.
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([12, 80, 18]) } catch { /* no-op */ }
    }
    const t = setTimeout(() => dismiss(), 4000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    if (leaving) return
    setLeaving(true)
    setTimeout(onDismiss, 320)
  }

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
        opacity: leaving ? 0 : 1,
        transition: 'opacity 320ms ease-out',
        fontFamily: HELVETICA,
      }}
    >
      {/* BURDEN by PVA — top-left wordmark, Helvetica, not bold */}
      <div style={{
        position: 'absolute',
        top: 28,
        left: 32,
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        fontFamily: HELVETICA,
        fontWeight: 400,
      }}>
        <span style={{
          fontSize: 14,
          letterSpacing: 4,
          color: colors.ink,
        }}>BURDEN</span>
        <span style={{
          fontSize: 9,
          letterSpacing: 2,
          color: colors.inkMuted,
        }}>by PVA</span>
      </div>

      {/* Centre-left text column — anchored to the left of a centred max-width wrapper */}
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
          lineHeight: 1.35,
          letterSpacing: -0.2,
          color: colors.ink,
          textAlign: 'left',
          maxWidth: 640,
          margin: 0,
        }}>
          Thank you for supporting a burden today.
        </p>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 28,
        left: 32,
        right: 32,
        fontFamily: HELVETICA,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: colors.inkMuted,
        textAlign: 'left',
      }}>
        Tap to continue
      </div>
    </div>
  )
}
