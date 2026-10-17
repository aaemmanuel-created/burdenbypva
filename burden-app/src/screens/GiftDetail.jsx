import { useEffect, useState } from 'react'
import { colors, font, type } from '../theme.js'
import { Button, Label, formatMoney } from '../components/UI.jsx'
import Timeline from '../components/Timeline.jsx'
import { campaigns } from '../data/mock.js'
import { PAYMENT_METHODS, fetchGiftStatus, liveCheckout } from '../lib/payments.js'

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
        const { gift: server, events } = await fetchGiftStatus(id, gift.token)
        if (stopped) return
        setError('')
        updateGift(id, { ...server, events })
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
        {gift.fromCredit ? 'Paid from account credit' : gift.live && method ? method.detail.split('.')[0] : 'Demo checkout'}
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

const backLink = {
  background: 'transparent', border: 'none', padding: 0,
  fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
  color: colors.inkSoft, marginBottom: 32, cursor: 'pointer',
}
