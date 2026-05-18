import { colors, tile } from '../theme.js'
import { Label, Progress, Badge, Tile, FundingBanner, formatMoney } from '../components/UI.jsx'
import { campaigns, churches } from '../data/mock.js'

// Spree — editor-curated quick-give burdens for donors who'd rather not
// scroll the full Discover list. The curation rule is simple and
// transparent: every campaign that hasn't reached its goal, sorted by
// smallest remaining gap. A single gift visibly closes these out.

export default function Spree({ navigate, profile }) {
  const items = [...campaigns]
    .filter(c => c.raised < c.goal)
    .sort((a, b) => (a.goal - a.raised) - (b.goal - b.raised))

  const credit = profile?.creditBalance ?? 0
  const totalGap = items.reduce((s, c) => s + Math.max(0, c.goal - c.raised), 0)

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 28px 96px' }}>
      <Label>Spree</Label>
      <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: -0.5, marginTop: 14, marginBottom: 16 }}>
        Burdens closest to goal.
      </h1>
      <p style={{
        fontSize: 14,
        lineHeight: 1.65,
        color: colors.inkSoft,
        maxWidth: 720,
        marginTop: 0,
        marginBottom: 28,
      }}>
        A curated shortlist for donors who'd rather close out a few burdens than
        scroll the whole list. Each one shows the exact remaining amount — give
        the gap, or any part of it. {credit > 0
          ? `Your account credit of ${formatMoney(credit)} can pay for any of these.`
          : 'Top up account credit in your profile to give without re-entering a card.'}
      </p>

      {/* Summary strip — total open gap across the curated list */}
      <div style={{
        display: 'flex',
        gap: 32,
        alignItems: 'baseline',
        flexWrap: 'wrap',
        padding: '20px 0',
        borderTop: '1px solid ' + colors.rule,
        borderBottom: '1px solid ' + colors.rule,
        marginBottom: 36,
      }}>
        <div>
          <Label>Curated</Label>
          <div style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>
            {items.length} {items.length === 1 ? 'burden' : 'burdens'}
          </div>
        </div>
        <div>
          <Label>Total gap remaining</Label>
          <div style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>{formatMoney(totalGap)}</div>
        </div>
        {credit > 0 && (
          <div>
            <Label>Your credit</Label>
            <div style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>{formatMoney(credit)}</div>
          </div>
        )}
      </div>

      {/* Grid of spree tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20,
      }}>
        {items.map(c => (
          <SpreeCard
            key={c.id}
            campaign={c}
            navigate={navigate}
            creditCovers={credit >= (c.goal - c.raised) && (c.goal - c.raised) > 0}
          />
        ))}
        {items.length === 0 && (
          <div style={{
            padding: 36,
            color: colors.inkMuted,
            fontSize: 13,
            border: '1px solid ' + colors.ruleSoft,
            gridColumn: '1 / -1',
          }}>
            Every current burden is fully funded. Check Discover for what's coming next.
          </div>
        )}
      </div>
    </main>
  )
}

function SpreeCard({ campaign: c, navigate, creditCovers }) {
  const church = churches.find(ch => ch.id === c.churchId)
  const gap = Math.max(0, c.goal - c.raised)
  const pct = Math.round((c.raised / c.goal) * 100)
  return (
    <Tile
      onClick={() => navigate({ name: 'campaign', id: c.id })}
      padding={24}
      minHeight={320}
      style={{ gap: 14 }}
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
