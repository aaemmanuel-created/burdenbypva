import { useMemo, useState } from 'react'
import { colors, tile } from '../theme.js'
import { Label, Rule, Progress, Badge, Tile, FundingBanner, formatMoney } from '../components/UI.jsx'
import { campaigns, churches } from '../data/mock.js'

const CATEGORIES = ['All', 'Education', 'Health', 'Community', 'Building']
const ALL = 'All'

// Region grouping — derived from a country list. Used for the region filter
// dropdown. Kept here (rather than in mock data) so it can be tuned without
// touching the canonical church/campaign records.
const REGION_OF = {
  'Kenya': 'Africa',
  'Nigeria': 'Africa',
  'Ghana': 'Africa',
  'United Kingdom': 'Europe',
  'Philippines': 'Asia',
}

// Parse "City, Country" — both halves are trimmed. Falls back to nulls if
// the format isn't recognised.
function splitLocation(loc) {
  if (!loc) return { city: null, country: null }
  const parts = loc.split(',').map(s => s.trim())
  if (parts.length >= 2) return { city: parts[0], country: parts[parts.length - 1] }
  return { city: parts[0], country: null }
}

export default function Discover({ navigate }) {
  const [cat, setCat] = useState(ALL)
  const [region, setRegion] = useState(ALL)
  const [country, setCountry] = useState(ALL)
  const [city, setCity] = useState(ALL)
  const [query, setQuery] = useState('')

  // Build location indexes once per render — cheap on this dataset.
  const locIndex = useMemo(() => {
    const countries = new Set()
    const cities = new Set()
    const regions = new Set()
    const countriesByRegion = new Map()  // region -> Set(country)
    const citiesByCountry = new Map()    // country -> Set(city)
    for (const ch of churches) {
      const { city: ci, country: co } = splitLocation(ch.location)
      const re = co ? (REGION_OF[co] || 'Other') : 'Other'
      if (co) countries.add(co)
      if (ci) cities.add(ci)
      regions.add(re)
      if (co) {
        if (!countriesByRegion.has(re)) countriesByRegion.set(re, new Set())
        countriesByRegion.get(re).add(co)
      }
      if (co && ci) {
        if (!citiesByCountry.has(co)) citiesByCountry.set(co, new Set())
        citiesByCountry.get(co).add(ci)
      }
    }
    return { regions, countries, cities, countriesByRegion, citiesByCountry }
  }, [])

  // Country and city option lists narrow as parents are picked.
  const countryOptions = useMemo(() => {
    if (region === ALL) return Array.from(locIndex.countries).sort()
    return Array.from(locIndex.countriesByRegion.get(region) || []).sort()
  }, [region, locIndex])
  const cityOptions = useMemo(() => {
    if (country !== ALL) return Array.from(locIndex.citiesByCountry.get(country) || []).sort()
    if (region !== ALL) {
      const out = new Set()
      for (const co of locIndex.countriesByRegion.get(region) || []) {
        for (const ci of locIndex.citiesByCountry.get(co) || []) out.add(ci)
      }
      return Array.from(out).sort()
    }
    return Array.from(locIndex.cities).sort()
  }, [region, country, locIndex])

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      const ch = churches.find(x => x.id === c.churchId)
      const { city: ci, country: co } = splitLocation(ch.location)
      const re = co ? (REGION_OF[co] || 'Other') : 'Other'

      if (cat !== ALL && c.category !== cat) return false
      if (region !== ALL && re !== region) return false
      if (country !== ALL && co !== country) return false
      if (city !== ALL && ci !== city) return false
      if (query) {
        const hay = (c.title + ' ' + c.summary + ' ' + ch.name + ' ' + ch.location).toLowerCase()
        if (!hay.includes(query.toLowerCase())) return false
      }
      return true
    })
  }, [cat, region, country, city, query])

  function clearAll() {
    setCat(ALL); setRegion(ALL); setCountry(ALL); setCity(ALL); setQuery('')
  }

  const anyFilter = cat !== ALL || region !== ALL || country !== ALL || city !== ALL || !!query

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 28px 0' }}>
      <Label>Discover</Label>
      <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: -0.5, marginTop: 14, marginBottom: 36 }}>
        Verified churches and burdens.
      </h1>

      {/* Category chips */}
      <div style={{
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
        marginBottom: 16,
      }}>
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
              cursor: 'pointer',
            }}
          >{c}</button>
        ))}
      </div>

      {/* Location filters + search */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 8,
        marginBottom: 12,
      }}>
        <FilterSelect
          label="Region"
          value={region}
          options={[ALL, ...Array.from(locIndex.regions).sort()]}
          onChange={(v) => { setRegion(v); setCountry(ALL); setCity(ALL) }}
        />
        <FilterSelect
          label="Country"
          value={country}
          options={[ALL, ...countryOptions]}
          onChange={(v) => { setCountry(v); setCity(ALL) }}
        />
        <FilterSelect
          label="City"
          value={city}
          options={[ALL, ...cityOptions]}
          onChange={setCity}
        />
        <input
          type="text"
          placeholder="Search churches and burdens…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            padding: '12px 14px',
            border: '1px solid ' + colors.rule,
            background: 'transparent',
            fontSize: 12,
            color: colors.ink,
            outline: 'none',
            minWidth: 0,
          }}
        />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        fontSize: 11,
        letterSpacing: 1,
        color: colors.inkMuted,
      }}>
        <span>{filtered.length} {filtered.length === 1 ? 'burden' : 'burdens'} match your filters</span>
        {anyFilter && (
          <button
            onClick={clearAll}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 10,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: colors.inkSoft,
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
            }}
          >Clear filters ×</button>
        )}
      </div>

      <Rule />

      {/* Results */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20,
        marginTop: 28,
      }}>
        {filtered.map(c => {
          const church = churches.find(ch => ch.id === c.churchId)
          const pct = Math.round((c.raised / c.goal) * 100)
          return (
            <Tile
              key={c.id}
              onClick={() => navigate({ name: 'campaign', id: c.id })}
              padding={28}
              minHeight={320}
              style={{ gap: 18 }}
            >
              <FundingBanner raised={c.raised} goal={c.goal} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Label onNavy>{c.category}</Label>
                {church.verified && <Badge tone="trust" onNavy>{church.tier}</Badge>}
              </div>

              <div>
                <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.3, marginBottom: 8, color: tile.ink }}>
                  {c.title}
                </div>
                <div style={{ fontSize: 11, color: tile.muted, letterSpacing: 1 }}>
                  {church.name} — {church.location}
                </div>
              </div>

              <p style={{ fontSize: 12, lineHeight: 1.6, color: tile.soft, flex: 1, margin: 0 }}>
                {c.summary}
              </p>

              <div>
                <Progress value={c.raised} goal={c.goal} onNavy />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 10,
                  fontSize: 10,
                  letterSpacing: 1,
                  color: tile.soft,
                }}>
                  <span>{pct}% — {c.donors} donors</span>
                  <span>{c.daysLeft}d left</span>
                </div>
              </div>
            </Tile>
          )
        })}

        {filtered.length === 0 && (
          <div style={{
            padding: 48,
            color: colors.inkMuted,
            fontSize: 12,
            border: '1px solid ' + colors.ruleSoft,
            gridColumn: '1 / -1',
          }}>
            No burdens match your filters. <button
              onClick={clearAll}
              style={{
                background: 'transparent', border: 'none', padding: 0,
                fontSize: 12, color: colors.ink, textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >Clear filters</button> to see everything.
          </div>
        )}
      </div>
    </main>
  )
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label style={{ display: 'block', position: 'relative' }}>
      <span style={{
        position: 'absolute', top: -8, left: 10,
        background: colors.bg, padding: '0 6px',
        fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
        color: colors.inkMuted,
      }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 14px',
          border: '1px solid ' + colors.rule,
          background: colors.bg,
          fontSize: 12,
          color: colors.ink,
          outline: 'none',
          appearance: 'none',
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        {options.map(o => (
          <option key={o} value={o}>{o === 'All' ? `All ${label.toLowerCase()}s` : o}</option>
        ))}
      </select>
    </label>
  )
}
