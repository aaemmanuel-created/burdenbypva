import { useEffect, useRef, useState } from 'react'
import { colors, tile, font, type } from '../theme.js'
import { Button, Label, Rule, Progress, Badge, Tile, FundingSquare, formatMoney } from '../components/UI.jsx'
import { FundraisersSection, ShareSheet, SupportSection, UpdatesSection } from '../components/Community.jsx'
import { findFundraiser, fundraisersFor, supportFor, updatesFor } from '../lib/community.js'
import { campaigns, churches } from '../data/mock.js'

// Burden detail. The user-facing word is "burden" — the data model still
// calls these "campaigns" internally. Every burden surfaces five things
// that distinguish BURDEN from a generic tithing platform:
//   1. Objective    — what specifically this burden achieves
//   2. State        — where things stand right now
//   3. Team         — who is responsible for what
//   4. Money flow   — how funds get from donor to delivery
//   5. Prayer group — donors can pray specifically, not just give
// and, alongside them, the community pieces: Updates from the team, Words
// of support from givers, Fundraisers carrying it with others, and Share.

export default function Campaign({ id, navigate, joined, onTogglePrayer, gifts = [], fundraisers = [], fundraiserId }) {
  const [sharing, setSharing] = useState(false)
  const fundraisersRef = useRef(null)
  // A shared fundraiser link lands on that fundraiser.
  useEffect(() => {
    if (fundraiserId) fundraisersRef.current?.scrollIntoView({ block: 'center' })
  }, [fundraiserId])
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
  const updates = updatesFor(burden.id)
  const words = supportFor(burden.id, gifts)
  const carrying = fundraisersFor(burden.id, fundraisers, gifts)
  const sharedFundraiser = findFundraiser(fundraiserId, fundraisers)

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
          fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
          color: colors.inkSoft, marginBottom: 32,
        }}
      >← Discover</button>

      <div className="split-2">
        {/* Left — content */}
        <div>
          {/* Category and trust side by side at the top, as in the app */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge>{burden.category}</Badge>
            {church.verified && <Badge tone="trust">{church.tier}</Badge>}
          </div>
          <h1 style={{
            fontFamily: font.sans,
            fontSize: 'clamp(28px, 4.5vw, 40px)',
            fontWeight: 400,
            lineHeight: 1.2,
            letterSpacing: '-1%',
            marginTop: 16,
            marginBottom: 16,
          }}>{burden.title}</h1>

          {/* Church, with its city and country beneath */}
          <div style={{ marginBottom: 32, lineHeight: 1.5 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>{church.name}</div>
            <div style={{ fontSize: 13, color: colors.inkSoft }}>{church.location}</div>
          </div>

          <Rule soft />

          {/* About — four lines at most; the detail follows below */}
          <section style={{ padding: '32px 0' }}>
            <Label>About this burden</Label>
            <p style={{
              marginTop: 14, fontSize: 14, lineHeight: 1.75, color: colors.inkSoft,
              display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {burden.summary} Funds go straight to the church's verified payout account, with a public update every month.
            </p>
          </section>

          <Rule soft />

          {/* Updates — dated posts from the team */}
          <section style={{ padding: '32px 0' }}>
            <UpdatesSection updates={updates} />
          </section>

          <Rule soft />

          {/* Profiles — the people carrying this burden */}
          <section style={{ padding: '32px 0' }}>
            <Label>Profiles</Label>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingTop: 16, paddingBottom: 4 }}>
              {burden.team.map(member => <ProfileTile key={member.role} member={member} />)}
            </div>
          </section>

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
                    fontSize: 12, letterSpacing: 1, color: colors.inkMuted,
                  }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.65, color: colors.ink }}>{step}</span>
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

          {/* Words of support — from givers, never with the amount */}
          <section style={{ padding: '32px 0' }}>
            <SupportSection words={words} onGive={() => navigate({ name: 'give', id: burden.id })} />
          </section>

          <Rule soft />

          {/* Fundraisers — people carrying it with their own circle */}
          <section ref={fundraisersRef} style={{ padding: '32px 0' }}>
            <FundraisersSection
              fundraisers={carrying}
              highlightId={fundraiserId}
              onGiveThrough={f => navigate({ name: 'give', id: burden.id, fundraiserId: f.id })}
              onStart={() => navigate({ name: 'fundraise', id: burden.id })}
            />
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
                  <span style={{ fontSize: 14, color: colors.ink }}>{it.label}</span>
                  <span style={{
                    fontSize: 12,
                    color: colors.inkSoft,
                    letterSpacing: 1,
                    fontWeight: 500,
                  }}>{(it.share * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 18, fontSize: 12, color: colors.inkMuted, lineHeight: 1.6 }}>
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
        <aside>
          <Tile flat as="div" padding={24} style={{ gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Label onNavy>Funding</Label>
              <FundingSquare raised={burden.raised} goal={burden.goal} size={18} />
            </div>

            <Progress value={burden.raised} goal={burden.goal} onNavy />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 500, color: tile.ink }}>
                  {formatMoney(burden.raised)}
                </div>
                <div style={{ fontSize: 12, color: tile.muted, letterSpacing: 1, marginTop: 4 }}>
                  of {formatMoney(burden.goal)} ({pct}%)
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: tile.ink }}>{burden.donors}</div>
                <div style={{ fontSize: 12, color: tile.muted, letterSpacing: 1, marginTop: 4 }}>
                  donors
                </div>
              </div>
            </div>

            <Button variant="onNavy" full onClick={() => navigate({ name: 'give', id: burden.id, fundraiserId: sharedFundraiser?.id })}>
              {sharedFundraiser ? `Give through ${sharedFundraiser.own ? 'your page' : sharedFundraiser.name.split(' ')[0]}` : 'Carry this burden — give'}
            </Button>
            <button onClick={() => setSharing(true)} style={{
              width: '100%', padding: '14px 24px', borderRadius: 10, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.55)', color: tile.ink,
              fontSize: type.xs.fontSize, letterSpacing: '6%', textTransform: 'uppercase', fontWeight: 600,
            }}>Share</button>

            <p style={{ marginTop: 4, fontSize: 12, color: tile.muted, lineHeight: 1.6, letterSpacing: 0.3 }}>
              Minimum gift: $1 USD or local equivalent. Receipt issued automatically.
              Anonymous and recurring options available at checkout.
            </p>
          </Tile>
        </aside>
      </div>
      <ShareSheet
        open={sharing}
        onClose={() => setSharing(false)}
        campaign={burden}
        church={church}
        fundraiser={sharedFundraiser}
        onFundraise={() => navigate({ name: 'fundraise', id: burden.id })}
        onPoster={() => navigate({ name: 'poster', id: burden.id, fundraiserId: sharedFundraiser?.id })}
      />
    </main>
  )
}

// One person on the burden's team. Their face photo fills the top; until the
// church sends one, their initials stand in.
function ProfileTile({ member }) {
  const initials = member.name
    .replace(/\(.*?\)|,.*$/g, '')
    .split(/\s+/)
    .filter(w => /^[A-Z]/.test(w) && !/^(Rev|Dr|Mr|Mrs|Ms|Pastor|Engr|Teacher|Auntie)\.?$/.test(w))
    .slice(0, 2)
    .map(w => w[0])
    .join('')
  return (
    <Tile flat as="div" padding={0} style={{ width: 150, flex: '0 0 150px' }} ariaLabel={`${member.name}, ${member.role}`}>
      <div style={{
        height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.12)',
      }}>
        {member.photo
          ? <img src={member.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: 2, color: tile.ink }}>{initials || '·'}</span>}
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 13, lineHeight: 1.3, fontWeight: 600, color: tile.ink }}>{member.name}</div>
        <div style={{ fontSize: 9, letterSpacing: 1, lineHeight: 1.4, textTransform: 'uppercase', color: tile.muted }}>{member.role}</div>
      </div>
    </Tile>
  )
}

function PrayerGroup({ burden, joined, onToggle }) {
  const memberCount = burden.prayerGroup.members + (joined ? 1 : 0)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Label>Prayer group</Label>
        <span style={{ fontSize: 12, letterSpacing: 1, color: colors.inkMuted }}>
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
