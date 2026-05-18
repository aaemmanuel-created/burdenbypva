import { colors, tile } from '../theme.js'
import { Button, Label, Rule, Tile, formatMoney } from '../components/UI.jsx'

export default function History({ gifts, navigate }) {
  const total = gifts.reduce((s, g) => s + g.amount, 0)

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '64px 28px 0' }}>
      <Label>Giving history</Label>
      <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: -0.5, marginTop: 14, marginBottom: 36 }}>
        Your gifts on BURDEN.
      </h1>

      {gifts.length === 0 ? (
        <Tile flat as="div" padding={48} style={{ alignItems: 'center', textAlign: 'center', gap: 18 }}>
          <p style={{ fontSize: 13, color: tile.soft, margin: 0 }}>
            You haven't given a gift yet. Read through a burden, see the money
            workflow in plain language, and give what you can.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => navigate({ name: 'discover' })}
              style={{
                padding: '12px 22px',
                background: '#fff',
                color: colors.navyDeep,
                border: 'none',
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontWeight: 600,
                borderRadius: 999,
                cursor: 'pointer',
              }}
            >Discover churches</button>
            <button
              onClick={() => navigate({ name: 'profile' })}
              style={{
                padding: '12px 22px',
                background: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.6)',
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontWeight: 600,
                borderRadius: 999,
                cursor: 'pointer',
              }}
            >Open your account</button>
          </div>
        </Tile>
      ) : (
        <>
          <Tile flat as="div" padding={28} style={{ marginBottom: 32, gap: 24 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 24, flexWrap: 'wrap',
            }}>
              <div>
                <Label onNavy>Lifetime giving</Label>
                <div style={{ fontSize: 28, fontWeight: 500, marginTop: 8, color: tile.ink }}>
                  {formatMoney(total)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Label onNavy>Gifts</Label>
                <div style={{ fontSize: 28, fontWeight: 500, marginTop: 8, color: tile.ink }}>{gifts.length}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, letterSpacing: 1, color: tile.muted }}>
              See where your giving has gone in your <button
                onClick={() => navigate({ name: 'profile' })}
                style={{
                  background: 'transparent', border: 'none', padding: 0,
                  color: '#fff', textDecoration: 'underline',
                  fontSize: 11, letterSpacing: 1, cursor: 'pointer',
                }}
              >profile</button>.
            </div>
          </Tile>

          <Rule />

          <div>
            {gifts.slice().reverse().map(g => (
              <button
                key={g.id}
                onClick={() => navigate({ name: 'campaign', id: g.campaignId })}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid ' + colors.ruleSoft,
                  padding: '20px 0',
                  textAlign: 'left',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 24,
                  alignItems: 'baseline',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{g.campaignTitle}</div>
                  <div style={{ fontSize: 11, color: colors.inkMuted, letterSpacing: 1, marginTop: 4 }}>
                    {g.churchName} · {new Date(g.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {g.recurring && ' · Monthly'}
                    {g.anonymous && ' · Anonymous'}
                    {g.fromCredit && ' · Paid from credit'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{formatMoney(g.amount)}</div>
                  {g.coveredFee > 0 && (
                    <div style={{ fontSize: 10, color: colors.inkMuted, letterSpacing: 1, marginTop: 2 }}>
                      +{formatMoney(g.coveredFee)} fee covered
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
