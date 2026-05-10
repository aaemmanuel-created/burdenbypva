import { colors } from '../theme.js'

export function Label({ children, style }) {
  return (
    <div style={{
      fontSize: 10,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: colors.inkMuted,
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
    ...style,
  }
  return (
    <button type={type} onClick={onClick} style={base}>{children}</button>
  )
}

export function Progress({ value, goal }) {
  const pct = Math.min(100, Math.round((value / goal) * 100))
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        height: 2,
        background: colors.ruleSoft,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: pct + '%',
          background: colors.ink,
          transition: 'width 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        }} />
      </div>
    </div>
  )
}

export function Badge({ children, tone = 'default' }) {
  const palette = {
    default: { bg: 'transparent', fg: colors.ink, border: colors.rule },
    trust:   { bg: 'transparent', fg: colors.trust, border: colors.trust },
    warn:    { bg: 'transparent', fg: colors.warn,  border: colors.warn },
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
    }}>{children}</span>
  )
}

export function formatMoney(n, currency = 'USD') {
  const s = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
  return s
}
