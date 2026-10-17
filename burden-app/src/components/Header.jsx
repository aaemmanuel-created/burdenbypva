import { colors, font, type } from '../theme.js'
import { formatMoney } from './UI.jsx'

// Header — just the wordmark (and the credit pill when there is credit).
// Navigation lives in the floating Dock at the bottom, as in the app.

export default function Header({ navigate, creditBalance = 0 }) {
  return (
    <header style={{ background: colors.bg }}>
      <div style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '24px 32px 0',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        <button
          onClick={() => navigate({ name: 'home' })}
          aria-label="BURDEN by HOUSEPVA — home"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <span style={{
            fontFamily: font.sans,
            fontSize: type.base.fontSize,
            letterSpacing: 6,
            fontWeight: 600,
            color: colors.ink,
          }}>BURDEN</span>
          <span style={{
            fontFamily: font.sans,
            fontSize: type.xs.fontSize,
            letterSpacing: '6%',
            color: colors.inkMuted,
            textTransform: 'uppercase',
          }}>by HOUSEPVA</span>
        </button>

        {creditBalance > 0 && (
          <button
            onClick={() => navigate({ name: 'profile' })}
            style={{
              background: colors.ink,
              color: colors.accentInk,
              border: 'none',
              borderRadius: 10,
              padding: '8px 14px',
              fontFamily: font.sans,
              fontSize: type.xs.fontSize,
              letterSpacing: '6%',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            aria-label={`Account credit ${formatMoney(creditBalance)}`}
          >Credit · {formatMoney(creditBalance)}</button>
        )}
      </div>
    </header>
  )
}
