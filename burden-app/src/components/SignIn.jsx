import { useState } from 'react'
import { colors } from '../theme.js'
import { Button } from './UI.jsx'
import { DEMO_CODE, authLive, sendCode, verifyCode } from '../lib/auth.js'

// Email-code sign-in, used wherever a person needs to be known: a giver's
// account, starting a fundraiser, the BURDEN team's console. No password.
// `onNavy` styles it for a blue tile.

export default function SignIn({ onSignedIn, intro, button = 'Sign in', onNavy = false }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ink = onNavy ? '#fff' : colors.ink
  const soft = onNavy ? 'rgba(255,255,255,0.86)' : colors.inkMuted
  const field = {
    width: '100%', padding: '14px 16px', border: '1px solid ' + (onNavy ? 'rgba(255,255,255,0.4)' : colors.rule),
    background: onNavy ? 'rgba(255,255,255,0.08)' : 'transparent', color: ink, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const label = { display: 'block', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: soft, marginBottom: 8 }

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      if (!sent) { await sendCode(email.trim().toLowerCase()); setSent(true) }
      else onSignedIn(await verifyCode(email.trim().toLowerCase(), code.trim()))
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
      {intro && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: soft }}>{intro}</p>}
      <div>
        <label style={label} htmlFor="signin-email">Your email</label>
        <input id="signin-email" type="email" required autoComplete="email" value={email} disabled={sent}
          onChange={e => setEmail(e.target.value)} style={field} />
      </div>
      {sent && (
        <div>
          <label style={label} htmlFor="signin-code">The 6-digit code we emailed you</label>
          <input id="signin-code" inputMode="numeric" autoComplete="one-time-code" required value={code} autoFocus
            onChange={e => setCode(e.target.value)} style={{ ...field, letterSpacing: 4 }} />
          {!authLive && <p style={{ margin: '8px 0 0', fontSize: 12, color: soft }}>Demo — no email is sent. The code is {DEMO_CODE}.</p>}
        </div>
      )}
      {error && <p role="alert" style={{ margin: 0, fontSize: 13, color: onNavy ? '#ffd9d4' : colors.fundLow }}>{error}</p>}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="submit" variant={onNavy ? 'onNavy' : undefined} disabled={busy || !email}>
          {busy ? 'One moment…' : sent ? button : 'Email me a code'}
        </Button>
        {sent && (
          <button type="button" onClick={() => { setSent(false); setCode(''); setError('') }}
            style={{ background: 'none', border: 'none', padding: 0, color: ink, fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }}>
            Use another email
          </button>
        )}
      </div>
    </form>
  )
}
