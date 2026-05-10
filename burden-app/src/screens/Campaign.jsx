import { colors } from '../theme.js'
import { Button, Label, Rule, Progress, Badge, formatMoney } from '../components/UI.jsx'
import { campaigns, churches } from '../data/mock.js'

export default function Campaign({ id, navigate }) {
  const campaign = campaigns.find(c => c.id === id)
  if (!campaign) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 28px' }}>
        <p>Campaign not found.</p>
        <Button onClick={() => navigate({ name: 'discover' })}>Back to Discover</Button>
      </main>
    )
  }
  const church = churches.find(ch => ch.id === campaign.churchId)
  const pct = Math.round((campaign.raised / campaign.goal) * 100)

  // Itemised allocation — published in plain language per BURDEN principle.
  const items = [
    { label: 'Direct programme costs', share: 0.84 },
    { label: 'Local logistics & banking fees', share: 0.07 },
    { label: 'Payment processing', share: 0.045 },
    { label: 'BURDEN platform fee', share: 0.045 },
  ]

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 28px 0' }}>
      <button
        onClick={() => navigate({ name: 'discover' })}
        style={{
          background: 'transparent', border: 'none', padding: 0,
          fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
          color: colors.inkSoft, marginBottom: 32,
        }}
      >← Discover</button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: 56,
        alignItems: 'start',
      }}>
        {/* Left — content */}
        <div>
          <Label>{campaign.category}</Label>
          <h1 style={{
            fontSize: 36,
            fontWeight: 300,
            lineHeight: 1.15,
            letterSpacing: -0.5,
            marginTop: 14,
            marginBottom: 18,
          }}>{campaign.title}</h1>

          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 14,
            color: colors.inkSoft, fontSize: 12, letterSpacing: 1,
            marginBottom: 36,
          }}>
            <span style={{ fontWeight: 500, color: colors.ink }}>{church.name}</span>
            <span style={{ color: colors.inkMuted }}>·</span>
            <span>{church.location}</span>
            <span style={{ color: colors.inkMuted }}>·</span>
            {church.verified && <Badge tone="trust">{church.tier}</Badge>}
          </div>

          <Rule soft />

          <section style={{ padding: '32px 0' }}>
            <Label>About this campaign</Label>
            <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.75, color: colors.inkSoft }}>
              {campaign.summary} Funds raised here go directly to {church.name} via a verified
              local payout account. {church.name} files a public update at the close of every
              month showing what was spent and what remains.
            </p>
          </section>

          <Rule soft />

          <section style={{ padding: '32px 0' }}>
            <Label>Where every dollar goes</Label>
            <div style={{ marginTop: 18 }}>
              {items.map(it => (
                <div key={it.label} style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid ' + colors.ruleSoft,
                }}>
                  <span style={{ fontSize: 13, color: colors.ink }}>{it.label}</span>
                  <span style={{
                    fontSize: 12,
                    color: colors.inkSoft,
                    letterSpacing: 1,
                    fontWeight: 500,
                  }}>{(it.share * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 18, fontSize: 11, color: colors.inkMuted, lineHeight: 1.6 }}>
              Donors may also cover BURDEN's platform fee at checkout, in which case 100% of
              the gift reaches the church net of payment processing.
            </p>
          </section>

          <Rule soft />

          <section style={{ padding: '32px 0' }}>
            <Label>About {church.name}</Label>
            <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.75, color: colors.inkSoft }}>
              {church.summary} Founded {church.founded}. {church.tradition}. Led by {church.leadership}.
            </p>
          </section>
        </div>

        {/* Right — give panel */}
        <aside style={{
          position: 'sticky',
          top: 92,
          border: '1px solid ' + colors.rule,
          padding: 24,
          background: colors.bgAlt,
        }}>
          <div style={{ marginBottom: 18 }}>
            <Progress value={campaign.raised} goal={campaign.goal} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 24,
          }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 500 }}>{formatMoney(campaign.raised)}</div>
              <div style={{ fontSize: 10, color: colors.inkMuted, letterSpacing: 1, marginTop: 4 }}>
                of {formatMoney(campaign.goal)} ({pct}%)
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{campaign.donors}</div>
              <div style={{ fontSize: 10, color: colors.inkMuted, letterSpacing: 1, marginTop: 4 }}>
                donors
              </div>
            </div>
          </div>

          <Button
            full
            onClick={() => navigate({ name: 'give', id: campaign.id })}
          >Give to this campaign</Button>

          <p style={{ marginTop: 18, fontSize: 10, color: colors.inkMuted, lineHeight: 1.6, letterSpacing: 0.3 }}>
            Minimum gift: $1 USD or local equivalent. Receipt issued automatically.
            Anonymous and recurring options available at checkout.
          </p>
        </aside>
      </div>
    </main>
  )
}
