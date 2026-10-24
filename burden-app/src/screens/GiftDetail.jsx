import { useEffect, useState } from 'react'
import { colors, font, type } from '../theme.js'
import { Button, Label, formatMoney } from '../components/UI.jsx'
import Timeline from '../components/Timeline.jsx'
import { campaigns } from '../data/mock.js'
import { PAYMENT_METHODS, cancelMonthlyGift, fetchGiftStatus, liveCheckout } from '../lib/payments.js'

// One gift and where it has got to. Live gifts refresh from the server —
// every few seconds while the payment is still being confirmed, once
// otherwise.

const POLL_MS = 4000
const POLL_FOR_MS = 3 * 60_000

export default function GiftDetail({ gift, navigate, updateGift }) {
  const [error, setError] = useState('')

  const id = gift?.id
  // Only talk to the server when this build has one configured.
  const live = gift?.live && liveCheckout
  const awaiting = gift?.status === 'initiated'

  useEffect(() => {
    if (!live) return
    let stopped = false
    let timer
    const started = Date.now()
    async function refresh() {
      try {
        const { gift: server, events, plan, supportStatus } = await fetchGiftStatus(id, gift.token)
        if (stopped) return
        setError('')
        updateGift(id, { ...server, events, ...(plan ? { plan } : {}), supportStatus })
        if (server.status === 'initiated' && Date.now() - started < POLL_FOR_MS) {
          timer = setTimeout(refresh, POLL_MS)
        }
      } catch (e) {
        if (!stopped) setError(e.message)
      }
    }
    refresh()
    return () => { stopped = true; clearTimeout(timer) }
    // Re-run only when switching gifts; refresh() schedules itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, live])

  if (!gift) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 28px' }}>
        <p>Gift not found on this device.</p>
        <Button onClick={() => navigate({ name: 'history' })}>Giving history</Button>
      </main>
    )
  }

  const campaign = campaigns.find(c => c.id === gift.campaignId)
  const method = PAYMENT_METHODS.find(m => m.id === gift.provider)
  const declined = gift.status === 'failed' || gift.status === 'cancelled'

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 28px 96px' }}>
      <button onClick={() => navigate({ name: 'history' })} style={backLink}>← Giving history</button>

      <Label>Your gift</Label>
      <h1 style={{
        fontFamily: font.serif, fontSize: type['2xl'].fontSize, fontWeight: 600, letterSpacing: '-1.5%',
        lineHeight: type['2xl'].lineHeight, margin: '16px 0 8px',
      }}>
        {formatMoney(gift.amount)} to {gift.churchName}
      </h1>
      <div style={{ fontSize: type.sm.fontSize, color: colors.inkSoft }}>
        {gift.campaignTitle}
        {gift.coveredFee > 0 && ` · ${formatMoney(gift.coveredFee)} fee covered`}
        {gift.recurring && ' · Monthly'}
        {gift.anonymous && ' · Anonymous'}
      </div>
      <div style={{ fontSize: type.xs.fontSize, color: colors.inkMuted, marginTop: 8 }}>
        {gift.fromCredit ? 'Paid from account credit'
          : gift.momo ? `${gift.momo} — approved on your phone`
          : gift.live && method ? method.detail.split('.')[0] : 'Demo checkout'}
        {(gift.testMode || !gift.live) && ' · Test only — no real money moved'}
      </div>

      <section style={{ marginTop: 48 }}>
        <Label style={{ marginBottom: 24 }}>Progress</Label>
        <Timeline gift={gift} />
        {awaiting && live && (
          <p style={{ fontSize: type.xs.fontSize, color: colors.inkMuted, marginTop: 24 }}>
            Checking with the payment provider…
          </p>
        )}
        {error && (
          <p role="alert" style={{ fontSize: type.sm.fontSize, color: colors.fundLow, marginTop: 24 }}>{error}</p>
        )}
      </section>

      {gift.message && !declined && (
        <section style={{ marginTop: 48 }}>
          <Label style={{ marginBottom: 16 }}>Your words of support</Label>
          <p style={{ fontSize: type.sm.fontSize, lineHeight: 1.7, color: colors.ink }}>"{gift.message}"</p>
          <p style={{ fontSize: type.xs.fontSize, lineHeight: 1.6, color: colors.inkMuted, marginTop: 8 }}>
            {supportNote(gift)}
          </p>
        </section>
      )}

      {gift.recurring && !declined && (
        <MonthlyGift gift={gift} live={live} updateGift={updateGift} />
      )}

      {campaign?.moneyWorkflow && !declined && (
        <section style={{ marginTop: 48 }}>
          <Label style={{ marginBottom: 16 }}>Where your money goes</Label>
          <ol style={{ margin: 0, paddingLeft: 20, color: colors.inkSoft, fontSize: type.sm.fontSize, lineHeight: 1.6 }}>
            {campaign.moneyWorkflow.map((line, i) => <li key={i} style={{ marginBottom: 8 }}>{line}</li>)}
          </ol>
        </section>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 48 }}>
        {declined
          ? <Button onClick={() => navigate({ name: 'give', id: gift.campaignId })}>Try again</Button>
          : <Button onClick={() => navigate({ name: 'campaign', id: gift.campaignId })}>View the burden</Button>}
        <Button variant="ghost" onClick={() => navigate({ name: 'discover' })}>Back to Discover</Button>
      </div>
    </main>
  )
}

// Where the giver's words stand in the review queue (supabase moderation.ts).
function supportNote(gift) {
  if (!gift.live) return 'Demo — in the live app every message is checked before others see it.'
  switch (gift.supportStatus) {
    case 'approved': return 'Checked and shown on the burden page.'
    case 'rejected': return 'These words could not be published. Links, contact details and requests for money are not allowed. Your gift is unaffected.'
    case 'held': return 'A BURDEN reviewer will read them before they appear.'
    default: return 'They will be checked once your payment is confirmed, then shown on the burden page.'
  }
}

// A monthly gift: whether it is running, how each month is paid, and a way to stop it.
function MonthlyGift({ gift, live, updateGift }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const plan = gift.plan || { status: gift.live ? 'pending' : 'active', method: gift.momo ? 'momo' : 'card' }
  const running = plan.status === 'active' || plan.status === 'pending'
  const next = plan.nextChargeAt
    ? new Date(plan.nextChargeAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    : null
  const how = plan.method === 'momo'
    ? 'Each month we send a prompt to your phone and you approve it with your PIN.'
    : plan.method === 'subscription' ? 'Your card is charged each month by Stripe.'
    : 'Your card is charged again each month.'
  async function stop() {
    setBusy(true); setError('')
    try {
      if (live && gift.planId && gift.planToken) await cancelMonthlyGift(gift.planId, gift.planToken)
      updateGift(gift.id, { plan: { ...plan, status: 'cancelled', note: 'You stopped this monthly gift.' } })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section style={{ marginTop: 48 }}>
      <Label style={{ marginBottom: 16 }}>Monthly gift</Label>
      <p style={{ fontSize: type.sm.fontSize, lineHeight: 1.7, color: colors.inkSoft }}>
        {running
          ? <>{how} {plan.status === 'pending' ? 'It starts once this first gift is confirmed.' : next ? `Next: ${next}.` : ''}</>
          : plan.note || 'This monthly gift has stopped.'}
        {!gift.live && ' Demo — no money moves.'}
      </p>
      {error && <p role="alert" style={{ fontSize: type.sm.fontSize, color: colors.fundLow, marginTop: 12 }}>{error}</p>}
      {running && (live ? gift.planToken : true) && (
        <div style={{ marginTop: 16 }}>
          <Button variant="ghost" onClick={stop} disabled={busy}>{busy ? 'Stopping…' : 'Stop monthly gift'}</Button>
        </div>
      )}
    </section>
  )
}

const backLink = {
  background: 'transparent', border: 'none', padding: 0,
  fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
  color: colors.inkSoft, marginBottom: 32, cursor: 'pointer',
}
