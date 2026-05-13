import { colors } from '../theme.js'
import { Button, Label, Rule, Progress, Badge, formatMoney } from '../components/UI.jsx'
import { campaigns, churches } from '../data/mock.js'

// Burden detail. The user-facing word is "burden" — the data model still
// calls these "campaigns" internally. Every burden surfaces five things
// that distinguish BURDEN from a generic tithing platform:
//   1. Objective    — what specifically this burden achieves
//   2. State        — where things stand right now
//   3. Team         — who is responsible for what
//   4. Money flow   — how funds get from donor to delivery
//   5. Prayer group — donors can pray specifically, not just give

export default function Campaign({ id, navigate, joined, onTogglePrayer }) {
  const burden = campaigns.find(c => c.id === id)
  if (!burden) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 28px' }}>
        <p>Burden not found.</p>
        <Button onClick={() => navigate({ name: 'discover' })}>Back to Discover</Button>
      </main>
    )
  }
  const church = churches.find(ch => ch.id === burden.churchId)
  const pct = Math.round((burden.raised / burden.goal) * 100)

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
          <Label>{burden.category} · Burden</Label>
          <h1 style={{
            fontSize: 'clamp(28px, 4.5vw, 36px)',
            fontWeight: 300,
            lineHeight: 1.15,
            letterSpacing: -0.5,
            marginTop: 14,
            marginBottom: 18,
          }}>{burden.title}</h1>

          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap',
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

          {/* Objective */}
          <section style={{ padding: '32px 0' }}>
            <Label>Objective</Label>
            <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.75, color: colors.ink }}>
              {burden.objective}
            </p>
          </section>

          <Rule soft />

          {/* Current state */}
          <section style={{ padding: '32px 0' }}>
            <Label>Current state</Label>
            <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.75, color: colors.inkSoft }}>
              {burden.currentState}
            </p>
          </section>

          <Rule soft />

          {/* Team — who handles what */}
          <section style={{ padding: '32px 0' }}>
            <Label>Who handles what</Label>
            <div style={{ marginTop: 18 }}>
              {burden.team.map(member => (
                <div key={member.role} style={{
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: 16,
                  padding: '12px 0',
                  borderBottom: '1px solid ' + colors.ruleSoft,
                }}>
                  <span style={{
                    fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                    color: colors.inkMuted,
                  }}>{member.role}</span>
                  <span style={{ fontSize: 13, color: colors.ink }}>{member.name}</span>
                </div>
              ))}
            </div>
          </section>

          <Rule soft />

          {/* Money workflow */}
          <section style={{ padding: '32px 0' }}>
            <Label>How the money moves</Label>
            <ol style={{
              marginTop: 18,
              listStyle: 'none',
              padding: 0,
              counterReset: 'mw',
            }}>
              {burden.moneyWorkflow.map((step, i) => (
                <li key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr',
                  gap: 16,
                  padding: '14px 0',
                  borderBottom: '1px solid ' + colors.ruleSoft,
                  alignItems: 'baseline',
                }}>
                  <span style={{
                    fontSize: 11, letterSpacing: 1, color: colors.inkMuted,
                  }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.65, color: colors.ink }}>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <Rule soft />

          {/* Prayer group */}
          <section style={{ padding: '32px 0' }}>
            <PrayerGroup burden={burden} joined={joined} onToggle={onTogglePrayer} />
          </section>

          <Rule soft />

          {/* Where every dollar goes */}
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

          {/* About the church */}
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
            <Progress value={burden.raised} goal={burden.goal} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 24,
          }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 500 }}>{formatMoney(burden.raised)}</div>
              <div style={{ fontSize: 10, color: colors.inkMuted, letterSpacing: 1, marginTop: 4 }}>
                of {formatMoney(burden.goal)} ({pct}%)
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{burden.donors}</div>
              <div style={{ fontSize: 10, color: colors.inkMuted, letterSpacing: 1, marginTop: 4 }}>
                donors
              </div>
            </div>
          </div>

          <Button
            full
            onClick={() => navigate({ name: 'give', id: burden.id })}
          >Carry this burden — give</Button>

          <p style={{ marginTop: 18, fontSize: 10, color: colors.inkMuted, lineHeight: 1.6, letterSpacing: 0.3 }}>
            Minimum gift: $1 USD or local equivalent. Receipt issued automatically.
            Anonymous and recurring options available at checkout.
          </p>
        </aside>
      </div>
    </main>
  )
}

function PrayerGroup({ burden, joined, onToggle }) {
  const memberCount = burden.prayerGroup.members + (joined ? 1 : 0)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Label>Prayer group</Label>
        <span style={{ fontSize: 10, letterSpacing: 1, color: colors.inkMuted }}>
          {memberCount.toLocaleString()} praying · {burden.prayerGroup.recentPrayers} prayers this week
        </span>
      </div>

      <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.75, color: colors.ink }}>
        {burden.prayerGroup.focusLine}
      </p>

      <p style={{ marginTop: 14, fontSize: 12, lineHeight: 1.7, color: colors.inkSoft, maxWidth: 580 }}>
        Prayer on BURDEN is specific — when you join this group you'll see weekly updates from
        the team on what to pray for, and you can post prayers and short scriptures alongside other
        members of the group. Prayer is not a substitute for giving; it sits alongside it.
      </p>

      <div style={{ marginTop: 20 }}>
        <Button onClick={onToggle} variant={joined ? 'ghost' : 'primary'}>
          {joined ? 'You are in this prayer group ✓' : 'Join the prayer group'}
        </Button>
      </div>
    </div>
  )
}
