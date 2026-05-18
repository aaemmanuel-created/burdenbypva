import { useState, useMemo } from 'react'
import { colors, tile } from '../theme.js'
import { Label, Rule, Tile, Badge, Progress, FundingBanner, formatMoney } from '../components/UI.jsx'
import { campaigns, churches } from '../data/mock.js'

// Profile — the donor's account on BURDEN.
// Three sections:
//   1. Identity      — name + a quiet line about what BURDEN holds for them
//   2. Account credit — top up a balance, give from it without re-entering a card
//   3. Your giving   — impact totals + a breakdown of where their money has gone
//
// Brand guardrails (CLAUDE.md): no urgency exploitation, no
// spiritual-reward-for-giving language. Everything here is factual.

const CREDIT_PRESETS = [25, 50, 100, 250]

export default function Profile({ profile, navigate, addCredit, updateName }) {
  const [amount, setAmount] = useState(50)
  const [custom, setCustom] = useState('')
  const [pendingName, setPendingName] = useState(profile?.name || '')
  const [savedName, setSavedName] = useState(false)

  const gifts = profile?.gifts ?? []
  const lifetime = gifts.reduce((s, g) => s + g.amount, 0)
  const credit = profile?.creditBalance ?? 0

  // Per-burden allocation — sum every gift grouped by campaign.
  const allocation = useMemo(() => {
    const map = new Map()
    for (const g of gifts) {
      const cur = map.get(g.campaignId) || { total: 0, count: 0 }
      cur.total += g.amount
      cur.count += 1
      map.set(g.campaignId, cur)
    }
    return Array.from(map.entries()).map(([campaignId, agg]) => {
      const camp = campaigns.find(c => c.id === campaignId)
      const ch = camp ? churches.find(x => x.id === camp.churchId) : null
      return { campaign: camp, church: ch, total: agg.total, count: agg.count }
    }).filter(x => x.campaign).sort((a, b) => b.total - a.total)
  }, [gifts])

  // Country distribution — where in the world this donor's money has gone.
  const countries = useMemo(() => {
    const map = new Map()
    for (const row of allocation) {
      const co = (row.church?.location || '').split(',').slice(-1)[0].trim()
      if (!co) continue
      map.set(co, (map.get(co) || 0) + row.total)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [allocation])

  const value = custom !== '' ? Number(custom) || 0 : amount
  const canAdd = value >= 1

  function handleTopUp(e) {
    e.preventDefault()
    if (!canAdd) return
    addCredit(value)
    setCustom('')
    setAmount(50)
  }

  function handleSaveName(e) {
    e.preventDefault()
    updateName(pendingName.trim())
    setSavedName(true)
    setTimeout(() => setSavedName(false), 1800)
  }

  return (
    <main style={{ maxWidth: 1020, margin: '0 auto', padding: '64px 28px 96px' }}>
      <Label>Profile</Label>
      <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: -0.5, marginTop: 14, marginBottom: 36 }}>
        Your account on BURDEN.
      </h1>

      {/* Identity + Credit — side by side on wide screens */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        marginBottom: 28,
      }}>
        {/* Identity card */}
        <Tile flat as="div" padding={28} style={{ gap: 16 }}>
          <Label onNavy>Identity</Label>
          <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="text"
              placeholder="Your name"
              value={pendingName}
              onChange={e => setPendingName(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: tile.ink,
                padding: '14px 16px',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                borderRadius: 4,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="submit"
                style={{
                  padding: '10px 18px',
                  background: '#fff',
                  color: colors.navyDeep,
                  border: 'none',
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  borderRadius: 999,
                  cursor: 'pointer',
                }}
              >Save name</button>
              {savedName && <span style={{ fontSize: 11, color: '#7ec48a', letterSpacing: 1 }}>Saved.</span>}
            </div>
          </form>
          <p style={{ fontSize: 12, color: tile.muted, lineHeight: 1.6, margin: 0 }}>
            Your name shows on receipts and (unless you mark a gift anonymous)
            to the church receiving it. BURDEN does not share your email.
          </p>
        </Tile>

        {/* Credit card */}
        <Tile flat as="div" padding={28} style={{ gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Label onNavy>Account credit</Label>
            <Badge tone="trust" onNavy>Held in escrow</Badge>
          </div>
          <div style={{ fontSize: 34, fontWeight: 500, color: tile.ink, lineHeight: 1 }}>
            {formatMoney(credit)}
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.6, color: tile.soft, margin: 0 }}>
            Top up once, give to as many burdens as you like without re-entering
            a card. Balance stays in BURDEN escrow until you direct it to a
            burden — withdraw any unused balance any time.
          </p>

          <form onSubmit={handleTopUp} style={{ marginTop: 4 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 6,
              marginBottom: 10,
            }}>
              {CREDIT_PRESETS.map(p => {
                const active = custom === '' && amount === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setAmount(p); setCustom('') }}
                    style={{
                      padding: '12px 0',
                      background: active ? '#fff' : 'rgba(255,255,255,0.06)',
                      color: active ? colors.navyDeep : tile.ink,
                      border: '1px solid ' + (active ? '#fff' : 'rgba(255,255,255,0.18)'),
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >${p}</button>
                )
              })}
            </div>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Custom amount (min $1)"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: tile.ink,
                fontSize: 13,
                outline: 'none',
                marginBottom: 10,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                borderRadius: 4,
              }}
            />
            <button
              type="submit"
              disabled={!canAdd}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: canAdd ? '#fff' : 'rgba(255,255,255,0.20)',
                color: canAdd ? colors.navyDeep : 'rgba(255,255,255,0.55)',
                border: 'none',
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontWeight: 600,
                borderRadius: 999,
                cursor: canAdd ? 'pointer' : 'not-allowed',
              }}
            >Add {formatMoney(value)} credit</button>
            <p style={{ marginTop: 10, fontSize: 10, color: tile.muted, lineHeight: 1.6, letterSpacing: 0.3 }}>
              Demo top-up — no payment is processed.
            </p>
          </form>
        </Tile>
      </div>

      {/* Impact summary — gentle, factual, no urgency */}
      <ImpactSummary
        lifetime={lifetime}
        giftCount={gifts.length}
        burdens={allocation.length}
        countries={countries.length}
        navigate={navigate}
      />

      <div style={{ height: 40 }} />

      {/* Where your giving has gone */}
      <Label>Where your giving has gone</Label>
      <h2 style={{
        fontSize: 24,
        fontWeight: 400,
        letterSpacing: -0.3,
        margin: '12px 0 24px',
      }}>
        {allocation.length === 0
          ? 'No gifts yet.'
          : `${allocation.length} ${allocation.length === 1 ? 'burden' : 'burdens'} supported across ${countries.length} ${countries.length === 1 ? 'country' : 'countries'}.`}
      </h2>

      {allocation.length === 0 ? (
        <Tile flat as="div" padding={36} style={{ alignItems: 'flex-start', gap: 16 }}>
          <p style={{ fontSize: 13, color: tile.soft, margin: 0, maxWidth: 540 }}>
            When you give to a burden, your gift shows here with the church it
            went to and how it stacks up against the goal. Every gift is
            tracked end to end.
          </p>
          <button
            onClick={() => navigate({ name: 'discover' })}
            style={{
              padding: '12px 22px',
              background: '#fff',
              color: colors.navyDeep,
              border: 'none',
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontWeight: 600,
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >Browse burdens</button>
        </Tile>
      ) : (
        <>
          {countries.length > 0 && (
            <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}>
              {countries.map(([co, total]) => (
                <span
                  key={co}
                  style={{
                    padding: '8px 14px',
                    border: '1px solid ' + colors.rule,
                    fontSize: 11,
                    letterSpacing: 1,
                    color: colors.ink,
                    background: colors.bgAlt,
                    borderRadius: 999,
                  }}
                >{co} · {formatMoney(total)}</span>
              ))}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}>
            {allocation.map(({ campaign, church, total, count }) => {
              const pct = Math.round((campaign.raised / campaign.goal) * 100)
              return (
                <Tile
                  key={campaign.id}
                  onClick={() => navigate({ name: 'campaign', id: campaign.id })}
                  padding={24}
                  minHeight={280}
                  style={{ gap: 14 }}
                >
                  <FundingBanner raised={campaign.raised} goal={campaign.goal} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Label onNavy>You gave</Label>
                    <div style={{ fontSize: 18, fontWeight: 600, color: tile.ink }}>
                      {formatMoney(total)}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: tile.muted, letterSpacing: 1 }}>
                    across {count} {count === 1 ? 'gift' : 'gifts'}
                  </div>

                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.3, color: tile.ink }}>
                      {campaign.title}
                    </div>
                    <div style={{ fontSize: 11, color: tile.muted, letterSpacing: 1, marginTop: 6 }}>
                      {church.name} — {church.location}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <Progress value={campaign.raised} goal={campaign.goal} onNavy />
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginTop: 10, fontSize: 10, letterSpacing: 1, color: tile.soft,
                    }}>
                      <span>{pct}% — {campaign.donors} donors</span>
                      <span>{campaign.daysLeft}d left</span>
                    </div>
                  </div>
                </Tile>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}

// ─── ImpactSummary — gentle, factual nudge to give again ────────────────────
//
// Shows what the donor's giving has already moved, then suggests a
// concrete next step (top up account credit, browse another burden).
// No urgency, no spiritual-reward language.

function ImpactSummary({ lifetime, giftCount, burdens, countries, navigate }) {
  const headline = giftCount === 0
    ? 'Your impact starts with one gift.'
    : `${formatMoney(lifetime)} given across ${burdens} ${burdens === 1 ? 'burden' : 'burdens'}.`
  const sub = giftCount === 0
    ? 'When you give, this is where you will see what your money has touched — itemised, by burden and by country.'
    : `Reaching ${countries} ${countries === 1 ? 'country' : 'countries'} so far. If one more burden is on your heart, your account credit makes giving frictionless next time.`

  return (
    <section style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: 16,
      padding: 28,
      background: colors.bgAlt,
      border: '1px solid ' + colors.ruleSoft,
      borderRadius: 8,
    }}>
      <Label>Your impact</Label>
      <h3 style={{
        fontSize: 'clamp(20px, 2.4vw, 26px)',
        fontWeight: 400,
        letterSpacing: -0.3,
        margin: 0,
        lineHeight: 1.25,
      }}>{headline}</h3>
      <p style={{ fontSize: 13, lineHeight: 1.65, color: colors.inkSoft, margin: 0, maxWidth: 640 }}>
        {sub}
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
        <button
          onClick={() => navigate({ name: 'discover' })}
          style={{
            padding: '12px 20px',
            background: colors.ink,
            color: colors.accentInk,
            border: '1px solid ' + colors.rule,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontWeight: 500,
            cursor: 'pointer',
            borderRadius: 999,
          }}
        >Browse burdens</button>
        <button
          onClick={() => navigate({ name: 'history' })}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            color: colors.ink,
            border: '1px solid ' + colors.rule,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontWeight: 500,
            cursor: 'pointer',
            borderRadius: 999,
          }}
        >Giving history</button>
      </div>
    </section>
  )
}
