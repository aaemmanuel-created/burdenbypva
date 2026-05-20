import { useEffect, useRef, useState } from 'react'
import { vibrate } from '../data/burdens.js'

// Splash screen — Helvetica thank-you that fades in from blur, with a
// rewind-style intensifying haptic. Tap or press to dismiss.

function runIntroHaptics() {
  // Pulses get longer, gaps shrink, big finale.
  vibrate([
    18, 360,
    24, 310,
    32, 260,
    44, 215,
    60, 175,
    82, 140,
    110, 110,
    150, 85,
    200, 60,
    280,
  ])
}

export default function Splash({ onDismiss }) {
  const [shown, setShown] = useState(false)
  const dismissedRef = useRef(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      setTimeout(() => {
        setShown(true)
        runIntroHaptics()
      }, 250)
    })
    return () => cancelAnimationFrame(t)
  }, [])

  function handleDismiss() {
    if (!shown || dismissedRef.current) return
    dismissedRef.current = true
    vibrate(22)
    onDismiss()
  }

  return (
    <section
      className="screen intro"
      onClick={handleDismiss}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleDismiss()
      }}
      role="button"
      tabIndex={0}
    >
      <h1 className={'intro-text' + (shown ? ' in' : '')}>
        Thank you for supporting a burden today.
      </h1>
      <span className="intro-hint">Tap to continue</span>
    </section>
  )
}
