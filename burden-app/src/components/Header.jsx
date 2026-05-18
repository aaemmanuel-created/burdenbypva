import { colors } from '../theme.js'
import { formatMoney } from './UI.jsx'

const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export default function Header({ route, navigate, givingCount, creditBalance = 0 }) {
  const items = [
    { id: 'discover', label: 'Discover' },
    { id: 'history',  label: 'Giving' },
    { id: 'profile',  label: 'Profile' },
    { id: 'about',    label: 'About' },
  ]
  return (
    <header style={{
      borderBottom: '1px solid ' + colors.rule,
      background: colors.bg,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '20px 28px',
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
            gap: 10,
            cursor: 'pointer',
            fontFamily: HELVETICA,
          }}
        >
          <span style={{
            fontSize: 14,
            letterSpacing: 4,
            fontWeight: 400,
            color: colors.ink,
            fontFamily: HELVETICA,
          }}>BURDEN</span>
          <span style={{
            fontSize: 9,
            letterSpacing: 2,
            color: colors.inkMuted,
            fontWeight: 400,
            fontFamily: HELVETICA,
          }}>by PVA</span>
        </button>

        <nav style={{ display: 'flex', gap: 28, alignItems: 'baseline', flexWrap: 'wrap' }}>
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
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: active ? colors.ink : colors.inkSoft,
                  fontWeight: active ? 600 : 400,
                  borderBottom: active ? '1px solid ' + colors.ink : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {it.label}
                {it.id === 'history' && givingCount > 0 && (
                  <span style={{
                    marginLeft: 6,
                    fontSize: 9,
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
                padding: '6px 12px',
                fontSize: 10,
                letterSpacing: 1.5,
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
