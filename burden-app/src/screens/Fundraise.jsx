import { useState } from 'react'
import { colors, font, type } from '../theme.js'
import { Button, Label, formatMoney } from '../components/UI.jsx'
import { ShareOptions } from '../components/Community.jsx'
import { MESSAGE_MAX } from '../lib/community.js'
import { campaigns, churches } from '../data/mock.js'

// Start a fundraiser for a burden: your name, why you're carrying it, and a
// goal for your own circle. Gifts through it go to the church as usual.
// Kept on this device until fundraisers live on the payment server.

const PRESETS = [100, 250, 500, 1000]

export default function Fundraise({ id, navigate, profile, addFundraiser }) {
  const campaign = campaigns.find(c => c.id === id)
  const church = campaign && churches.find(ch => ch.id === campaign.churchId)
  const [name, setName] = useState(profile?.name || '')
  const [note, setNote] = useState('')
  const [goal, setGoal] = useState(250)
  const [custom, setCustom] = useState('')
  const [made, setMade] = useState(null)

  if (!campaign) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 28px' }}>
        <p>Burden not found.</p>
        <Button onClick={() => navigate({ name: 'discover' })}>Back to Discover</Button>
      </main>
    )
  }

  const value = custom !== '' ? Math.floor(Number(custom) || 0) : goal
  const ready = name.trim().length > 0 && note.trim().length > 0 && value >= 1

  function submit(e) {
    e.preventDefault()
    if (!ready) return
    const fundraiser = {
      id: 'fr_' + Date.now(),
      campaignId: campaign.id,
      name: name.trim(),
      note: note.trim(),
      goal: value,
      raised: 0,
      started: new Date().toISOString().slice(0, 10),
      own: true,
    }
    addFundraiser(fundraiser)
    setMade(fundraiser)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const h1 = {
    fontFamily: font.serif, fontSize: type['2xl'].fontSize, fontWeight: 600,
    marginTop: 16, marginBottom: 8, lineHeight: type['2xl'].lineHeight, letterSpacing: '-1.5%',
  }

  if (made) {
    return (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '64px 28px 96px' }}>
        <Label>Your fundraiser</Label>
        <h1 style={h1}>You're carrying {campaign.title} with {church.name}.</h1>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: colors.inkSoft, marginBottom: 32 }}>
          Share your link below. Gifts through it go straight to {church.name}'s verified account and
          count towards your {formatMoney(made.goal)} goal.
        </p>
        <ShareOptions
          campaign={campaign} church={church} fundraiser={made}
          onPoster={() => navigate({ name: 'poster', id: campaign.id, fundraiserId: made.id })}
        />
        <p style={{ marginTop: 16, fontSize: 11, lineHeight: 1.6, color: colors.inkMuted }}>
          For now your fundraiser is kept on this device only, so the link opens the burden for others
          but they won't see your page yet.
        </p>
        <div style={{ marginTop: 32, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button onClick={() => navigate({ name: 'campaign', id: campaign.id, fundraiserId: made.id })}>See it on the burden</Button>
        </div>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 28px 96px' }}>
      <button
        onClick={() => navigate({ name: 'campaign', id: campaign.id })}
        style={{
          background: 'transparent', border: 'none', padding: 0,
          fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
          color: colors.inkSoft, marginBottom: 32, cursor: 'pointer',
        }}
      >← {campaign.title}</button>

      <Label>Fundraise</Label>
      <h1 style={h1}>Carry this burden with your circle</h1>
      <div style={{ fontSize: type.xs.fontSize, color: colors.inkMuted, letterSpacing: '6%' }}>
        {church.name} · {campaign.title}
      </div>

      <form onSubmit={submit} style={{ marginTop: 48 }}>
        <div style={{ marginBottom: 36 }}>
          <Label style={{ marginBottom: 14 }}>Your name, or your group's</Label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ama Mensah, or St Paul's youth" required style={inputStyle} />
        </div>

        <div style={{ marginBottom: 36 }}>
          <Label style={{ marginBottom: 14 }}>Why you're carrying it</Label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, MESSAGE_MAX))}
            placeholder="A sentence or two for the people you'll share it with."
            rows={4}
            required
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: colors.inkMuted, textAlign: 'right' }}>{note.length}/{MESSAGE_MAX}</div>
        </div>

        <div style={{ marginBottom: 36 }}>
          <Label style={{ marginBottom: 14 }}>Your goal (USD)</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 12 }}>
            {PRESETS.map(p => {
              const active = custom === '' && goal === p
              return (
                <button key={p} type="button" onClick={() => { setGoal(p); setCustom('') }} style={{
                  padding: '16px 0', border: '1px solid ' + colors.rule, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  background: active ? colors.ink : 'transparent', color: active ? colors.accentInk : colors.ink,
                }}>${p}</button>
              )
            })}
          </div>
          <input type="number" min="1" step="1" placeholder="Custom goal" value={custom} onChange={e => setCustom(e.target.value)} style={inputStyle} />
          <p style={{ marginTop: 10, fontSize: 11, color: colors.inkMuted, lineHeight: 1.5 }}>
            Your goal is your own. It sits inside the burden's goal, not on top of it.
          </p>
        </div>

        <Button type="submit" full disabled={!ready}>Start my fundraiser</Button>
      </form>
    </main>
  )
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  border: '1px solid ' + colors.rule,
  background: 'transparent',
  fontSize: 13,
  color: colors.ink,
  outline: 'none',
  boxSizing: 'border-box',
}
