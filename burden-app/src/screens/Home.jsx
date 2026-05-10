import { colors } from '../theme.js'
import { Button, Label, Rule, Progress, Badge, formatMoney } from '../components/UI.jsx'
import { campaigns, churches } from '../data/mock.js'

export default function Home({ navigate }) {
  const featured = campaigns.slice(0, 3)
  const churchById = (id) => churches.find(c => c.id === id)

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '0 28px' }}>
      {/* Hero */}
      <section style={{ padding: '96px 0 80px' }}>
        <Label>Galatians 6:2</Label>
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 300,
          lineHeight: 1.05,
          letterSpacing: -1,
          marginTop: 18,
          marginBottom: 24,
          maxWidth: 820,
        }}>
          Bear one another's<br />burdens — <em style={{ fontStyle: 'italic', color: colors.inkSoft }}>plainly,</em><br />
          <em style={{ fontStyle: 'italic', color: colors.inkSoft }}>traceably,</em> together.
        </h1>
        <p style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: colors.inkSoft,
          maxWidth: 580,
          marginBottom: 36,
        }}>
          BURDEN is a global Christian giving platform. Every church and institution is verified.
          Every donation is itemised and receipted. Give as little as one dollar to a congregation
          anywhere in the world.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button onClick={() => navigate({ name: 'discover' })}>Discover churches</Button>
          <Button variant="ghost" onClick={() => navigate({ name: 'about' })}>How BURDEN works</Button>
        </div>
      </section>

      <Rule />

      {/* Featured campaigns */}
      <section style={{ padding: '64px 0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 36 }}>
          <Label>Featured this week</Label>
          <button
            onClick={() => navigate({ name: 'discover' })}
            style={{
              background: 'transparent', border: 'none',
              fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
              color: colors.inkSoft, fontWeight: 500,
            }}
          >See all →</button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 0,
          borderTop: '1px solid ' + colors.rule,
          borderLeft: '1px solid ' + colors.rule,
        }}>
          {featured.map((c) => {
            const church = churchById(c.churchId)
            return (
              <button
                key={c.id}
                onClick={() => navigate({ name: 'campaign', id: c.id })}
                style={{
                  background: colors.bg,
                  border: 'none',
                  borderRight: '1px solid ' + colors.rule,
                  borderBottom: '1px solid ' + colors.rule,
                  padding: 28,
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                  minHeight: 280,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Label>{c.category}</Label>
                  {church.verified && <Badge tone="trust">Verified</Badge>}
                </div>

                <div>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 500,
                    lineHeight: 1.3,
                    marginBottom: 8,
                  }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: colors.inkMuted, letterSpacing: 1 }}>
                    {church.name} — {church.location}
                  </div>
                </div>

                <p style={{ fontSize: 12, lineHeight: 1.6, color: colors.inkSoft, flex: 1 }}>
                  {c.summary}
                </p>

                <div>
                  <Progress value={c.raised} goal={c.goal} />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 10,
                    fontSize: 10,
                    letterSpacing: 1,
                    color: colors.inkSoft,
                  }}>
                    <span>{formatMoney(c.raised)} raised</span>
                    <span>of {formatMoney(c.goal)}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Trust strip */}
      <section style={{
        padding: '64px 0',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 36,
        borderTop: '1px solid ' + colors.rule,
        marginTop: 24,
      }}>
        {[
          { k: 'Verified', v: 'Every church reviewed by two people before listing.' },
          { k: 'Itemised', v: 'See exactly what your donation pays for.' },
          { k: 'Receipted', v: 'Tax receipts issued automatically per jurisdiction.' },
          { k: 'Transparent', v: 'Quarterly platform-wide transparency report.' },
        ].map(item => (
          <div key={item.k}>
            <Label>{item.k}</Label>
            <div style={{ marginTop: 12, fontSize: 12, lineHeight: 1.6, color: colors.inkSoft }}>{item.v}</div>
          </div>
        ))}
      </section>
    </main>
  )
}
