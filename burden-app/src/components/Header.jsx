import { colors } from '../theme.js'

export default function Header({ route, navigate, givingCount }) {
  const items = [
    { id: 'discover', label: 'Discover' },
    { id: 'history', label: 'Giving' },
    { id: 'about', label: 'About' },
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
          }}
        >
          <span style={{
            fontSize: 14,
            letterSpacing: 6,
            fontWeight: 700,
            color: colors.ink,
          }}>BURDEN</span>
          <span style={{
            fontSize: 9,
            letterSpacing: 3,
            color: colors.inkMuted,
            fontWeight: 400,
          }}>BY PVA</span>
        </button>

        <nav style={{ display: 'flex', gap: 28 }}>
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
        </nav>
      </div>
    </header>
  )
}
