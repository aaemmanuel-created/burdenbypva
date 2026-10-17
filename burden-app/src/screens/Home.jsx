import { colors, tile, font, type } from '../theme.js'
import { Label, Progress, Badge, Tile, FundingBanner, formatMoney } from '../components/UI.jsx'
import DailyReading from '../components/DailyReading.jsx'
import { useParallax, FadeIn } from '../lib/motion.jsx'
import { campaigns, churches, events } from '../data/mock.js'

// The home screen is a curated feed in five sections:
//   1. Welcome paragraph   — sentence-like introduction (anchored centre-left)
//   2. Burden of the week  — one prominently featured burden, the week's pick
//   3. Burdens             — every verified burden currently raising
//   4. Churches            — verified congregations and institutions
//   5. Events              — upcoming services, outreach, town halls
// …closed by <DailyReading /> — the day's passage, whitespace only.
//
// Overhaul pass (§3–§6): sections are separated by WHITESPACE, not rules —
// 128px after the burden of the week, 96px between grids; section label to
// content is 48px; card gap 24px. The hero card drifts on scroll (0.85×,
// capped 80px); grid cards fade in staggered. "Burdens" are the user-facing
// name for what the data model calls "campaigns" (specific, time-bound,
// crowdfunded projects owned by a verified church — never general tithing).

export default function Home({ navigate, profile }) {
  // Weekly highlight — picked editorially. For the demo it's the Lagos
  // medical outreach: Premium-Trust church, large donor base, high urgency.
  const highlight = campaigns.find(c => c.id === 'cmp_redeemer_clinic')
  const highlightChurch = churches.find(c => c.id === highlight.churchId)

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px' }}>
      <Welcome navigate={navigate} profile={profile} />

      <SectionTitle
        label="Burden of the week"
        sublabel="Pick the burden you want to carry before the Lord."
      />
      <HighlightCard campaign={highlight} church={highlightChurch} navigate={navigate} />

      {/* §3: 128px between the burden of the week and the next section */}
      <div style={{ height: 128 }} aria-hidden />

      <SectionTitle label="Burdens" cta="See all" onCta={() => navigate({ name: 'discover' })} spacer={0} />
      <CampaignGrid items={campaigns} navigate={navigate} />

      <Invitation navigate={navigate} profile={profile} />

      <div style={{ height: 96 }} aria-hidden />

      <SectionTitle label="Churches" cta="See all" onCta={() => navigate({ name: 'discover' })} spacer={0} />
      <ChurchGrid items={churches} navigate={navigate} />

      <div style={{ height: 96 }} aria-hidden />

      <SectionTitle label="Events" spacer={0} />
      <EventList items={events} />

      <DailyReading />
    </main>
  )
}

// ─── Welcome — sentence-like intro, anchored centre-left ─────────────────────
//
// §3: 96px top, 64px bottom on the hero section. The lead paragraph is the
// display serif at the hero step of the scale.

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
        fontFamily: font.serif,
        fontSize: `clamp(${type.xl.fontSize}px, 3vw, ${type['2xl'].fontSize}px)`,
        lineHeight: type['2xl'].lineHeight,
        fontWeight: 400,
        letterSpacing: '-1.5%',
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
        borderRadius: 999,
      }}
    >{children}</button>
  )
}

// ─── Section title with optional CTA ──────────────────────────────────────────
//
// §2: section labels move to the display serif at text-2xl alongside the
// small uppercase kicker. §3: label block sits 48px above its content.

function SectionTitle({ label, sublabel, cta, onCta, spacer = 0 }) {
  return (
    <div style={{ paddingTop: spacer, paddingBottom: 48 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 24,
      }}>
        <h2 style={{
          fontFamily: font.serif,
          fontSize: type['2xl'].fontSize,
          lineHeight: type['2xl'].lineHeight,
          letterSpacing: '-1.5%',
          fontWeight: 600,
          color: colors.ink,
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
          marginTop: 16,
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

// ─── Highlight of the week — single large glassy navy card ────────────────────
//
// §5(a): the card drifts upward at 0.85× scroll speed, capped at 80px.
// §4: this is the ONE card allowed a border.

function HighlightCard({ campaign, church, navigate }) {
  const pct = Math.round((campaign.raised / campaign.goal) * 100)
  const parallaxRef = useParallax()
  return (
    <div ref={parallaxRef} style={{ willChange: 'transform' }}>
      <Tile
        onClick={() => navigate({ name: 'campaign', id: campaign.id })}
        padding={32}
        style={{ gap: 16 }}
      >
        <FundingBanner raised={campaign.raised} goal={campaign.goal} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <Label onNavy>{campaign.category}</Label>
          {church.verified && <Badge tone="trust" onNavy>{church.tier}</Badge>}
        </div>

        <h2 style={{
          fontFamily: font.serif,
          fontSize: `clamp(${type.xl.fontSize}px, 4vw, ${type['3xl'].fontSize}px)`,
          fontWeight: 600,
          lineHeight: type['3xl'].lineHeight,
          letterSpacing: '-1.5%',
          color: tile.ink,
          margin: 0,
        }}>{campaign.title}</h2>

        <div style={{ fontFamily: font.sans, fontSize: type.sm.fontSize, color: tile.muted }}>
          {church.name} — {church.location}
        </div>

        <p style={{
          fontFamily: font.sans,
          fontSize: type.lg.fontSize,
          lineHeight: type.lg.lineHeight,
          color: tile.soft, maxWidth: 640, margin: 0,
        }}>
          {campaign.summary}
        </p>

        <div style={{ display: 'flex', gap: 32, alignItems: 'baseline', flexWrap: 'wrap', marginTop: 8 }}>
          <Stat label="Raised" value={formatMoney(campaign.raised)} />
          <Stat label="Goal"   value={formatMoney(campaign.goal)} />
          <Stat label="Donors" value={String(campaign.donors)} />
        </div>

        <div style={{ marginTop: 8 }}>
          <Progress value={campaign.raised} goal={campaign.goal} onNavy />
          <div style={{
            marginTop: 8,
            fontFamily: font.sans,
            fontSize: type.xs.fontSize,
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
          padding: '16px 24px',
          border: '1px solid rgba(255,255,255,0.55)',
          background: '#fff',
          color: colors.navyDeep,
          fontFamily: font.sans,
          fontSize: type.xs.fontSize,
          letterSpacing: '6%',
          textTransform: 'uppercase',
          fontWeight: 600,
          borderRadius: 999,
          boxShadow: '0 6px 14px -6px rgba(0,0,0,0.55)',
        }}>View burden →</div>
      </Tile>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <Label onNavy>{label}</Label>
      <div style={{
        fontFamily: font.sans,
        fontSize: type.xl.fontSize,
        fontWeight: 500, marginTop: 4, color: tile.ink,
      }}>{value}</div>
    </div>
  )
}

// ─── Burdens grid ─────────────────────────────────────────────────────────────
//
// §5(b): cards fade in on first appearance — 400ms ease-out, 60ms stagger.
// §3: 24px card gap, 32px internal card padding.

function CampaignGrid({ items, navigate }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 24,
    }}>
      {items.map((c, i) => {
        const church = churches.find(ch => ch.id === c.churchId)
        const pct = Math.round((c.raised / c.goal) * 100)
        return (
          <FadeIn key={c.id} index={i}>
            <Tile
              onClick={() => navigate({ name: 'campaign', id: c.id })}
              padding={32}
              minHeight={300}
              style={{ gap: 16, flex: 1 }}
            >
              <FundingBanner raised={c.raised} goal={c.goal} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Label onNavy>{c.category}</Label>
                {church.verified && <Badge tone="trust" onNavy>Verified</Badge>}
              </div>

              <div>
                <div style={{
                  fontFamily: font.serif,
                  fontSize: type.lg.fontSize,
                  fontWeight: 600, lineHeight: 1.3, color: tile.ink,
                }}>{c.title}</div>
                <div style={{ fontFamily: font.sans, fontSize: type.xs.fontSize, color: tile.muted, marginTop: 8 }}>
                  {church.name} — {church.location}
                </div>
              </div>

              <p style={{
                fontFamily: font.sans,
                fontSize: type.sm.fontSize,
                lineHeight: type.sm.lineHeight,
                color: tile.soft, flex: 1, margin: 0,
              }}>
                {c.summary}
              </p>

              <div>
                <Progress value={c.raised} goal={c.goal} onNavy />
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginTop: 8,
                  fontFamily: font.sans,
                  fontSize: type.xs.fontSize, color: tile.soft,
                }}>
                  <span>{pct}% — {c.donors} donors</span>
                  <span>{c.daysLeft}d left</span>
                </div>
              </div>
            </Tile>
          </FadeIn>
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
      gap: 24,
    }}>
      {items.map((ch, i) => (
        <FadeIn key={ch.id} index={i}>
          <Tile
            onClick={() => navigate({ name: 'discover' })}
            padding={32}
            minHeight={220}
            style={{ gap: 16, flex: 1 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Label onNavy>{ch.tradition}</Label>
              {ch.verified && <Badge tone="trust" onNavy>{ch.tier}</Badge>}
            </div>

            <div>
              <div style={{
                fontFamily: font.serif,
                fontSize: type.lg.fontSize,
                fontWeight: 600, lineHeight: 1.3, color: tile.ink,
              }}>{ch.name}</div>
              <div style={{ fontFamily: font.sans, fontSize: type.xs.fontSize, color: tile.muted, marginTop: 8 }}>
                {ch.location} · est. {ch.founded}
              </div>
            </div>

            <p style={{
              fontFamily: font.sans,
              fontSize: type.sm.fontSize,
              lineHeight: type.sm.lineHeight,
              color: tile.soft, flex: 1, margin: 0,
            }}>
              {ch.summary}
            </p>

            <div style={{ fontFamily: font.sans, fontSize: type.xs.fontSize, letterSpacing: '6%', color: tile.muted }}>
              {ch.members.toLocaleString()} members
            </div>
          </Tile>
        </FadeIn>
      ))}
    </div>
  )
}

// ─── Events list ──────────────────────────────────────────────────────────────
//
// §4: the per-row hairlines are gone — 48px of whitespace separates events.

function EventList({ items }) {
  // Sort ascending — soonest event first.
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      {sorted.map(e => {
        const church = e.churchId ? churches.find(ch => ch.id === e.churchId) : null
        const d = new Date(e.date)
        const day = d.toLocaleDateString('en-GB', { day: '2-digit' })
        const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
        return (
          <div key={e.id} style={{
            display: 'grid',
            gridTemplateColumns: '96px 1fr auto',
            gap: 32,
            alignItems: 'baseline',
          }}>
            <div>
              <div style={{
                fontFamily: font.serif,
                fontSize: type['2xl'].fontSize,
                fontWeight: 600, lineHeight: 1,
              }}>{day}</div>
              <div style={{
                fontFamily: font.sans,
                fontSize: type.xs.fontSize, letterSpacing: '6%',
                color: colors.inkMuted, marginTop: 8,
              }}>{month}</div>
            </div>

            <div>
              <div style={{
                fontFamily: font.sans,
                fontSize: type.base.fontSize,
                fontWeight: 500, marginBottom: 8,
              }}>{e.title}</div>
              <div style={{
                fontFamily: font.sans,
                fontSize: type.xs.fontSize, letterSpacing: '6%',
                color: colors.inkMuted, marginBottom: 8,
              }}>
                {church ? church.name.toUpperCase() : 'BURDEN'} · {e.location.toUpperCase()}
              </div>
              <p style={{
                fontFamily: font.sans,
                fontSize: type.sm.fontSize,
                lineHeight: type.sm.lineHeight,
                color: colors.inkSoft, maxWidth: 640,
              }}>
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
        padding: 32,
        borderRadius: 8,
      }}>
        <div>
          <Label>An invitation</Label>
          <h3 style={{
            fontFamily: font.serif,
            fontSize: type.xl.fontSize,
            lineHeight: type.xl.lineHeight,
            fontWeight: 600,
            letterSpacing: '-1.5%',
            margin: '8px 0 8px',
          }}>{heading}</h3>
          <p style={{
            fontFamily: font.sans,
            fontSize: type.sm.fontSize,
            lineHeight: 1.65,
            color: colors.inkSoft, margin: 0, maxWidth: 560,
          }}>
            {body}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <CtaPill onClick={() => navigate({ name: 'discover' })} primary>Browse burdens</CtaPill>
          <CtaPill onClick={() => navigate({ name: 'profile' })}>Your impact</CtaPill>
        </div>
      </div>
    </section>
  )
}
