import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { colors, font } from '../theme.js'
import { useT } from '../lib/i18n.jsx'

// The floating glass dock — web twin of burden-native/src/components/Dock.tsx
// and of the HOUSEPVA dock: a see-through pill floating over the page,
// hairline rim, spaced capitals, a glass lens that springs to the current
// section, and labels that turn white while a blue tile or photo scrolls
// underneath (tiles mark themselves with data-dock-dark).

// The same four tabs as the native app. Profile is reached from the account
// buttons on Home and the credit pill in the header.
const ITEMS = [
  { id: 'home',     label: 'Home' },
  { id: 'discover', label: 'Discover' },
  { id: 'history',  label: 'Giving' },
  { id: 'about',    label: 'About' },
]

// Space pages leave at the bottom so their last item can scroll clear.
export const DOCK_SPACE = 96

export default function Dock({ route, navigate, givingCount = 0 }) {
  const t = useT()
  const dockRef = useRef(null)
  const itemRefs = useRef({})
  const [lens, setLens] = useState(null)
  const [dark, setDark] = useState(false)

  const activeId = ITEMS.some(i => i.id === route.name) ? route.name : null

  // Lens follows the current item. Measured after layout so it lands exactly.
  useLayoutEffect(() => {
    const el = activeId && itemRefs.current[activeId]
    if (!el) { setLens(null); return }
    setLens({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeId, givingCount])

  // Is a dark surface under the glass? Checked on scroll and resize.
  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      const dock = dockRef.current
      if (!dock) return
      const band = dock.getBoundingClientRect()
      const surfaces = document.querySelectorAll('[data-dock-dark]')
      let hit = false
      for (const s of surfaces) {
        const r = s.getBoundingClientRect()
        if (r.top < band.bottom && r.bottom > band.top && r.right > band.left && r.left < band.right) { hit = true; break }
      }
      setDark(hit)
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(check) }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const mo = new MutationObserver(schedule)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      mo.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [route.name])

  return (
    <nav
      ref={dockRef}
      aria-label="Go to"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        zIndex: 50,
        display: 'flex',
        gap: 2,
        padding: 5,
        borderRadius: 999,
        maxWidth: 'calc(100vw - 24px)',
        boxSizing: 'border-box',
        // liquid glass: mostly the page showing through, caught by a lit rim
        border: '1px solid rgba(255,255,255,0.45)',
        background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.22)',
        WebkitBackdropFilter: 'blur(22px) saturate(1.75)',
        backdropFilter: 'blur(22px) saturate(1.75)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.42)',
        transition: 'background 200ms ease',
      }}
    >
      {/* the lens: glides to the section you're in */}
      <span aria-hidden style={{
        position: 'absolute', top: 5, bottom: 5, borderRadius: 999,
        left: lens ? lens.left : 0,
        width: lens ? lens.width : 0,
        opacity: lens ? 1 : 0,
        background: dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.07)',
        border: '1px solid rgba(255,255,255,0.5)',
        boxSizing: 'border-box',
        transition: 'left 420ms cubic-bezier(0.2,0.9,0.3,1.15), width 420ms cubic-bezier(0.2,0.9,0.3,1.15), opacity 200ms ease, background 200ms ease',
        pointerEvents: 'none',
      }} />
      {ITEMS.map(it => {
        const active = it.id === activeId
        const onDark = dark && !active
        return (
          <button
            key={it.id}
            ref={el => { itemRefs.current[it.id] = el }}
            onClick={() => navigate({ name: it.id })}
            aria-current={active ? 'page' : undefined}
            style={{
              position: 'relative',
              background: 'transparent',
              border: 'none',
              borderRadius: 999,
              padding: '11px 13px',
              flex: '1 1 auto',
              minWidth: 0,
              fontFamily: font.sans,
              fontSize: 10.5,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              fontWeight: active ? 600 : 400,
              color: onDark ? '#fff' : active ? colors.ink : colors.inkSoft,
              textShadow: onDark ? '0 0 4px rgba(0,0,0,0.45)' : '0 0 3px rgba(255,255,255,0.7)',
              cursor: 'pointer',
              transition: 'color 200ms ease, transform 160ms ease',
            }}
          >
            {t('nav.' + (it.id === 'history' ? 'giving' : it.id))}
            {it.id === 'history' && givingCount > 0 && (
              <span style={{ marginLeft: 6, fontSize: 9, color: onDark ? 'rgba(255,255,255,0.8)' : colors.inkMuted }}>
                {givingCount}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
