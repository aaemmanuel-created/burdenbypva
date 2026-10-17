import { colors, tile, font, type } from '../theme.js'
import { Label, Badge, Tile, formatMoney } from '../components/UI.jsx'
import BurdenTile from '../components/BurdenTile.jsx'
import DailyReading from '../components/DailyReading.jsx'
import { useParallax, FadeIn } from '../lib/motion.jsx'
import { statusLabel } from '../lib/giftTimeline.js'
import { campaigns, churches, events } from '../data/mock.js'

// The home screen is a curated feed (web twin of burden-native HomeScreen):
//   1. Welcome paragraph   — sentence-like introduction
//   2. Highlight of the week — always a photo tile: the week's pick if it
//                              has a photo, otherwise the first burden that does
//   3. Shared Burdens      — the burdens this donor has given to, with status
//   4. Burdens             — every verified burden currently raising
//   5. Churches            — verified congregations and institutions
//   6. Events              — upcoming services, outreach, town halls
// …closed by <DailyReading />. Sections are separated by whitespace, not rules.

// This week's highlighted burden.
const HIGHLIGHT_ID = 'cmp_andrew_bursary'

export default function Home({ navigate, profile }) {
  const highlight = campaigns.find(c => c.id === HIGHLIGHT_ID && c.image)
    ?? campaigns.find(c => c.image)
    ?? campaigns[0]
  const highlightChurch = churches.find(c => c.id === highlight.churchId)
  const parallaxRef = useParallax()

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px' }}>
      <Welcome navigate={navigate} profile={profile} />

      <SectionTitle
        label="Highlight of the week"
        sublabel="Pick the burden you want to carry before the Lord."
      />
      <div ref={parallaxRef} style={{ willChange: 'transform', maxWidth: 560 }}>
        <BurdenTile
          campaign={highlight}
          church={highlightChurch}
          highlight
          onOpen={() => navigate({ name: 'campaign', id: highlight.id })}
        />
      </div>

      <div style={{ height: 96 }} aria-hidden />

      <SectionTitle label="Shared Burdens" />
      <SharedBurdens gifts={profile?.gifts ?? []} navigate={navigate} />

      <div style={{ height: 96 }} aria-hidden />

      <SectionTitle label="Burdens" cta="See all" onCta={() => navigate({ name: 'discover' })} />
      <CampaignGrid items={campaigns} navigate={navigate} />

      <Invitation navigate={navigate} profile={profile} />

      <div style={{ height: 96 }} aria-hidden />

      <SectionTitle label="Churches" cta="See all" onCta={() => navigate({ name: 'discover' })} />
      <ChurchGrid items={churches} navigate={navigate} />

      <div style={{ height: 96 }} aria-hidden />

      <SectionTitle label="Events" />
      <EventList items={events} />

      <DailyReading />
    </main>
  )
}

// ─── Welcome — sentence-like intro ────────────────────────────────────────────

function Welcome({ navigate, profile }) {
  const firstName = profile?.name ? profile.name.split(' ')[0] : null
  return (
    <section style={{
      padding: '96px 0 64px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      textAlign: 'left',
      gap: 16,
    }}>
      <Label>BURDEN by HOUSEPVA</Label>
      <p style={{
        fontFamily: font.sans,
        fontSize: `clamp(${type.xl.fontSize}px, 3vw, ${type['2xl'].fontSize}px)`,
        lineHeight: type['2xl'].lineHeight,
        fontWeight: 400,
        letterSpacing: '-1%',
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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <Cta onClick={() => navigate({ name: 'discover' })} primary>Browse burdens</Cta>
        <Cta onClick={() => navigate({ name: 'profile' })}>
          {profile?.creditBalance > 0
            ? `Your account · ${formatMoney(profile.creditBalance)} credit`
            : 'Open your account'}
        </Cta>
      </div>
    </section>
  )
}

// Rounded rectangles, as in the app (not pills).
function Cta({ children, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px 24px',
        background: primary ? colors.ink : 'transparent',
        color: primary ? colors.accentInk : colors.ink,
        border: '1px solid ' + colors.rule,
        fontFamily: font.sans,
        fontSize: type.xs.fontSize,
        letterSpacing: '6%',
        textTransform: 'uppercase',
        fontWeight: 500,
        cursor: 'pointer',
        borderRadius: 10,
      }}
    >{children}</button>
  )
}

// ─── Section title with optional CTA ──────────────────────────────────────────

function SectionTitle({ label, sublabel, cta, onCta }) {
  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 24 }}>
        <h2 style={{
          fontFamily: font.sans,
          fontSize: type.xs.fontSize,
          letterSpacing: '6%',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: colors.inkMuted,
          margin: 0,
        }}>{label}</h2>
        {cta && (
          <button
            onClick={onCta}
            style={{
              background: 'transparent', border: 'none',
              fontFamily: font.sans,
              fontSize: type.xs.fontSize, letterSpacing: '6%', textTransform: 'uppercase',
              color: colors.inkSoft, fontWeight: 500, cursor: 'pointer',
            }}
          >{cta} →</button>
        )}
      </div>
      {sublabel && (
        <p style={{
          marginTop: 12,
          fontFamily: font.sans,
          fontSize: type.sm.fontSize,
          lineHeight: type.sm.lineHeight,
          color: colors.inkSoft,
          maxWidth: 640,
        }}>{sublabel}</p>
      )}
    </div>
  )
}

// ─── Shared Burdens — every burden this donor has given to ────────────────────
//
// Newest gift first; one tile per burden with the donor's total and where
// the latest gift has got to. Only gifts that went through count.

function SharedBurdens({ gifts, navigate }) {
  const shared = [...gifts].reverse().reduce((list, g) => {
    const existing = list.find(s => s.campaign.id === g.campaignId)
    if (existing) { existing.total += g.amount; return list }
    const campaign = campaigns.find(c => c.id === g.campaignId)
    if (campaign) list.push({ campaign, total: g.amount, latestGiftId: g.id, status: statusLabel(g) })
    return list
  }, [])

  if (shared.length === 0) {
    return (
      <p style={{ fontFamily: font.sans, fontSize: type.sm.fontSize, lineHeight: 1.6, color: colors.inkSoft, maxWidth: 560, margin: 0 }}>
        Burdens you give to will appear here, so you can follow each one.
      </p>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
      {shared.map(s => {
        const church = churches.find(ch => ch.id === s.campaign.churchId)
        return (
          <div key={s.campaign.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => navigate({ name: 'gift', id: s.latestGiftId })}
              style={{
                background: 'transparent', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer',
                fontFamily: font.sans, fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase',
                fontWeight: 600, color: colors.inkSoft,
              }}
            >You shared {formatMoney(s.total)} · {s.status} →</button>
            <BurdenTile
              campaign={s.campaign}
              church={church}
              onOpen={() => navigate({ name: 'campaign', id: s.campaign.id })}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Burdens grid ─────────────────────────────────────────────────────────────

function CampaignGrid({ items, navigate }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
      {items.map((c, i) => {
        const church = churches.find(ch => ch.id === c.churchId)
        return (
          <FadeIn key={c.id} index={i}>
            <BurdenTile campaign={c} church={church} onOpen={() => navigate({ name: 'campaign', id: c.id })} />
          </FadeIn>
        )
      })}
    </div>
  )
}

// ─── Churches grid — tradition, trust, name, city ─────────────────────────────

function ChurchGrid({ items, navigate }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
      {items.map((ch, i) => (
        <FadeIn key={ch.id} index={i}>
          <Tile onClick={() => navigate({ name: 'discover' })} padding={20} style={{ gap: 12, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <Badge onNavy>{ch.tradition}</Badge>
              {ch.verified && <Badge onNavy>{ch.tier}</Badge>}
            </div>
            <div>
              <div style={{ fontFamily: font.sans, fontSize: type.lg.fontSize, fontWeight: 600, lineHeight: 1.25, color: tile.ink }}>
                {ch.name}
              </div>
              <div style={{ fontFamily: font.sans, fontSize: type.xs.fontSize, letterSpacing: '6%', textTransform: 'uppercase', color: tile.muted, marginTop: 8 }}>
                {ch.location}
              </div>
            </div>
          </Tile>
        </FadeIn>
      ))}
    </div>
  )
}

// ─── Events list — paper, not tiles (as in the app) ───────────────────────────

function EventList({ items }) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      {sorted.map(e => {
        const church = e.churchId ? churches.find(ch => ch.id === e.churchId) : null
        const d = new Date(e.date)
        const day = d.toLocaleDateString('en-GB', { day: '2-digit' })
        const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
        return (
          <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: 32, alignItems: 'baseline' }}>
            <div>
              <div style={{ fontFamily: font.sans, fontSize: type['2xl'].fontSize, fontWeight: 600, lineHeight: 1 }}>{day}</div>
              <div style={{ fontFamily: font.sans, fontSize: type.xs.fontSize, letterSpacing: '6%', color: colors.inkMuted, marginTop: 8 }}>{month}</div>
            </div>
            <div>
              <div style={{ fontFamily: font.sans, fontSize: type.base.fontSize, fontWeight: 600, marginBottom: 8 }}>{e.title}</div>
              <div style={{ fontFamily: font.sans, fontSize: type.xs.fontSize, letterSpacing: '6%', color: colors.inkMuted, marginBottom: 8 }}>
                {church ? church.name.toUpperCase() : 'BURDEN'} · {e.location.toUpperCase()}
              </div>
              <p style={{ fontFamily: font.sans, fontSize: type.sm.fontSize, lineHeight: type.sm.lineHeight, color: colors.inkSoft, maxWidth: 640, margin: 0 }}>
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
// spiritual-reward-for-giving language. Factual and invitational.

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
      <div className="invite-2" style={{ background: colors.bgAlt, padding: 32, borderRadius: 14 }}>
        <div>
          <Label>An invitation</Label>
          <h3 style={{
            fontFamily: font.sans,
            fontSize: type.xl.fontSize,
            lineHeight: type.xl.lineHeight,
            fontWeight: 600,
            letterSpacing: '-1%',
            margin: '8px 0 8px',
          }}>{heading}</h3>
          <p style={{ fontFamily: font.sans, fontSize: type.sm.fontSize, lineHeight: 1.65, color: colors.inkSoft, margin: 0, maxWidth: 560 }}>
            {body}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Cta onClick={() => navigate({ name: 'discover' })} primary>Browse burdens</Cta>
          <Cta onClick={() => navigate({ name: 'profile' })}>Your impact</Cta>
        </div>
      </div>
    </section>
  )
}
