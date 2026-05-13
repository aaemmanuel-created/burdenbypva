import { useEffect, useState } from 'react'
import { colors } from '../theme.js'

// Splash — the moment the app opens. Reverent thank-you, Helvetica
// (everything else in the app is JetBrains Mono — this is the one place
// the typography breaks for intentional warmth). Subtle haptic on mount
// where the platform allows it (Android Chrome; iOS Safari silently
// no-ops, which is fine — we don't fail).
//
// Dismisses on tap, on key press, or automatically after 3.5 seconds.
//
// Visually inspired by Rewind's open-screen — full-bleed, centred, almost
// nothing on it. A breath before the rest of the app.

const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export default function Splash({ onDismiss }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Gentle pulse — like a doorbell, not an alarm.
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([12, 80, 18]) } catch { /* no-op */ }
    }
    // Auto-dismiss
    const t = setTimeout(() => dismiss(), 3500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    if (leaving) return
    setLeaving(true)
    setTimeout(onDismiss, 320) // match the fade duration below
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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        cursor: 'pointer',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 320ms ease-out',
        padding: '32px',
      }}
    >
      <div style={{
        fontFamily: HELVETICA,
        fontWeight: 300,
        fontSize: 'clamp(28px, 7vw, 64px)',
        lineHeight: 1.15,
        letterSpacing: -0.5,
        color: colors.ink,
        textAlign: 'center',
        maxWidth: 920,
      }}>
        Thank you for supporting a&nbsp;burden today.
      </div>

      <div style={{
        position: 'absolute',
        bottom: 32,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: HELVETICA,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: colors.inkMuted,
      }}>
        Tap to continue
      </div>
    </div>
  )
}
