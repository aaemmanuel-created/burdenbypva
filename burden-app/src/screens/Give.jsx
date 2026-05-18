import { useState } from 'react'
import { colors } from '../theme.js'
import { Button, Label, Rule, Badge, formatMoney } from '../components/UI.jsx'
import { campaigns, churches } from '../data/mock.js'

const PRESETS = [5, 25, 100, 500]

export default function Give({ id, navigate, recordGift, profile }) {
  const campaign = campaigns.find(c => c.id === id)
  const church = campaign && churches.find(ch => ch.id === campaign.churchId)

  const [amount, setAmount] = useState(25)
  const [custom, setCustom] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const [coverFee, setCoverFee] = useState(true)
  const [useCredit, setUseCredit] = useState(false)
  const [name, setName] = useState(profile?.name || '')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!campaign) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 28px' }}>
        <p>Burden not found.</p>
        <Button onClick={() => navigate({ name: 'discover' })}>Back to Discover</Button>
      </main>
    )
  }

  const credit = profile?.creditBalance ?? 0
  const value = custom !== '' ? Number(custom) || 0 : amount
  const fee = coverFee ? Math.round((value * 0.045 + 0.30) * 100) / 100 : 0
  const total = Math.round((value + fee) * 100) / 100
  const creditCovers = useCredit && credit >= value && value >= 1

  function handleSubmit(e) {
    e.preventDefault()
    if (value < 1) return
    recordGift({
      id: 'gift_' + Date.now(),
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      churchName: church.name,
      amount: value,
      coveredFee: fee,
      total,
      recurring,
      anonymous,
      fromCredit: creditCovers,
      donor: anonymous ? null : { name, email },
      timestamp: new Date().toISOString(),
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '96px 28px' }}>
        <Label>Gift received</Label>
        <h1 style={{
          fontSize: 32, fontWeight: 300, letterSpacing: -0.5,
          marginTop: 14, marginBottom: 20, lineHeight: 1.2,
        }}>
          Thank you. Your gift of {formatMoney(value)} is on its way to {church.name}.
        </h1>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: colors.inkSoft, marginBottom: 36 }}>
          A receipt will be emailed shortly. {recurring && 'Your recurring gift will run monthly until you cancel from your giving history.'}
          {' '}You can view this gift any time in your giving history.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button onClick={() => navigate({ name: 'history' })}>View giving history</Button>
          <Button variant="ghost" onClick={() => navigate({ name: 'discover' })}>Back to Discover</Button>
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

      <Label>Give</Label>
      <h1 style={{ fontSize: 28, fontWeight: 400, marginTop: 14, marginBottom: 8, lineHeight: 1.2 }}>
        Support {church.name}
      </h1>
      <div style={{ fontSize: 12, color: colors.inkMuted, letterSpacing: 1, marginBottom: 32 }}>
        {church.location} · {campaign.title}
      </div>

      <Rule soft />

      <form onSubmit={handleSubmit} style={{ marginTop: 40 }}>
        {/* Amount */}
        <div style={{ marginBottom: 36 }}>
          <Label style={{ marginBottom: 14 }}>Amount (USD)</Label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 4,
            marginBottom: 12,
          }}>
            {PRESETS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => { setAmount(p); setCustom('') }}
                style={{
                  padding: '16px 0',
                  background: (custom === '' && amount === p) ? colors.ink : 'transparent',
                  color: (custom === '' && amount === p) ? colors.accentInk : colors.ink,
                  border: '1px solid ' + colors.rule,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >${p}</button>
            ))}
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
              padding: '14px 16px',
              border: '1px solid ' + colors.rule,
              background: 'transparent',
              fontSize: 13,
              color: colors.ink,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Toggles */}
        <div style={{ marginBottom: 36 }}>
          {credit > 0 && (
            <Toggle
              checked={useCredit}
              onChange={(v) => {
                setUseCredit(v)
                // Covering a fee from a card while paying from credit is
                // confusing — turn the fee-cover toggle off when credit pays.
                if (v) setCoverFee(false)
              }}
              label={`Pay from account credit (${formatMoney(credit)} available)`}
              help={value > credit
                ? `Gift is ${formatMoney(value)} — only ${formatMoney(credit)} in credit. Reduce the amount or top up to use credit.`
                : 'Your account credit is held in BURDEN escrow. Switch off to pay by card instead.'} />
          )}
          <Toggle checked={recurring} onChange={setRecurring}
            label="Make this a monthly gift"
            help="Cancel any time from your giving history." />
          <Toggle checked={anonymous} onChange={setAnonymous}
            label="Give anonymously"
            help="Your name will not be visible to the church or other donors. We still hold a tax-receipt record." />
          <Toggle checked={coverFee} onChange={setCoverFee}
            label={`Cover platform &amp; processing fee (${formatMoney(fee)})`}
            help="When covered, 100% of your gift reaches the church." />
        </div>

        {/* Donor info */}
        {!anonymous && (
          <div style={{ marginBottom: 36 }}>
            <Label style={{ marginBottom: 14 }}>Your details</Label>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Email for receipt"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ ...inputStyle, marginTop: 8 }}
            />
          </div>
        )}

        <Rule soft />

        {/* Summary */}
        <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <Label>Total today</Label>
            <div style={{ marginTop: 6, fontSize: 11, color: colors.inkMuted }}>
              {creditCovers
                ? 'paid from account credit'
                : (recurring ? 'and monthly thereafter' : 'one-time gift')}
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 500 }}>{formatMoney(creditCovers ? value : total)}</div>
        </div>

        <Button type="submit" full disabled={value < 1 || (!anonymous && (!name || !email)) || (useCredit && value > credit)}>
          {creditCovers
            ? `Give ${formatMoney(value)} from credit`
            : `Give ${formatMoney(total)}`}
        </Button>

        <p style={{ marginTop: 18, fontSize: 10, color: colors.inkMuted, lineHeight: 1.6, letterSpacing: 0.3 }}>
          By giving you confirm you have read BURDEN's eligibility &amp; refund policy. This is a
          demo checkout — no payment is processed.
        </p>
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

function Toggle({ checked, onChange, label, help }) {
  return (
    <label style={{
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      padding: '14px 0',
      borderBottom: '1px solid ' + colors.ruleSoft,
      cursor: 'pointer',
    }}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 18,
          height: 18,
          border: '1px solid ' + colors.rule,
          background: checked ? colors.ink : 'transparent',
          flexShrink: 0,
          marginTop: 2,
          padding: 0,
          cursor: 'pointer',
        }}
        aria-pressed={checked}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: colors.ink }} dangerouslySetInnerHTML={{ __html: label }} />
        <div style={{ marginTop: 4, fontSize: 11, color: colors.inkMuted, lineHeight: 1.5 }}>{help}</div>
      </div>
    </label>
  )
}
