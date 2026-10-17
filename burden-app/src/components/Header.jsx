import { colors, font, type } from '../theme.js'
import { formatMoney } from './UI.jsx'

// Header — §4: no border-bottom; separation from content is whitespace.
// Wordmark is the display serif (§2); only weights 400/500/600 anywhere.

export default function Header({ route, navigate, givingCount, creditBalance = 0 }) {
  const items = [
    { id: 'discover', label: 'Discover' },
    { id: 'history',  label: 'Giving' },
    { id: 'profile',  label: 'Profile' },
    { id: 'about',    label: 'About' },
  ]
  return (
    <header style={{
      background: colors.bg,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 32,
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => navigate({ name: 'home' })}
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
            fontFamily: font.serif,
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
            fontWeight: 400,
            textTransform: 'uppercase',
          }}>by HOUSEPVA</span>
        </button>

        <nav style={{ display: 'flex', gap: 24, alignItems: 'baseline', flexWrap: 'wrap' }}>
          {items.map(it => {
            const active = route.name === it.id
            return (
              <button
                key={it.id}
                onClick={() => navigate({ name: it.id })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 0',
                  fontFamily: font.sans,
                  fontSize: type.xs.fontSize,
                  letterSpacing: '6%',
                  textTransform: 'uppercase',
                  color: active ? colors.ink : colors.inkSoft,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {it.label}
                {it.id === 'history' && givingCount > 0 && (
                  <span style={{
                    marginLeft: 8,
                    fontSize: type.xs.fontSize,
                    color: colors.inkMuted,
                  }}>({givingCount})</span>
                )}
              </button>
            )
          })}
          {creditBalance > 0 && (
            <button
              onClick={() => navigate({ name: 'profile' })}
              style={{
                background: colors.ink,
                color: colors.accentInk,
                border: 'none',
                borderRadius: 999,
                padding: '8px 16px',
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
        </nav>
      </div>
    </header>
  )
}
