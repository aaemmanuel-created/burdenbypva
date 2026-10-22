import { useEffect, useState } from 'react'
import { colors, font, type } from '../theme.js'
import { Button, Label, formatMoney } from '../components/UI.jsx'
import { haptic } from '../lib/useHaptic.ts'
import { campaigns, churches } from '../data/mock.js'
import Timeline from '../components/Timeline.jsx'
import {
  MOMO_NETWORKS, PAYMENT_METHODS, fetchGiftStatus, liveCheckout, normaliseGhanaPhone, returnUrl, startCheckout,
  startMomoCharge, submitMomoOtp,
} from '../lib/payments.js'
import { demoEvents, demoHoldUntil } from '../lib/giftTimeline.js'
import { MESSAGE_MAX, findFundraiser } from '../lib/community.js'
import { ShareSheet } from '../components/Community.jsx'

const PRESETS = [5, 25, 100, 500]

export default function Give({ id, navigate, recordGift, profile, fundraisers = [], fundraiserId }) {
  const campaign = campaigns.find(c => c.id === id)
  const church = campaign && churches.find(ch => ch.id === campaign.churchId)
  const fundraiser = findFundraiser(fundraiserId, fundraisers)
  const [message, setMessage] = useState('')
  const [sharing, setSharing] = useState(false)
  // Paystack: approve on your phone (mobile money) or Paystack's own page.
  const [momoDirect, setMomoDirect] = useState(true)
  const [network, setNetwork] = useState('mtn')
  const [phone, setPhone] = useState('')
  const [waiting, setWaiting] = useState(null) // { gift, state, message } while the prompt is out
  const [otp, setOtp] = useState('')

  const [amount, setAmount] = useState(25)
  const [custom, setCustom] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const [coverFee, setCoverFee] = useState(true)
  const [useCredit, setUseCredit] = useState(false)
  const [name, setName] = useState(profile?.name || '')
  const [email, setEmail] = useState('')
  const [provider, setProvider] = useState('stripe')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(null)

  if (!campaign) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 28px' }}>
        <p>Burden not found.</p>
        <Button onClick={() => navigate({ name: 'discover' })}>Back to Discover</Button>
      </main>
    )
  }

  const credit = profile?.creditBalance ?? 0
  const usingMomo = provider === 'paystack' && momoDirect
  const momoPhone = normaliseGhanaPhone(phone)
  const value = custom !== '' ? Number(custom) || 0 : amount
  const fee = coverFee ? Math.round((value * 0.045 + 0.30) * 100) / 100 : 0
  const total = Math.round((value + fee) * 100) / 100
  const creditCovers = useCredit && credit >= value && value >= 1

  const details = {
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    churchName: church.name,
    amount: value,
    coveredFee: creditCovers ? 0 : fee,
    total: creditCovers ? value : total,
    recurring,
    anonymous,
    // shown on the burden page under Words of support, never with the amount
    message: message.trim() || undefined,
    donorName: anonymous ? undefined : name.trim(),
    fundraiserId: fundraiser?.id,
    fundraiserName: fundraiser?.name,
    payoutTo: church.payoutTo,
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (value < 1 || busy) return
    haptic() // §7 — 16ms pulse before the gift is recorded (Android; no-op on iOS Safari)
    setError('')
    const timestamp = new Date().toISOString()

    // Approve on your phone: the network sends a prompt; the donor enters
    // their PIN on the phone. We wait here and watch the gift's status.
    if (usingMomo && !creditCovers) {
      const networkLabel = MOMO_NETWORKS.find(n => n.id === network).label
      if (liveCheckout) {
        setBusy(true)
        try {
          const res = await startMomoCharge({
            ...details, churchId: church.id, coverFee, name, email, returnUrl: returnUrl(), phone: momoPhone, network,
          })
          const gift = {
            ...details, id: res.giftId, token: res.token, live: true, testMode: res.testMode, provider: 'paystack',
            momo: networkLabel, planId: res.planId, planToken: res.planToken,
            status: res.state === 'failed' ? 'failed' : 'initiated', timestamp,
            events: [{ step: 'gift_sent', occurred_at: timestamp }],
          }
          recordGift(gift)
          if (res.state === 'failed') setError(res.message)
          else if (res.state === 'paid') navigate({ name: 'gift', id: gift.id })
          else setWaiting({ gift, state: res.state, message: res.message })
        } catch (err) {
          setError(err.message)
        } finally {
          setBusy(false)
        }
        return
      }
      // Demo: the "prompt" is approved after a few seconds; no money moves.
      const gift = {
        ...details, id: 'gift_' + Date.now(), live: false, provider: 'paystack', momo: networkLabel,
        status: 'held', holdUntil: demoHoldUntil(timestamp), timestamp,
        events: demoEvents(timestamp, `Approved on ${networkLabel} — demo, no money moved.`),
      }
      setWaiting({ gift, state: 'approve', message: '', demo: true })
      return
    }

    // Live checkout: record the gift on the server, then hand over to the
    // provider's own payment page. It sends the donor back to ?gift=… and
    // App opens that gift's timeline.
    if (liveCheckout && !creditCovers) {
      setBusy(true)
      try {
        const res = await startCheckout({
          ...details, churchId: church.id, provider, coverFee, name, email, returnUrl: returnUrl(),
        })
        recordGift({
          ...details, id: res.giftId, token: res.token, live: true, testMode: res.testMode, provider,
          planId: res.planId, planToken: res.planToken,
          status: 'initiated', timestamp, events: [{ step: 'gift_sent', occurred_at: timestamp }],
        })
        window.location.assign(res.checkoutUrl)
      } catch (err) {
        setError(err.message)
        setBusy(false)
      }
      return
    }

    // Account credit, or the demo checkout when no payment server is set up.
    const gift = {
      ...details,
      id: 'gift_' + Date.now(),
      live: false,
      fromCredit: creditCovers,
      provider: creditCovers ? 'credit' : provider,
      status: 'held',
      holdUntil: demoHoldUntil(timestamp),
      timestamp,
      events: demoEvents(timestamp, creditCovers ? 'Paid from your account credit.' : 'Demo checkout — no payment processed.'),
    }
    recordGift(gift)
    setSubmitted(gift)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  if (waiting) {
    return (
      <MomoWaiting
        waiting={waiting}
        phone={momoPhone}
        network={MOMO_NETWORKS.find(n => n.id === network)}
        otp={otp}
        setOtp={setOtp}
        onOtp={async () => {
          setError('')
          try {
            const r = await submitMomoOtp(waiting.gift.id, waiting.gift.token, otp)
            if (r.state === 'failed') setError(r.message)
            else setWaiting(w => ({ ...w, state: r.state === 'paid' ? 'approve' : r.state, message: r.message }))
          } catch (err) { setError(err.message) }
        }}
        error={error}
        onDone={(gift) => {
          if (waiting.demo) { recordGift(gift); setSubmitted(gift); setWaiting(null) } else navigate({ name: 'gift', id: gift.id })
        }}
        onCancel={() => { setWaiting(null); setError('') }}
      />
    )
  }

  if (submitted) {
    return (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '96px 32px' }}>
        <Label>Gift received</Label>
        <h1 style={{
          fontFamily: font.serif,
          fontSize: type['2xl'].fontSize, fontWeight: 600, letterSpacing: '-1.5%',
          marginTop: 16, marginBottom: 24, lineHeight: type['2xl'].lineHeight,
        }}>
          Thank you. Your gift of {formatMoney(value)} is on its way to {church.name}.
        </h1>
        <p style={{ fontSize: type.sm.fontSize, lineHeight: 1.7, color: colors.inkSoft, marginBottom: 32 }}>
          A receipt will be emailed shortly. {recurring && "Your gift will repeat monthly until you stop it from the gift's page."}
          {' '}You can follow each step below, or any time from your giving history.
        </p>
        <div style={{ marginBottom: 48 }}>
          <Timeline gift={submitted} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button onClick={() => navigate({ name: 'gift', id: submitted.id })}>Track this gift</Button>
          <Button variant="ghost" onClick={() => setSharing(true)}>Share this burden</Button>
          <Button variant="ghost" onClick={() => navigate({ name: 'discover' })}>Back to Discover</Button>
        </div>
        <ShareSheet
          open={sharing}
          onClose={() => setSharing(false)}
          campaign={campaign}
          church={church}
          fundraiser={fundraiser}
          onFundraise={() => navigate({ name: 'fundraise', id: campaign.id })}
        />
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
      <h1 style={{
        fontFamily: font.serif,
        fontSize: type['2xl'].fontSize, fontWeight: 600,
        marginTop: 16, marginBottom: 8, lineHeight: type['2xl'].lineHeight,
        letterSpacing: '-1.5%',
      }}>
        Support {church.name}
      </h1>
      <div style={{ fontSize: type.xs.fontSize, color: colors.inkMuted, letterSpacing: '6%', marginBottom: 32 }}>
        {church.location} · {campaign.title}
      </div>
      {fundraiser && (
        <p style={{ fontSize: 13, color: colors.ink, lineHeight: 1.6 }}>
          Through {fundraiser.own ? 'your fundraiser' : `${fundraiser.name}'s fundraiser`}. The gift still goes
          straight to {church.name}'s verified account.
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 48 }}>
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
            help={monthlyHelp(provider, usingMomo)} />
          <Toggle checked={anonymous} onChange={setAnonymous}
            label="Give anonymously"
            help="Your name will not be visible to the church or other donors. We still hold a tax-receipt record." />
          <Toggle checked={coverFee} onChange={setCoverFee}
            label={`Cover platform &amp; processing fee (${formatMoney(fee)})`}
            help="When covered, 100% of your gift reaches the church." />
        </div>

        {/* Payment method */}
        {!creditCovers && (
          <fieldset style={{ border: 'none', padding: 0, margin: '0 0 36px' }}>
            <legend style={{ padding: 0, marginBottom: 14 }}><Label>Pay with</Label></legend>
            {PAYMENT_METHODS.map(m => (
              <label key={m.id} style={{
                display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 0',
                borderBottom: '1px solid ' + colors.ruleSoft, cursor: 'pointer',
              }}>
                <input
                  type="radio" name="provider" value={m.id}
                  checked={provider === m.id} onChange={() => setProvider(m.id)}
                  style={{ marginTop: 3, accentColor: colors.ink }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: colors.ink }}>{m.label}</div>
                  <div style={{ marginTop: 4, fontSize: 11, color: colors.inkMuted, lineHeight: 1.5 }}>{m.detail}</div>
                </div>
              </label>
            ))}
            {provider === 'paystack' && (
              <div style={{ margin: '16px 0 0 32px' }}>
                <Toggle checked={momoDirect} onChange={setMomoDirect}
                  label="Approve on my phone (mobile money)"
                  help="We send a prompt to your phone. You approve it with your PIN on the phone — you never type your PIN here." />
                {momoDirect && (
                  <div style={{ paddingTop: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 8 }}>
                      {MOMO_NETWORKS.map(n => (
                        <button key={n.id} type="button" onClick={() => setNetwork(n.id)} aria-pressed={network === n.id} style={{
                          padding: '12px 4px', border: '1px solid ' + colors.rule, fontSize: 12, cursor: 'pointer',
                          background: network === n.id ? colors.ink : 'transparent', color: network === n.id ? colors.accentInk : colors.ink,
                        }}>{n.label}</button>
                      ))}
                    </div>
                    <input type="tel" inputMode="tel" placeholder="Mobile money number, e.g. 024 123 4567"
                      value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
                    {phone && !momoPhone && (
                      <div style={{ marginTop: 6, fontSize: 11, color: colors.fundLow }}>Enter a Ghana mobile number, e.g. 024 123 4567.</div>
                    )}
                  </div>
                )}
              </div>
            )}
            <p style={{ marginTop: 12, fontSize: 11, color: colors.inkMuted, lineHeight: 1.5 }}>
              {usingMomo
                ? 'BURDEN never sees your mobile money PIN. Never share it with anyone.'
                : "You'll finish paying on the provider's secure page. BURDEN never sees your card or mobile-money PIN."}
            </p>
          </fieldset>
        )}

        {/* Donor info — email is needed even for anonymous gifts (receipt). */}
        <div style={{ marginBottom: 36 }}>
          <Label style={{ marginBottom: 14 }}>Your details</Label>
          {!anonymous && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={{ ...inputStyle, marginBottom: 8 }}
            />
          )}
          <input
            type="email"
            placeholder="Email for receipt"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        {/* Words of support — optional, shown without the amount */}
        <div style={{ marginBottom: 36 }}>
          <Label style={{ marginBottom: 14 }}>Words of support (optional)</Label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
            placeholder="A few words or a prayer for the church and the people this burden serves."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11, color: colors.inkMuted, lineHeight: 1.5 }}>
            <span>Shown on the burden page {anonymous ? 'as Anonymous' : 'with your name'}. Your amount is never shown.</span>
            <span>{message.length}/{MESSAGE_MAX}</span>
          </div>
        </div>

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

        {error && (
          <p role="alert" style={{ marginBottom: 16, fontSize: 13, color: colors.fundLow }}>{error}</p>
        )}

        <Button type="submit" full disabled={busy || value < 1 || !email || (!anonymous && !name) || (useCredit && value > credit)
          || (usingMomo && !creditCovers && !momoPhone)}>
          {busy ? (usingMomo ? 'Sending the prompt…' : 'Opening secure checkout…')
            : creditCovers ? `Give ${formatMoney(value)} from credit`
            : usingMomo ? `Send prompt for ${formatMoney(total)}`
            : `Give ${formatMoney(total)}`}
        </Button>

        <p style={{ marginTop: 18, fontSize: 10, color: colors.inkMuted, lineHeight: 1.6, letterSpacing: 0.3 }}>
          By giving you confirm you have read BURDEN's eligibility &amp; refund policy.{' '}
          {liveCheckout
            ? 'Payments run in test mode — use the provider\'s test card or test mobile-money number. No real money is taken.'
            : 'This is a demo checkout — no payment is processed.'}
        </p>
      </form>
    </main>
  )
}

// What "monthly" means for the chosen way of paying (see supabase plan-logic.ts).
function monthlyHelp(provider, usingMomo) {
  if (provider === 'flutterwave') return 'Monthly repeats are not available with Flutterwave yet — only this first gift is charged.'
  if (usingMomo) return 'Each month we send a new prompt to your phone and you approve it. Nothing is taken without you. Stop any time from the gift\'s page.'
  return 'Your card is charged again each month. Stop any time from the gift\'s page.'
}

// "Check your phone" — shown while the mobile money prompt is out.
function MomoWaiting({ waiting, phone, network, otp, setOtp, onOtp, error, onDone, onCancel }) {
  const { gift, state, message, demo } = waiting
  useEffect(() => {
    if (state !== 'approve') return
    if (demo) {
      const t = setTimeout(() => onDone(gift), 4000)
      return () => clearTimeout(t)
    }
    let stop = false, timer
    const check = async () => {
      try {
        const { gift: server } = await fetchGiftStatus(gift.id, gift.token)
        if (stop) return
        if (server.status !== 'initiated') return onDone(gift)
      } catch { /* keep waiting */ }
      if (!stop) timer = setTimeout(check, 4000)
    }
    timer = setTimeout(check, 4000)
    return () => { stop = true; clearTimeout(timer) }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps
  const masked = phone ? phone.slice(0, 3) + ' ••• ' + phone.slice(-4) : 'your phone'
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '96px 28px' }}>
      <Label>{network?.label}</Label>
      <h1 style={{ fontSize: type['2xl'].fontSize, fontWeight: 600, lineHeight: type['2xl'].lineHeight, margin: '16px 0 24px' }}>
        {state === 'otp' ? 'Enter the code from your network' : 'Check your phone'}
      </h1>
      {state === 'otp' ? (
        <>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: colors.inkSoft }}>{message}</p>
          <input inputMode="numeric" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Code"
            style={{ ...inputStyle, marginTop: 20, letterSpacing: 4 }} />
          <div style={{ marginTop: 16 }}><Button full onClick={onOtp} disabled={otp.length < 4}>Continue</Button></div>
        </>
      ) : (
        <>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: colors.inkSoft }}>
            We've sent a prompt to {masked} for {formatMoney(gift.total)}. Approve it with your mobile money PIN
            on your phone. {message && message !== 'Approve the prompt on your phone with your mobile money PIN.' ? message : ''}
          </p>
          <p style={{ marginTop: 16, fontSize: 12, lineHeight: 1.7, color: colors.inkMuted }}>
            No prompt after a minute? {network?.id === 'mtn' ? 'Dial *170#, choose My Wallet, then My Approvals. ' : ''}
            BURDEN will never ask for your PIN.
          </p>
          <div aria-live="polite" style={{ marginTop: 32, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.inkMuted }}>
            {demo ? 'Demo — approving in a moment…' : 'Waiting for your approval…'}
          </div>
        </>
      )}
      {error && <p role="alert" style={{ marginTop: 16, fontSize: 13, color: colors.fundLow }}>{error}</p>}
      <div style={{ marginTop: 32 }}>
        <Button variant="ghost" onClick={demo || state === 'otp' ? onCancel : () => onDone(gift)}>
          {demo || state === 'otp' ? 'Back' : 'Follow this gift'}
        </Button>
      </div>
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
