import { useEffect, useState } from 'react'
import { colors, tile, radius, font, type } from '../theme.js'
import grain from '../assets/grain.png'

// Shared UI primitives — the web twins of burden-native/src/components/UI.tsx.

// Small uppercase label — text-xs (12px), +6% tracking, weight 500.
export function Label({ children, style, onNavy }) {
  return (
    <div style={{
      fontFamily: font.sans,
      fontSize: type.xs.fontSize,
      lineHeight: type.xs.lineHeight,
      letterSpacing: '6%',
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

// 'onNavy' is the white rounded rectangle used inside a tile ("View burden").
export function Button({ children, onClick, variant = 'primary', disabled, style, type: htmlType = 'button', full }) {
  const onNavy = variant === 'onNavy'
  const base = {
    fontFamily: font.sans,
    border: onNavy ? 'none' : '1px solid ' + colors.rule,
    padding: '16px 24px',
    fontSize: type.xs.fontSize,
    lineHeight: type.xs.lineHeight,
    letterSpacing: '6%',
    textTransform: 'uppercase',
    fontWeight: onNavy ? 600 : 500,
    transition: 'background 120ms ease, color 120ms ease, transform 120ms ease',
    width: full ? '100%' : 'auto',
    opacity: disabled ? 0.4 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    background: onNavy ? '#fff' : variant === 'primary' ? colors.ink : 'transparent',
    color: onNavy ? colors.navyDeep : variant === 'primary' ? colors.accentInk : colors.ink,
    borderRadius: onNavy ? 10 : 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...style,
  }
  return (
    <button type={htmlType} onClick={onClick} style={base}>{children}</button>
  )
}

export function Progress({ value, goal, onNavy }) {
  const pct = Math.min(100, Math.round((value / goal) * 100))
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        height: 3,
        background: onNavy ? 'rgba(255,255,255,0.18)' : colors.ruleSoft,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
      }}>
        <div style={{
          height: '100%',
          width: pct + '%',
          background: onNavy ? '#fff' : colors.ink,
          transition: 'width 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        }} />
      </div>
    </div>
  )
}

// Bordered label. On a tile every badge is a white outline, as in the app.
export function Badge({ children, tone = 'default', onNavy }) {
  const palette = onNavy
    ? { bg: 'transparent', fg: tile.ink, border: 'rgba(255,255,255,0.55)' }
    : {
      default: { bg: 'transparent', fg: colors.ink,    border: colors.rule },
      trust:   { bg: 'transparent', fg: colors.trust,  border: colors.trust },
      warn:    { bg: 'transparent', fg: colors.warn,   border: colors.warn },
    }[tone]
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: font.sans,
      fontSize: type.xs.fontSize,
      lineHeight: type.xs.lineHeight,
      letterSpacing: '6%',
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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

// ─── Funding tier + square ────────────────────────────────────────────────────
//
//   < 33%   red    "Just getting started"
//   33–66%  amber  "Halfway home"
//   > 66%   green  "Almost funded"
//   ≥ 100%  green  "Fully funded — thank you"

export function fundingTier(raised, goal) {
  const pct = goal > 0 ? (raised / goal) * 100 : 0
  if (pct >= 100) return { key: 'complete', label: 'Fully funded — thank you', color: colors.fundHigh }
  if (pct >= 67)  return { key: 'high',     label: 'Almost funded',            color: colors.fundHigh }
  if (pct >= 33)  return { key: 'mid',      label: 'Halfway home',             color: colors.fundMid }
  return            { key: 'low',      label: 'Just getting started',     color: colors.fundLow }
}

// Small grainy rounded square in a tile's top-right corner, shaped like the
// HOUSEPVA app icon. Colour is never the only signal: the label is read by
// screen readers and the tile also prints "NN% funded".
export function FundingSquare({ raised, goal, size = 16 }) {
  const t = fundingTier(raised, goal)
  return (
    <span
      role="img"
      aria-label={t.label}
      style={{
        display: 'inline-block', flexShrink: 0,
        width: size, height: size, borderRadius: size * 0.28,
        background: `url(${grain}) center / 48px 48px, ${t.color}`,
        border: '1px solid rgba(255,255,255,0.45)',
        boxShadow: '0 3px 5px rgba(0,0,0,0.3)',
      }}
    />
  )
}

// ─── Tile — the blue gradient card used across the app ────────────────────────
//
// Pass `as="button"` for clickable tiles, `as="div"` for static ones.
// With `image`, the photo fills the whole tile at its own shape and the
// content sits over it, darkened towards the bottom so the text stays
// readable. Put a <div style={{ flex: 1 }} /> in the children to push the
// lower content down onto the dark part. `imageColour` (the same photo in
// colour) fades in on top up to the funded share — colour "loading in" as
// the burden is funded.
//
// Every tile carries data-dock-dark so the floating Dock can turn its labels
// white while one scrolls underneath it.

export function Tile({
  children,
  onClick,
  as = 'button',
  style,
  padding = 24,
  minHeight,
  flat = false,
  ariaLabel,
  image,
  imageColour,
  funded = 0,
}) {
  const [hover, setHover] = useState(false)
  const [colourIn, setColourIn] = useState(0)
  useEffect(() => {
    if (!imageColour) return
    const t = setTimeout(() => setColourIn(Math.max(0, Math.min(1, funded))), 250)
    return () => clearTimeout(t)
  }, [imageColour, funded])

  const Component = as
  // Layout props belong to the content layer; everything else to the box.
  const { gap, alignItems, textAlign, ...outer } = style || {}
  const box = {
    position: 'relative',
    background: tile.background,
    border: tile.border,
    boxShadow: hover && !flat ? tile.shadowHover : tile.shadow,
    color: tile.ink,
    padding,
    minHeight,
    aspectRatio: image ? '0.79' : undefined,
    borderRadius: radius.tile,
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    boxSizing: 'border-box',
    cursor: onClick ? 'pointer' : 'default',
    transform: hover && !flat ? 'translateY(-2px)' : 'translateY(0)',
    transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease',
    overflow: 'hidden',
    fontFamily: font.sans,
    ...outer,
  }
  const interactive = onClick
    ? { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false), onFocus: () => setHover(true), onBlur: () => setHover(false), onClick }
    : {}
  const photo = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }
  return (
    <Component
      type={as === 'button' ? 'button' : undefined}
      role={as !== 'button' && onClick ? 'button' : undefined}
      tabIndex={as !== 'button' && onClick ? 0 : undefined}
      onKeyDown={as !== 'button' && onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      aria-label={ariaLabel}
      data-dock-dark=""
      style={box}
      {...interactive}
    >
      {image && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <img src={image} alt="" style={photo} />
          {imageColour && (
            <img src={imageColour} alt="" style={{
              ...photo, opacity: colourIn,
              transition: 'opacity 1800ms cubic-bezier(0.22,1,0.36,1)',
            }} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.85) 100%)',
          }} />
        </div>
      )}
      {/* light streak along the top edge */}
      <span aria-hidden style={{
        position: 'absolute', top: 0, left: 24, right: 24, height: 1,
        background: 'rgba(255,255,255,0.45)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0,
        gap, alignItems, textAlign,
      }}>
        {children}
      </div>
    </Component>
  )
}
