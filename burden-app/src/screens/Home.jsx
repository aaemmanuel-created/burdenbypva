import { colors } from '../theme.js'
import { Label, Rule, Progress, Badge, formatMoney } from '../components/UI.jsx'
import { campaigns, churches, events } from '../data/mock.js'

// The home screen is a curated feed in four sections:
//   1. Highlight of the week   — one prominently featured project
//   2. Projects                — verified campaigns currently raising
//   3. Churches                — verified congregations and institutions
//   4. Events                  — upcoming services, outreach, town halls
// Sections are separated by hairline rules. No marketing hero — donors
// who land here are signed in and want to see what's live this week.

export default function Home({ navigate }) {
  // Weekly highlight — picked editorially. For the demo it's the Lagos
  // medical outreach: Premium-Trust church, large donor base, high urgency.
  const highlight = campaigns.find(c => c.id === 'cmp_redeemer_clinic')
  const highlightChurch = churches.find(c => c.id === highlight.churchId)

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '0 28px' }}>
      <SectionTitle label="Highlight of the week" />
      <HighlightCard campaign={highlight} church={highlightChurch} navigate={navigate} />

      <Rule />

      <SectionTitle label="Projects" cta="See all" onCta={() => navigate({ name: 'discover' })} />
      <CampaignGrid items={campaigns} navigate={navigate} />

      <Rule />

      <SectionTitle label="Churches" cta="See all" onCta={() => navigate({ name: 'discover' })} />
      <ChurchGrid items={churches} navigate={navigate} />

      <Rule />

      <SectionTitle label="Events" />
      <EventList items={events} />
    </main>
  )
}

// ─── Section title with optional CTA ──────────────────────────────────────────

function SectionTitle({ label, cta, onCta }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '64px 0 28px',
    }}>
      <Label>{label}</Label>
      {cta && (
        <button
          onClick={onCta}
          style={{
            background: 'transparent', border: 'none',
            fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
            color: colors.inkSoft, fontWeight: 500,
          }}
        >{cta} →</button>
      )}
    </div>
  )
}

// ─── Highlight of the week — single large card ────────────────────────────────

function HighlightCard({ campaign, church, navigate }) {
  const pct = Math.round((campaign.raised / campaign.goal) * 100)
  // Single column, stacked. Responsive at every width — no internal grid
  // means no character-by-character title wrap on narrow viewports.
  return (
    <button
      onClick={() => navigate({ name: 'campaign', id: campaign.id })}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        alignItems: 'stretch',
        background: colors.bgAlt,
        border: '1px solid ' + colors.rule,
        padding: 32,
        textAlign: 'left',
        width: '100%',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <Label>{campaign.category}</Label>
        {church.verified && <Badge tone="trust">{church.tier}</Badge>}
      </div>

      <h2 style={{
        fontSize: 'clamp(22px, 4vw, 32px)',
        fontWeight: 400,
        lineHeight: 1.15,
        letterSpacing: -0.5,
      }}>{campaign.title}</h2>

      <div style={{ fontSize: 12, color: colors.inkMuted, letterSpacing: 1 }}>
        {church.name} — {church.location}
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.7, color: colors.inkSoft, maxWidth: 640 }}>
        {campaign.summary}
      </p>

      <div style={{ display: 'flex', gap: 32, alignItems: 'baseline', flexWrap: 'wrap', marginTop: 6 }}>
        <Stat label="Raised" value={formatMoney(campaign.raised)} />
        <Stat label="Goal"   value={formatMoney(campaign.goal)} />
        <Stat label="Donors" value={String(campaign.donors)} />
      </div>

      <div style={{ marginTop: 8 }}>
        <Progress value={campaign.raised} goal={campaign.goal} />
        <div style={{
          marginTop: 10,
          fontSize: 11,
          letterSpacing: 1,
          color: colors.inkSoft,
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>{pct}% funded</span>
          <span>{campaign.daysLeft} days left</span>
        </div>
      </div>

      {/* Visual CTA — not a real <button> (we're already inside one). */}
      <div style={{
        marginTop: 8,
        alignSelf: 'flex-start',
        padding: '12px 22px',
        border: '1px solid ' + colors.rule,
        background: colors.ink,
        color: colors.accentInk,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontWeight: 500,
      }}>View campaign</div>
    </button>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ fontSize: 20, fontWeight: 500, marginTop: 4 }}>{value}</div>
    </div>
  )
}

// ─── Projects grid ────────────────────────────────────────────────────────────

function CampaignGrid({ items, navigate }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      borderTop: '1px solid ' + colors.rule,
      borderLeft: '1px solid ' + colors.rule,
    }}>
      {items.map(c => {
        const church = churches.find(ch => ch.id === c.churchId)
        const pct = Math.round((c.raised / c.goal) * 100)
        return (
          <button
            key={c.id}
            onClick={() => navigate({ name: 'campaign', id: c.id })}
            style={{
              background: colors.bg,
              border: 'none',
              borderRight: '1px solid ' + colors.rule,
              borderBottom: '1px solid ' + colors.rule,
              padding: 24,
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              minHeight: 260,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Label>{c.category}</Label>
              {church.verified && <Badge tone="trust">Verified</Badge>}
            </div>

            <div>
              <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.3 }}>{c.title}</div>
              <div style={{ fontSize: 11, color: colors.inkMuted, letterSpacing: 1, marginTop: 6 }}>
                {church.name} — {church.location}
              </div>
            </div>

            <p style={{ fontSize: 12, lineHeight: 1.6, color: colors.inkSoft, flex: 1 }}>
              {c.summary}
            </p>

            <div>
              <Progress value={c.raised} goal={c.goal} />
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: 10, fontSize: 10, letterSpacing: 1, color: colors.inkSoft,
              }}>
                <span>{pct}% — {c.donors} donors</span>
                <span>{c.daysLeft}d left</span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── Churches grid ────────────────────────────────────────────────────────────

function ChurchGrid({ items, navigate }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      borderTop: '1px solid ' + colors.rule,
      borderLeft: '1px solid ' + colors.rule,
    }}>
      {items.map(ch => (
        <button
          key={ch.id}
          // No church-detail screen yet — clicking a church opens Discover
          // filtered context. For MVP we just route to Discover; later this
          // becomes /church/:id.
          onClick={() => navigate({ name: 'discover' })}
          style={{
            background: colors.bg,
            border: 'none',
            borderRight: '1px solid ' + colors.rule,
            borderBottom: '1px solid ' + colors.rule,
            padding: 24,
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            minHeight: 220,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Label>{ch.tradition}</Label>
            {ch.verified && <Badge tone="trust">{ch.tier}</Badge>}
          </div>

          <div>
            <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.3 }}>{ch.name}</div>
            <div style={{ fontSize: 11, color: colors.inkMuted, letterSpacing: 1, marginTop: 6 }}>
              {ch.location} · est. {ch.founded}
            </div>
          </div>

          <p style={{ fontSize: 12, lineHeight: 1.6, color: colors.inkSoft, flex: 1 }}>
            {ch.summary}
          </p>

          <div style={{ fontSize: 10, letterSpacing: 1, color: colors.inkMuted }}>
            {ch.members.toLocaleString()} members
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Events list ──────────────────────────────────────────────────────────────

function EventList({ items }) {
  // Sort ascending — soonest event first.
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <div style={{ borderTop: '1px solid ' + colors.rule }}>
      {sorted.map(e => {
        const church = e.churchId ? churches.find(ch => ch.id === e.churchId) : null
        const d = new Date(e.date)
        const day = d.toLocaleDateString('en-GB', { day: '2-digit' })
        const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
        return (
          <div key={e.id} style={{
            display: 'grid',
            gridTemplateColumns: '88px 1fr auto',
            gap: 28,
            alignItems: 'baseline',
            padding: '24px 0',
            borderBottom: '1px solid ' + colors.ruleSoft,
          }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 500, lineHeight: 1 }}>{day}</div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: colors.inkMuted, marginTop: 6 }}>{month}</div>
            </div>

            <div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{e.title}</div>
              <div style={{ fontSize: 11, letterSpacing: 1, color: colors.inkMuted, marginBottom: 8 }}>
                {church ? church.name.toUpperCase() : 'BURDEN'} · {e.location.toUpperCase()}
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: colors.inkSoft, maxWidth: 640 }}>
                {e.summary}
              </p>
            </div>

            <Badge>{e.category}</Badge>
          </div>
        )
      })}
    </div>
  )
}
