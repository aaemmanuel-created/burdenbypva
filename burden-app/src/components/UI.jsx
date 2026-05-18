import { useState } from 'react'
import { colors, tile, radius } from '../theme.js'

export function Label({ children, style, onNavy }) {
  return (
    <div style={{
      fontSize: 10,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: onNavy ? tile.muted : colors.inkMuted,
      fontWeight: 500,
      ...style,
    }}>{children}</div>
  )
}

export function Rule({ soft = false, style }) {
  return (
    <div style={{
      height: 1,
      background: soft ? colors.ruleSoft : colors.rule,
      width: '100%',
      ...style,
    }} />
  )
}

export function Button({ children, onClick, variant = 'primary', disabled, style, type = 'button', full }) {
  const base = {
    border: '1px solid ' + colors.rule,
    padding: '14px 22px',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: 500,
    transition: 'background 120ms ease, color 120ms ease',
    width: full ? '100%' : 'auto',
    opacity: disabled ? 0.4 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    background: variant === 'primary' ? colors.ink : 'transparent',
    color: variant === 'primary' ? colors.accentInk : colors.ink,
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...style,
  }
  return (
    <button type={type} onClick={onClick} style={base}>{children}</button>
  )
}

export function Progress({ value, goal, onNavy }) {
  const pct = Math.min(100, Math.round((value / goal) * 100))
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        height: 3,
        background: onNavy ? 'rgba(255,255,255,0.10)' : colors.ruleSoft,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
      }}>
        <div style={{
          height: '100%',
          width: pct + '%',
          background: onNavy
            ? 'linear-gradient(90deg, #9fb4dc 0%, #ffffff 100%)'
            : colors.ink,
          transition: 'width 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        }} />
      </div>
    </div>
  )
}

export function Badge({ children, tone = 'default', onNavy }) {
  const palette = onNavy ? {
    default: { bg: 'rgba(255,255,255,0.06)', fg: tile.ink,            border: 'rgba(255,255,255,0.20)' },
    trust:   { bg: 'rgba(126,196,138,0.10)', fg: colors.trustOnNavy,  border: 'rgba(126,196,138,0.55)' },
    warn:    { bg: 'rgba(224,168,107,0.10)', fg: colors.warnOnNavy,   border: 'rgba(224,168,107,0.55)' },
  }[tone] : {
    default: { bg: 'transparent', fg: colors.ink,    border: colors.rule },
    trust:   { bg: 'transparent', fg: colors.trust,  border: colors.trust },
    warn:    { bg: 'transparent', fg: colors.warn,   border: colors.warn },
  }[tone]
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 9,
      letterSpacing: 2,
      textTransform: 'uppercase',
      padding: '4px 8px',
      border: '1px solid ' + palette.border,
      color: palette.fg,
      background: palette.bg,
      fontWeight: 500,
      borderRadius: 2,
    }}>{children}</span>
  )
}

export function formatMoney(n, currency = 'USD') {
  const s = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
  return s
}

// ─── Tile — glassy navy 3D card used across the app ──────────────────────────
//
// Use this in place of a plain styled button/div whenever you want the
// "pop-out" effect (Home grids, Discover results, Profile cards, etc.).
// Pass `as="button"` for clickable tiles, `as="div"` for static ones.

export function Tile({
  children,
  onClick,
  as = 'button',
  style,
  padding = 24,
  minHeight,
  flat = false,           // disables the hover lift
  ariaLabel,
}) {
  const [hover, setHover] = useState(false)
  const Component = as
  const base = {
    position: 'relative',
    background: tile.background,
    border: tile.border,
    boxShadow: hover && !flat ? tile.shadowHover : tile.shadow,
    color: tile.ink,
    padding,
    minHeight,
    borderRadius: radius.tile,
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    cursor: onClick ? 'pointer' : 'default',
    transform: hover && !flat ? 'translateY(-2px)' : 'translateY(0)',
    transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease',
    overflow: 'hidden',
    ...style,
  }
  const interactive = onClick
    ? { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false), onFocus: () => setHover(true), onBlur: () => setHover(false), onClick }
    : {}
  return (
    <Component
      type={as === 'button' ? 'button' : undefined}
      aria-label={ariaLabel}
      style={base}
      {...interactive}
    >
      {/* subtle inner light streak across the top edge */}
      <span aria-hidden style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 1,
        background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)',
        pointerEvents: 'none',
      }} />
      {children}
    </Component>
  )
}

// ─── FundingBanner — ribbon across the top of a tile ──────────────────────────
//
// Three tiers, plain-spoken language. No urgency exploitation — just a
// transparent read of where the burden stands.
//
//   < 33%   "Just getting started"   (low)
//   33–66%  "Halfway home"            (mid)
//   > 66%   "Almost funded"           (high)
//   ≥ 100%  "Fully funded — thank you" (complete)

export function fundingTier(raised, goal) {
  const pct = goal > 0 ? (raised / goal) * 100 : 0
  if (pct >= 100) return { key: 'complete', label: 'Fully funded — thank you', color: colors.fundHigh }
  if (pct >= 67)  return { key: 'high',     label: 'Almost funded',            color: colors.fundHigh }
  if (pct >= 33)  return { key: 'mid',      label: 'Halfway home',             color: colors.fundMid }
  return            { key: 'low',      label: 'Just getting started',     color: colors.fundLow }
}

export function FundingBanner({ raised, goal, style }) {
  const tier = fundingTier(raised, goal)
  return (
    <div style={{
      alignSelf: 'flex-start',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px 6px 10px',
      background: `linear-gradient(180deg, ${tier.color} 0%, ${shade(tier.color, -0.18)} 100%)`,
      color: '#fff',
      fontSize: 9,
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontWeight: 600,
      boxShadow: '0 4px 10px -4px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.18) inset',
      borderRadius: 999,
      ...style,
    }}>
      <span aria-hidden style={{
        width: 6, height: 6, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 0 6px rgba(255,255,255,0.85)',
      }} />
      {tier.label}
    </div>
  )
}

// tiny helper to darken a hex by amount (-1..1) for the banner gradient bottom stop
function shade(hex, amt) {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m) return hex
  const [r, g, b] = m.map(x => parseInt(x, 16))
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + 255 * amt)))
  return '#' + [f(r), f(g), f(b)].map(c => c.toString(16).padStart(2, '0')).join('')
}
