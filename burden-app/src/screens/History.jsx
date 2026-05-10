import { colors } from '../theme.js'
import { Button, Label, Rule, formatMoney } from '../components/UI.jsx'

export default function History({ gifts, navigate }) {
  const total = gifts.reduce((s, g) => s + g.amount, 0)

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '64px 28px 0' }}>
      <Label>Giving history</Label>
      <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: -0.5, marginTop: 14, marginBottom: 36 }}>
        Your gifts on BURDEN.
      </h1>

      {gifts.length === 0 ? (
        <div style={{
          border: '1px solid ' + colors.rule,
          padding: 48,
          textAlign: 'center',
          background: colors.bgAlt,
        }}>
          <p style={{ fontSize: 13, color: colors.inkSoft, marginBottom: 24 }}>
            You haven't given a gift yet.
          </p>
          <Button onClick={() => navigate({ name: 'discover' })}>Discover churches</Button>
        </div>
      ) : (
        <>
          <div style={{
            border: '1px solid ' + colors.rule,
            padding: '24px 28px',
            marginBottom: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}>
            <div>
              <Label>Lifetime giving</Label>
              <div style={{ fontSize: 28, fontWeight: 500, marginTop: 8 }}>{formatMoney(total)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Label>Gifts</Label>
              <div style={{ fontSize: 28, fontWeight: 500, marginTop: 8 }}>{gifts.length}</div>
            </div>
          </div>

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
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{g.campaignTitle}</div>
                  <div style={{ fontSize: 11, color: colors.inkMuted, letterSpacing: 1, marginTop: 4 }}>
                    {g.churchName} · {new Date(g.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {g.recurring && ' · Monthly'}
                    {g.anonymous && ' · Anonymous'}
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
