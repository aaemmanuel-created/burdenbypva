import { useMemo, useState } from 'react'
import { colors } from '../theme.js'
import { Label, Rule, Progress, Badge, formatMoney } from '../components/UI.jsx'
import { campaigns, churches } from '../data/mock.js'

const CATEGORIES = ['All', 'Education', 'Health', 'Community', 'Building']

export default function Discover({ navigate }) {
  const [cat, setCat] = useState('All')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      if (cat !== 'All' && c.category !== cat) return false
      if (query) {
        const ch = churches.find(ch => ch.id === c.churchId)
        const hay = (c.title + ' ' + c.summary + ' ' + ch.name + ' ' + ch.location).toLowerCase()
        if (!hay.includes(query.toLowerCase())) return false
      }
      return true
    })
  }, [cat, query])

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 28px 0' }}>
      <Label>Discover</Label>
      <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: -0.5, marginTop: 14, marginBottom: 36 }}>
        Verified churches and burdens.
      </h1>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 24,
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                padding: '8px 14px',
                background: cat === c ? colors.ink : 'transparent',
                color: cat === c ? colors.accentInk : colors.ink,
                border: '1px solid ' + colors.rule,
                fontSize: 10,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >{c}</button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search churches and burdens…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 240,
            padding: '10px 14px',
            border: '1px solid ' + colors.rule,
            background: 'transparent',
            fontSize: 12,
            color: colors.ink,
            outline: 'none',
          }}
        />
      </div>

      <Rule />

      {/* Results */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        borderLeft: '1px solid ' + colors.rule,
      }}>
        {filtered.map(c => {
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
                padding: 28,
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                minHeight: 300,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Label>{c.category}</Label>
                {church.verified && <Badge tone="trust">{church.tier}</Badge>}
              </div>

              <div>
                <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.3, marginBottom: 8 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: colors.inkMuted, letterSpacing: 1 }}>
                  {church.name} — {church.location}
                </div>
              </div>

              <p style={{ fontSize: 12, lineHeight: 1.6, color: colors.inkSoft, flex: 1 }}>
                {c.summary}
              </p>

              <div>
                <Progress value={c.raised} goal={c.goal} />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 10,
                  fontSize: 10,
                  letterSpacing: 1,
                  color: colors.inkSoft,
                }}>
                  <span>{pct}% — {c.donors} donors</span>
                  <span>{c.daysLeft}d left</span>
                </div>
              </div>
            </button>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ padding: 48, color: colors.inkMuted, fontSize: 12 }}>
            No burdens match your filters.
          </div>
        )}
      </div>
    </main>
  )
}
