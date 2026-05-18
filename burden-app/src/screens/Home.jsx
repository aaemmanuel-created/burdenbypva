import { useRef } from 'react'
import { colors, tile } from '../theme.js'
import { Label, Progress, Badge, Tile, FundingBanner, formatMoney } from '../components/UI.jsx'
import { campaigns, churches } from '../data/mock.js'

// Home — page 2 of the app (page 1 is the splash).
//
// Three section titles only, all Helvetica, not bold:
//   1. BURDEN OF THE WEEK — the editor's pick this week
//   2. BURDEN             — every verified burden, horizontally swipeable
//   3. SPREE              — editor-curated quick-give burdens close to goal
//
// "BURDEN by PVA" wordmark sits in the top-left corner via the global
// Header. Each section is a horizontal scroll-snap carousel — swipe on
// touch, arrow buttons on desktop. No church / event lists here; those
// live on Discover.

const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export default function Home({ navigate, profile }) {
  const highlight = campaigns.find(c => c.id === 'cmp_redeemer_clinic')
  const highlightChurch = churches.find(c => c.id === highlight.churchId)

  // SPREE — burdens whose remaining gap to goal is smallest. These are the
  // most rewarding quick-give targets: a single gift visibly closes them.
  // Editorial rule: must still be under 100% (skip already-funded ones).
  const sprees = [...campaigns]
    .filter(c => c.raised < c.goal)
    .sort((a, b) => (a.goal - a.raised) - (b.goal - b.raised))
    .slice(0, 4)

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '0 28px 96px' }}>
      <Section title="BURDEN OF THE WEEK">
        <HighlightCard campaign={highlight} church={highlightChurch} navigate={navigate} />
      </Section>

      <Section title="BURDEN" subtitle="Swipe →">
        <Carousel>
          {campaigns.map(c => (
            <CarouselItem key={c.id}>
              <CampaignCard campaign={c} navigate={navigate} />
            </CarouselItem>
          ))}
        </Carousel>
      </Section>

      <Section
        title="SPREE"
        subtitle={sprees.length === 1
          ? '1 burden close to goal — give the gap.'
          : `${sprees.length} burdens close to goal — give the gap.`}
      >
        <Carousel>
          {sprees.map(c => (
            <CarouselItem key={c.id}>
              <SpreeCard
                campaign={c}
                navigate={navigate}
                creditBalance={profile?.creditBalance ?? 0}
              />
            </CarouselItem>
          ))}
        </Carousel>
      </Section>
    </main>
  )
}

// ─── Section ─ Helvetica-titled block ────────────────────────────────────────

function Section({ title, subtitle, children }) {
  return (
    <section style={{ padding: '56px 0 8px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 22,
      }}>
        <h2 style={{
          fontFamily: HELVETICA,
          fontWeight: 300,
          fontSize: 'clamp(22px, 3.6vw, 34px)',
          letterSpacing: 0.5,
          color: colors.ink,
          margin: 0,
          lineHeight: 1.1,
        }}>{title}</h2>
        {subtitle && (
          <span style={{
            fontFamily: HELVETICA,
            fontWeight: 300,
            fontSize: 12,
            letterSpacing: 1,
            color: colors.inkMuted,
          }}>{subtitle}</span>
        )}
      </div>
      {children}
    </section>
  )
}

// ─── Carousel ─ horizontal scroll-snap row of fixed-width tiles ──────────────

function Carousel({ children }) {
  const ref = useRef(null)
  function scrollBy(dir) {
    const el = ref.current
    if (!el) return
    const step = Math.max(280, Math.round(el.clientWidth * 0.7))
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }
  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={ref}
        style={{
          display: 'flex',
          gap: 18,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: 18,
          // Hide native scrollbar on WebKit so the carousel reads as a swipe surface.
          scrollbarWidth: 'thin',
        }}
      >
        {children}
      </div>
      {/* Arrow buttons — keyboard / mouse users still get nudges */}
      <CarouselArrow direction="left" onClick={() => scrollBy(-1)} />
      <CarouselArrow direction="right" onClick={() => scrollBy(1)} />
    </div>
  )
}

function CarouselItem({ children }) {
  return (
    <div style={{
      flex: '0 0 320px',
      maxWidth: '85vw',
      scrollSnapAlign: 'start',
      display: 'flex',
    }}>
      {children}
    </div>
  )
}

function CarouselArrow({ direction, onClick }) {
  const isLeft = direction === 'left'
  return (
    <button
      onClick={onClick}
      aria-label={isLeft ? 'Scroll left' : 'Scroll right'}
      style={{
        position: 'absolute',
        top: '50%',
        [isLeft ? 'left' : 'right']: -8,
        transform: 'translateY(-50%)',
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '1px solid ' + colors.rule,
        background: colors.bg,
        cursor: 'pointer',
        fontSize: 16,
        color: colors.ink,
        boxShadow: '0 4px 12px -4px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >{isLeft ? '←' : '→'}</button>
  )
}

// ─── Highlight of the week — single full-width glassy navy card ──────────────

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

      <h3 style={{
        fontSize: 'clamp(22px, 4vw, 32px)',
        fontWeight: 400,
        lineHeight: 1.15,
        letterSpacing: -0.5,
        color: tile.ink,
        margin: 0,
      }}>{campaign.title}</h3>

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

// ─── Standard burden card — used in the BURDEN carousel ──────────────────────

function CampaignCard({ campaign: c, navigate }) {
  const church = churches.find(ch => ch.id === c.churchId)
  const pct = Math.round((c.raised / c.goal) * 100)
  return (
    <Tile
      onClick={() => navigate({ name: 'campaign', id: c.id })}
      padding={24}
      minHeight={320}
      style={{ gap: 14, width: '100%' }}
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
}

// ─── Spree card — surfaces the gap to goal as the action ─────────────────────
//
// On a spree the donor wants to close gaps quickly. So the card foregrounds
// the remaining amount and offers a one-tap "Give the gap" button — which
// pre-fills the give form with the exact close-out amount. If the donor has
// account credit, the button hints that it can pay from credit.

function SpreeCard({ campaign: c, navigate, creditBalance }) {
  const church = churches.find(ch => ch.id === c.churchId)
  const gap = Math.max(0, c.goal - c.raised)
  const pct = Math.round((c.raised / c.goal) * 100)
  const creditCovers = creditBalance >= gap && gap > 0
  return (
    <Tile
      onClick={() => navigate({ name: 'campaign', id: c.id })}
      padding={24}
      minHeight={320}
      style={{ gap: 14, width: '100%' }}
    >
      <FundingBanner raised={c.raised} goal={c.goal} />

      <Label onNavy>{c.category} · Close-out</Label>

      <div>
        <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.3, color: tile.ink }}>{c.title}</div>
        <div style={{ fontSize: 11, color: tile.muted, letterSpacing: 1, marginTop: 6 }}>
          {church.name} — {church.location}
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.14)',
        padding: '12px 14px',
        borderRadius: 8,
      }}>
        <Label onNavy>Remaining to goal</Label>
        <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6, color: tile.ink }}>
          {formatMoney(gap)}
        </div>
        <div style={{ fontSize: 10, color: tile.muted, letterSpacing: 1, marginTop: 4 }}>
          {pct}% funded · {c.donors} donors · {c.daysLeft}d left
        </div>
      </div>

      <Progress value={c.raised} goal={c.goal} onNavy />

      <button
        onClick={(e) => { e.stopPropagation(); navigate({ name: 'give', id: c.id }) }}
        style={{
          marginTop: 'auto',
          alignSelf: 'stretch',
          padding: '12px 18px',
          background: '#fff',
          color: colors.navyDeep,
          border: 'none',
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          fontWeight: 600,
          borderRadius: 999,
          cursor: 'pointer',
          boxShadow: '0 6px 14px -6px rgba(0,0,0,0.55)',
        }}
      >Give the gap{creditCovers ? ' · from credit' : ''}</button>
    </Tile>
  )
}
