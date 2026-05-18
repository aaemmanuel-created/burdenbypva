import { colors, tile } from '../theme.js'
import { Label, Rule, Progress, Badge, Tile, FundingBanner, formatMoney } from '../components/UI.jsx'
import { campaigns, churches, events } from '../data/mock.js'

// The home screen is a curated feed in four sections:
//   1. Welcome paragraph   — sentence-like introduction (anchored centre-left)
//   2. Burden of the week  — one prominently featured burden, the week's pick
//   3. Burdens             — every verified burden currently raising
//   4. Churches            — verified congregations and institutions
//   5. Events              — upcoming services, outreach, town halls
// Sections are separated by hairline rules. Tiles are glassy navy with a
// raised 3D presentation and a funding-tier banner that shows transparently
// where each burden stands. "Burdens" are the user-facing name for what the
// data model calls "campaigns" (specific, time-bound, crowdfunded projects
// owned by a verified church — never general tithing).

export default function Home({ navigate, profile }) {
  // Weekly highlight — picked editorially. For the demo it's the Lagos
  // medical outreach: Premium-Trust church, large donor base, high urgency.
  const highlight = campaigns.find(c => c.id === 'cmp_redeemer_clinic')
  const highlightChurch = churches.find(c => c.id === highlight.churchId)

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '0 28px' }}>
      <Welcome navigate={navigate} profile={profile} />

      <Rule />

      <SectionTitle
        label="Burden of the week"
        sublabel="Pick the burden you want to carry before the Lord."
      />
      <HighlightCard campaign={highlight} church={highlightChurch} navigate={navigate} />

      <Rule />

      <SectionTitle label="Burdens" cta="See all" onCta={() => navigate({ name: 'discover' })} />
      <CampaignGrid items={campaigns} navigate={navigate} />

      <Invitation navigate={navigate} profile={profile} />

      <Rule />

      <SectionTitle label="Churches" cta="See all" onCta={() => navigate({ name: 'discover' })} />
      <ChurchGrid items={churches} navigate={navigate} />

      <Rule />

      <SectionTitle label="Events" />
      <EventList items={events} />
    </main>
  )
}

// ─── Welcome — sentence-like intro, anchored centre-left ─────────────────────
//
// Reads like a short paragraph rather than a stack of labels. The text
// column sits in the centred page wrapper, but every line is left-aligned
// so the eye can read it naturally.

function Welcome({ navigate, profile }) {
  const firstName = profile?.name ? profile.name.split(' ')[0] : null
  return (
    <section style={{
      padding: '72px 0 56px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      textAlign: 'left',
      gap: 18,
    }}>
      <Label>BURDEN by PVA</Label>
      <p style={{
        fontSize: 'clamp(20px, 2.6vw, 28px)',
        lineHeight: 1.45,
        fontWeight: 400,
        letterSpacing: -0.2,
        color: colors.ink,
        maxWidth: 720,
        margin: 0,
      }}>
        {firstName ? `Welcome back, ${firstName}.` : 'Welcome.'} Below are the
        burdens our verified churches are carrying this week — schools, clinics,
        a fellowship hall under repair, a Wednesday meal. Read them, pick the
        one that moves you, and give what you can. Every gift is tracked end
        to end, every church is verified, and you can always see exactly where
        your money has gone.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
        <CtaPill onClick={() => navigate({ name: 'discover' })} primary>
          Browse burdens
        </CtaPill>
        <CtaPill onClick={() => navigate({ name: 'profile' })}>
          {profile?.creditBalance > 0
            ? `Your account · ${formatMoney(profile.creditBalance)} credit`
            : 'Open your account'}
        </CtaPill>
      </div>
    </section>
  )
}

function CtaPill({ children, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 20px',
        background: primary ? colors.ink : 'transparent',
        color: primary ? colors.accentInk : colors.ink,
        border: '1px solid ' + colors.rule,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontWeight: 500,
        cursor: 'pointer',
        borderRadius: 999,
      }}
    >{children}</button>
  )
}

// ─── Section title with optional CTA ──────────────────────────────────────────

function SectionTitle({ label, sublabel, cta, onCta }) {
  return (
    <div style={{ padding: '64px 0 28px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}>
        <Label>{label}</Label>
        {cta && (
          <button
            onClick={onCta}
            style={{
              background: 'transparent', border: 'none',
              fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
              color: colors.inkSoft, fontWeight: 500, cursor: 'pointer',
            }}
          >{cta} →</button>
        )}
      </div>
      {sublabel && (
        <p style={{
          marginTop: 14,
          fontSize: 14,
          lineHeight: 1.6,
          color: colors.inkSoft,
          maxWidth: 640,
        }}>{sublabel}</p>
      )}
    </div>
  )
}

// ─── Highlight of the week — single large glassy navy card ────────────────────

function HighlightCard({ campaign, church, navigate }) {
  const pct = Math.round((campaign.raised / campaign.goal) * 100)
  return (
    <Tile
      onClick={() => navigate({ name: 'campaign', id: campaign.id })}
      padding={32}
      style={{ gap: 18 }}
    >
      <FundingBanner raised={campaign.raised} goal={campaign.goal} />

      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <Label onNavy>{campaign.category}</Label>
        {church.verified && <Badge tone="trust" onNavy>{church.tier}</Badge>}
      </div>

      <h2 style={{
        fontSize: 'clamp(22px, 4vw, 32px)',
        fontWeight: 400,
        lineHeight: 1.15,
        letterSpacing: -0.5,
        color: tile.ink,
        margin: 0,
      }}>{campaign.title}</h2>

      <div style={{ fontSize: 12, color: tile.muted, letterSpacing: 1 }}>
        {church.name} — {church.location}
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.7, color: tile.soft, maxWidth: 640, margin: 0 }}>
        {campaign.summary}
      </p>

      <div style={{ display: 'flex', gap: 32, alignItems: 'baseline', flexWrap: 'wrap', marginTop: 6 }}>
        <Stat label="Raised" value={formatMoney(campaign.raised)} />
        <Stat label="Goal"   value={formatMoney(campaign.goal)} />
        <Stat label="Donors" value={String(campaign.donors)} />
      </div>

      <div style={{ marginTop: 8 }}>
        <Progress value={campaign.raised} goal={campaign.goal} onNavy />
        <div style={{
          marginTop: 10,
          fontSize: 11,
          letterSpacing: 1,
          color: tile.soft,
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>{pct}% funded</span>
          <span>{campaign.daysLeft} days left</span>
        </div>
      </div>

      <div style={{
        marginTop: 8,
        alignSelf: 'flex-start',
        padding: '12px 22px',
        border: '1px solid rgba(255,255,255,0.55)',
        background: '#fff',
        color: colors.navyDeep,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontWeight: 600,
        borderRadius: 999,
        boxShadow: '0 6px 14px -6px rgba(0,0,0,0.55)',
      }}>View burden →</div>
    </Tile>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <Label onNavy>{label}</Label>
      <div style={{ fontSize: 20, fontWeight: 500, marginTop: 4, color: tile.ink }}>{value}</div>
    </div>
  )
}

// ─── Burdens grid ─────────────────────────────────────────────────────────────

function CampaignGrid({ items, navigate }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 20,
    }}>
      {items.map(c => {
        const church = churches.find(ch => ch.id === c.churchId)
        const pct = Math.round((c.raised / c.goal) * 100)
        return (
          <Tile
            key={c.id}
            onClick={() => navigate({ name: 'campaign', id: c.id })}
            padding={24}
            minHeight={300}
            style={{ gap: 14 }}
          >
            <FundingBanner raised={c.raised} goal={c.goal} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Label onNavy>{c.category}</Label>
              {church.verified && <Badge tone="trust" onNavy>Verified</Badge>}
            </div>

            <div>
              <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.3, color: tile.ink }}>{c.title}</div>
              <div style={{ fontSize: 11, color: tile.muted, letterSpacing: 1, marginTop: 6 }}>
                {church.name} — {church.location}
              </div>
            </div>

            <p style={{ fontSize: 12, lineHeight: 1.6, color: tile.soft, flex: 1, margin: 0 }}>
              {c.summary}
            </p>

            <div>
              <Progress value={c.raised} goal={c.goal} onNavy />
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: 10, fontSize: 10, letterSpacing: 1, color: tile.soft,
              }}>
                <span>{pct}% — {c.donors} donors</span>
                <span>{c.daysLeft}d left</span>
              </div>
            </div>
          </Tile>
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
      gap: 20,
    }}>
      {items.map(ch => (
        <Tile
          key={ch.id}
          onClick={() => navigate({ name: 'discover' })}
          padding={24}
          minHeight={220}
          style={{ gap: 14 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Label onNavy>{ch.tradition}</Label>
            {ch.verified && <Badge tone="trust" onNavy>{ch.tier}</Badge>}
          </div>

          <div>
            <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.3, color: tile.ink }}>{ch.name}</div>
            <div style={{ fontSize: 11, color: tile.muted, letterSpacing: 1, marginTop: 6 }}>
              {ch.location} · est. {ch.founded}
            </div>
          </div>

          <p style={{ fontSize: 12, lineHeight: 1.6, color: tile.soft, flex: 1, margin: 0 }}>
            {ch.summary}
          </p>

          <div style={{ fontSize: 10, letterSpacing: 1, color: tile.muted }}>
            {ch.members.toLocaleString()} members
          </div>
        </Tile>
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

// ─── Invitation — a gentle, impact-based nudge ────────────────────────────────
//
// Brand guardrails (CLAUDE.md): no urgency exploitation, no
// spiritual-reward-for-giving language. This block stays factual and
// invitational: how many burdens are currently raising, what carrying one
// more would mean in plain terms, and a single soft call-to-action.

function Invitation({ navigate, profile }) {
  const open = campaigns.filter(c => c.raised < c.goal)
  const underHalf = open.filter(c => c.raised / c.goal < 0.5).length
  const gifts = profile?.giftCount ?? 0
  const heading = gifts === 0
    ? 'Would you carry one this week?'
    : 'Would you carry one more this week?'
  const body = gifts === 0
    ? `${open.length} burdens are currently raising. ${underHalf} are still under halfway. A single gift of any size moves a real, named project forward — and you can read the money workflow before you give.`
    : `${open.length} burdens are still raising. ${underHalf} are still under halfway. If one of them is on your heart, you can give from your card or from your BURDEN account credit.`

  return (
    <section style={{ padding: '48px 0 0' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: 32,
        alignItems: 'center',
        background: colors.bgAlt,
        border: '1px solid ' + colors.ruleSoft,
        padding: 28,
        borderRadius: 8,
      }}>
        <div>
          <Label>An invitation</Label>
          <h3 style={{
            fontSize: 'clamp(18px, 2.2vw, 22px)',
            fontWeight: 400,
            letterSpacing: -0.2,
            margin: '10px 0 10px',
            lineHeight: 1.3,
          }}>{heading}</h3>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: colors.inkSoft, margin: 0, maxWidth: 560 }}>
            {body}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <CtaPill onClick={() => navigate({ name: 'discover' })} primary>Browse burdens</CtaPill>
          <CtaPill onClick={() => navigate({ name: 'profile' })}>Your impact</CtaPill>
        </div>
      </div>
    </section>
  )
}
