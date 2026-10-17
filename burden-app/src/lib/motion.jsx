// Ambient motion — overhaul §5. Two elements only: hero parallax and
// card fade-in. Vanilla IntersectionObserver + requestAnimationFrame —
// no animation libraries. Both respect prefers-reduced-motion.
// Banned: springs, bounce, scale > 1.02, rotation.

import { useEffect, useRef, useState, Children } from 'react'

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// ─── (a) Hero parallax ────────────────────────────────────────────────────────
// The wrapped element translates upward at 0.85× scroll speed (15% slower
// than the page), capped at 80px. Single rAF loop, active only while the
// element is on screen.

export function useParallax() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return

    let visible = false
    let ticking = false
    let baseY = null

    const update = () => {
      ticking = false
      if (!visible || baseY === null) return
      const scrolled = window.scrollY - baseY
      if (scrolled <= 0) { el.style.transform = 'translateY(0)'; return }
      // Page moved `scrolled`; card moves 0.85× that → drifts up 0.15×.
      const drift = Math.min(scrolled * 0.15, 80)
      el.style.transform = `translateY(${-drift}px)`
    }

    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update) }
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && baseY === null) baseY = window.scrollY
      onScroll()
    })

    io.observe(el)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [])

  return ref
}

// ─── (b) Card fade-in on view ─────────────────────────────────────────────────
// Opacity 0 → 1 over 400ms, ease-out cubic-bezier(0.25, 0.1, 0.25, 1),
// staggered 60ms per card. Cards in the initial viewport animate on mount.

export function FadeIn({ children, index = 0, style }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(() => reducedMotion())

  useEffect(() => {
    if (shown) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect() }
    }, { threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [shown])

  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transition: `opacity 400ms cubic-bezier(0.25, 0.1, 0.25, 1) ${index * 60}ms`,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Convenience wrapper for grids: staggers each child by its position.
export function FadeInGrid({ children, style }) {
  return (
    <>
      {Children.map(children, (child, i) => (
        <FadeIn index={i} style={style}>{child}</FadeIn>
      ))}
    </>
  )
}
