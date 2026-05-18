import { useRef } from 'react'
import { colors, tile } from '../theme.js'
import { Label, Progress, Tile, FundingBanner, formatMoney } from '../components/UI.jsx'
import { campaigns, churches } from '../data/mock.js'

// Spree — two stacked sections:
//
//   1. The Deck   — a horizontal swipe carousel of the editor's seven
//                   spree picks (the closest-to-goal burdens). Just
//                   scroll through them like a deck of cards; no
//                   accept / reject mechanics.
//   2. All burdens — a vertical grid of every burden BURDEN is
//                   tracking right now, funded or not, so a donor on
//                   a spree can keep going past the curated seven.
//
// Funded burdens stay visible in the bottom list with a "Fully funded"
// state instead of a give button — they aren't actionable here.

const DECK_SIZE = 7

export default function Spree({ navigate, profile }) {
  const credit = profile?.creditBalance ?? 0

  // Curated deck: smallest absolute gap to goal first, capped at 7.
  // We exclude already-funded burdens from the deck — the deck is
  // about quick close-out wins.
  const deck = [...campaigns]
    .filter(c => c.raised < c.goal)
    .sort((a, b) => (a.goal - a.raised) - (b.goal - b.raised))
    .slice(0, DECK_SIZE)

  // Full list: every burden, in a stable order (preserve mock order).
  const allBurdens = [...campaigns]

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 28px 96px' }}>

      {/* ── Intro ─────────────────────────────────────────────────────────── */}
      <Label>Spree</Label>
      <h1 style={{ fontSize: 32, fontWeight: 300, letterSpacing: -0.5, marginTop: 12, marginBottom: 14 }}>
        Carry several burdens in one sitting.
      </h1>
      <p style={{
        fontSize: 14, lineHeight: 1.65, color: colors.inkSoft,
        maxWidth: 720, marginTop: 0, marginBottom: 28,
      }}>
        The deck below is a shortlist of {deck.length} {deck.length === 1 ? 'burden' : 'burdens'} closest to
        their goal — swipe through and give the gap. The full list of every burden BURDEN is
        tracking follows underneath. {credit > 0
          ? `Your account credit of ${formatMoney(credit)} can cover any close-out gift without re-entering a card.`
          : ''}
      </p>

      {/* ── The deck — horizontal swipe carousel ──────────────────────────── */}
      <section style={{ marginTop: 12 }}>
        <SectionTitle title="The Deck" caption={`${deck.length} curated · swipe →`} />
        {deck.length === 0 ? (
          <EmptyDeck />
        ) : (
          <Deck>
            {deck.map(c => (
              <DeckCard
                key={c.id}
                campaign={c}
                navigate={navigate}
                creditCovers={credit >= (c.goal - c.raised) && (c.goal - c.raised) > 0}
              />
            ))}
          </Deck>
        )}
      </section>

      {/* ── All burdens — full vertical list ──────────────────────────────── */}
      <section style={{ marginTop: 56 }}>
        <SectionTitle title="All burdens" caption={`${allBurdens.length} total`} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
          marginTop: 18,
        }}>
          {allBurdens.map(c => (
            <ListCard
              key={c.id}
              campaign={c}
              navigate={navigate}
              creditCovers={credit >= (c.goal - c.raised) && (c.goal - c.raised) > 0}
            />
          ))}
        </div>
      </section>

    </main>
  )
}

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionTitle({ title, caption }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 16,
      paddingBottom: 12,
      borderBottom: '1px solid ' + colors.ruleSoft,
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 500, letterSpacing: 0, color: colors.ink, margin: 0 }}>{title}</h2>
      <span style={{ fontSize: 11, letterSpacing: 1, color: colors.inkMuted }}>{caption}</span>
    </div>
  )
}

// ─── Deck — horizontal scroll-snap carousel ──────────────────────────────────

function Deck({ children }) {
  const ref = useRef(null)
  function nudge(dir) {
    const el = ref.current
    if (!el) return
    const step = Math.max(300, Math.round(el.clientWidth * 0.75))
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
          paddingTop: 6,
          paddingBottom: 22,
          // Tiny side padding so the first / last card's lift shadow doesn't clip.
          paddingLeft: 4,
          paddingRight: 4,
          scrollbarWidth: 'thin',
        }}
      >
        {children}
      </div>
      <DeckArrow dir="left"  onClick={() => nudge(-1)} />
      <DeckArrow dir="right" onClick={() => nudge(1)}  />
    </div>
  )
}

function DeckArrow({ dir, onClick }) {
  const left = dir === 'left'
  return (
    <button
      onClick={onClick}
      aria-label={left ? 'Scroll left' : 'Scroll right'}
      style={{
        position: 'absolute',
        top: '50%',
        [left ? 'left' : 'right']: -10,
        transform: 'translateY(-50%)',
        width: 40, height: 40, borderRadius: '50%',
        border: '1px solid ' + colors.ruleSoft,
        background: '#fff',
        cursor: 'pointer',
        fontSize: 16,
        color: colors.ink,
        boxShadow: '0 6px 14px -4px rgba(60,100,180,0.30)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
      }}
    >{left ? '←' : '→'}</button>
  )
}

function EmptyDeck() {
  return (
    <div style={{
      padding: 28,
      border: '1px dashed ' + colors.ruleSoft,
      borderRadius: 12,
      fontSize: 12,
      color: colors.inkMuted,
    }}>
      Every burden is fully funded right now. Nothing to spree on — until the next church
      lifts the next burden. Check back soon.
    </div>
  )
}

// ─── DeckCard — featured tile (in the swipe deck) ────────────────────────────

function DeckCard({ campaign: c, navigate, creditCovers }) {
  const church = churches.find(ch => ch.id === c.churchId)
  const gap = Math.max(0, c.goal - c.raised)
  const pct = Math.round((c.raised / c.goal) * 100)
  return (
    <div style={{
      flex: '0 0 320px',
      maxWidth: '85vw',
      scrollSnapAlign: 'start',
      display: 'flex',
    }}>
      <Tile
        onClick={() => navigate({ name: 'campaign', id: c.id })}
        padding={22}
        minHeight={330}
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
          background: 'rgba(10, 20, 48, 0.05)',
          border: '1px solid rgba(10, 20, 48, 0.12)',
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
            background: colors.ink,
            color: '#fff',
            border: 'none',
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontWeight: 600,
            borderRadius: 999,
            cursor: 'pointer',
            boxShadow: '0 6px 14px -6px rgba(10,20,48,0.45)',
          }}
        >Give the gap{creditCovers ? ' · from credit' : ''}</button>
      </Tile>
    </div>
  )
}

// ─── ListCard — used in the full vertical list (also handles funded state) ───

function ListCard({ campaign: c, navigate, creditCovers }) {
  const church = churches.find(ch => ch.id === c.churchId)
  const gap = Math.max(0, c.goal - c.raised)
  const pct = Math.round((c.raised / c.goal) * 100)
  const funded = c.raised >= c.goal
  return (
    <Tile
      onClick={() => navigate({ name: 'campaign', id: c.id })}
      padding={22}
      minHeight={300}
      style={{ gap: 12, width: '100%' }}
    >
      <FundingBanner raised={c.raised} goal={c.goal} />
      <Label onNavy>{c.category}</Label>

      <div>
        <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.3, color: tile.ink }}>{c.title}</div>
        <div style={{ fontSize: 11, color: tile.muted, letterSpacing: 1, marginTop: 6 }}>
          {church.name} — {church.location}
        </div>
      </div>

      <p style={{ fontSize: 12, lineHeight: 1.6, color: tile.soft, flex: 1, margin: 0 }}>
        {c.summary}
      </p>

      <Progress value={c.raised} goal={c.goal} onNavy />
      <div style={{ fontSize: 10, letterSpacing: 1, color: tile.muted, marginTop: 2 }}>
        {pct}% · {c.donors} donors · {funded
          ? 'closed to new gifts'
          : `${formatMoney(gap)} to go`}
      </div>

      {funded ? (
        <div style={{
          marginTop: 'auto',
          alignSelf: 'stretch',
          padding: '10px 14px',
          background: 'rgba(46, 138, 90, 0.14)',
          color: '#0e3a23',
          border: '1px solid rgba(46, 138, 90, 0.40)',
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
          fontWeight: 600,
          textAlign: 'center',
          borderRadius: 999,
        }}>Fully funded — thank you</div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); navigate({ name: 'give', id: c.id }) }}
          style={{
            marginTop: 'auto',
            alignSelf: 'stretch',
            padding: '10px 14px',
            background: colors.ink,
            color: '#fff',
            border: 'none',
            fontSize: 10,
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontWeight: 600,
            borderRadius: 999,
            cursor: 'pointer',
            boxShadow: '0 6px 14px -6px rgba(10,20,48,0.45)',
          }}
        >Give{creditCovers ? ' · from credit' : ''}</button>
      )}
    </Tile>
  )
}
