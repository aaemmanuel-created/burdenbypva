import { useState } from 'react'
import { colors, font, type } from '../theme.js'
import { Button, Label } from '../components/UI.jsx'
import { applyAsChurch, churchLive } from '../lib/church.js'
import { demoApply } from '../lib/trust.js'

// A church asks to join BURDEN. The BURDEN team checks what is asked here
// (registration, oversight, references, the creeds) in the admin console
// before the church can receive anything — see lib/trust.js KYB_CHECKS.

const TRADITIONS = ['Catholic', 'Orthodox', 'Anglican', 'Mainline Protestant', 'Evangelical', 'Pentecostal', 'Non-denominational', 'Other']

const FIELDS = [
  ['churchName', 'Church or institution name'],
  ['city', 'City'],
  ['country', 'Country'],
  ['leaderName', 'Leader’s name'],
  ['leaderRole', 'Leader’s role (e.g. Senior Pastor)'],
  ['email', 'Church email — your reply comes here, and it becomes the first dashboard login', 'email'],
  ['registrationBody', 'Where the church is registered (e.g. Registrar-General, Charity Commission)'],
  ['registrationNo', 'Registration number'],
  ['oversight', 'Who the leadership answers to — denomination, diocese or board'],
  ['website', 'Website (optional)'],
]

export default function ChurchApply({ navigate }) {
  const [f, setF] = useState({ tradition: '', references: '', creedAffirmed: false, website2: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))
  const ready = FIELDS.filter(([k]) => k !== 'website').every(([k]) => (f[k] || '').trim()) && f.tradition && f.references.trim().length >= 20 && f.creedAffirmed

  async function submit(e) {
    e.preventDefault()
    if (!ready || busy) return
    setBusy(true); setError('')
    try {
      if (churchLive) await applyAsChurch(f); else demoApply(f)
      setSent(true)
      window.scrollTo({ top: 0, behavior: 'instant' })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  if (sent) {
    return (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '64px 28px 96px' }}>
        <Label>Application sent</Label>
        <h1 style={h1}>Thank you. The BURDEN team will be in touch.</h1>
        <p style={p}>
          A reviewer checks your registration, your leadership and oversight, and speaks to your references. It
          usually takes a few weeks. We write to {f.email} with any questions and with the decision.
        </p>
        {!churchLive && <p style={{ ...p, fontSize: 12, color: colors.inkMuted }}>Demo — the application is waiting in the BURDEN team console (footer → BURDEN team).</p>}
        <Button onClick={() => navigate({ name: 'home' })}>Back to BURDEN</Button>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '64px 28px 96px' }}>
      <Label>For churches</Label>
      <h1 style={h1}>Apply to carry burdens on BURDEN</h1>
      <p style={p}>
        BURDEN is open to local churches and Christian institutions in the Catholic, Orthodox and Protestant
        traditions that affirm the historic creeds and work under accountable leadership. Every church is checked
        before it can receive gifts, and checked again from time to time.
      </p>
      <form onSubmit={submit} style={{ marginTop: 32, display: 'grid', gap: 18 }}>
        {FIELDS.slice(0, 1).map(([k, l]) => <Field key={k} id={k} label={l} value={f[k]} onChange={v => set(k, v)} />)}
        <div>
          <label style={labelStyle} htmlFor="ap-tradition">Tradition</label>
          <select id="ap-tradition" value={f.tradition} onChange={e => set('tradition', e.target.value)} style={input} required>
            <option value="">Choose…</option>
            {TRADITIONS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        {FIELDS.slice(1).map(([k, l, t]) => <Field key={k} id={k} label={l} type={t} value={f[k]} onChange={v => set(k, v)} />)}
        <div>
          <label style={labelStyle} htmlFor="ap-references">Two references outside your church, and how to reach them</label>
          <textarea id="ap-references" rows={4} value={f.references} maxLength={1000} onChange={e => set('references', e.target.value)}
            style={{ ...input, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical' }} />
        </div>
        {/* left empty by people; form-filling bots fill it */}
        <input aria-hidden="true" tabIndex={-1} autoComplete="off" value={f.website2} onChange={e => set('website2', e.target.value)}
          style={{ position: 'absolute', left: -9999, width: 1, height: 1 }} />
        <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.6, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.creedAffirmed} onChange={e => set('creedAffirmed', e.target.checked)} style={{ marginTop: 4 }} />
          <span>Our church affirms the historic Christian creeds (the Apostles’ and Nicene Creeds), and our leadership is accountable to the body named above.</span>
        </label>
        {error && <p role="alert" style={{ margin: 0, fontSize: 13, color: colors.fundLow }}>{error}</p>}
        <Button type="submit" full disabled={!ready || busy}>{busy ? 'One moment…' : 'Send the application'}</Button>
        <p style={{ fontSize: 12, color: colors.inkMuted, lineHeight: 1.6, margin: 0 }}>
          The names you give are screened against international sanctions lists, as the law requires of anyone
          moving money.
        </p>
      </form>
    </main>
  )
}

function Field({ id, label, value = '', onChange, type: inputType = 'text' }) {
  return (
    <div>
      <label style={labelStyle} htmlFor={`ap-${id}`}>{label}</label>
      <input id={`ap-${id}`} type={inputType} value={value} onChange={e => onChange(e.target.value)} style={input} />
    </div>
  )
}

const h1 = { fontFamily: font.serif, fontSize: type['2xl'].fontSize, fontWeight: 600, margin: '16px 0 16px', lineHeight: 1.3 }
const p = { fontSize: 14, lineHeight: 1.7, color: colors.inkSoft, marginBottom: 24 }
const labelStyle = { display: 'block', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.inkMuted, marginBottom: 8, lineHeight: 1.5 }
const input = { width: '100%', padding: '14px 16px', border: '1px solid ' + colors.rule, background: 'transparent', fontSize: 14, color: colors.ink, outline: 'none', boxSizing: 'border-box' }
