// The five-step gift tracking timeline (Remitly-style), built from a gift's
// status + events. Same logic as burden-native/src/lib/giftTimeline.ts —
// keep the two in step.
//
//   Burden shared → Payment confirmed → Held securely → Paid to church → Church confirms
//
// Events come from the server (live checkout) or are made up locally
// (demo checkout / account credit) by demoEvents().

export const HOLD_HOURS = 72

const fmtWhen = (iso) => new Date(iso).toLocaleString('en-GB', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
})
const fmtDay = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

// Demo / credit gifts never touch a provider: they are "confirmed" at once
// and the hold, payout and church step play out on the clock. The church
// step can't be simulated honestly, so it stays waiting.
export function demoEvents(timestamp, note) {
  return [
    { step: 'gift_sent', occurred_at: timestamp },
    { step: 'payment_confirmed', occurred_at: timestamp, note },
    { step: 'held', occurred_at: timestamp },
  ]
}

export function demoHoldUntil(timestamp) {
  return new Date(new Date(timestamp).getTime() + HOLD_HOURS * 3600_000).toISOString()
}

// Brings a local demo gift's status up to date (held → paid out after the hold).
export function settleDemoGift(gift, now = Date.now()) {
  if (gift.live || gift.status !== 'held' || !gift.holdUntil) return gift
  if (new Date(gift.holdUntil).getTime() > now) return gift
  return {
    ...gift,
    status: 'paid_out',
    events: [...gift.events, {
      step: 'paid_out', occurred_at: gift.holdUntil, note: 'Simulated payout — demo, no money moved.',
    }],
  }
}

export function buildTimeline(gift) {
  const at = Object.fromEntries((gift.events || []).map(e => [e.step, e]))
  const church = gift.churchName
  const failed = gift.status === 'failed' || gift.status === 'cancelled'

  const steps = [
    {
      key: 'gift_sent',
      label: 'Burden shared',
      done: !!at.gift_sent,
      time: at.gift_sent && fmtWhen(at.gift_sent.occurred_at),
      detail: 'Your gift was recorded with BURDEN.',
    },
    {
      key: 'payment_confirmed',
      label: failed ? (gift.status === 'cancelled' ? 'Checkout not completed' : 'Payment declined') : 'Payment confirmed',
      done: !!at.payment_confirmed,
      failed,
      time: at.payment_confirmed ? fmtWhen(at.payment_confirmed.occurred_at)
        : failed && (at.failed || at.cancelled) ? fmtWhen((at.failed || at.cancelled).occurred_at) : null,
      detail: failed ? gift.statusNote
        : at.payment_confirmed ? (at.payment_confirmed.note || 'Your payment went through.')
        : 'Waiting for the payment provider to confirm.',
    },
    {
      key: 'held',
      label: 'Held securely',
      done: !!at.paid_out,
      time: gift.holdUntil && !at.paid_out ? `until ${fmtDay(gift.holdUntil)}` : at.held && fmtWhen(at.held.occurred_at),
      detail: `Kept in BURDEN's protected account while the gift clears. Within 7 days of giving you can ask for a full refund.`,
    },
    {
      key: 'paid_out',
      label: 'Paid to church',
      done: !!at.paid_out,
      time: at.paid_out ? fmtWhen(at.paid_out.occurred_at) : gift.holdUntil && `est. ${fmtDay(gift.holdUntil)}`,
      detail: at.paid_out?.note || `Sent to ${church}'s verified ${gift.payoutTo || 'payout account'}.`,
    },
    {
      key: 'church_confirmed',
      label: 'Church confirms',
      done: !!at.church_confirmed,
      time: at.church_confirmed ? fmtWhen(at.church_confirmed.occurred_at) : 'after payout',
      detail: at.church_confirmed?.note || `${church} confirms the funds arrived and shares how they are used.`,
    },
  ]

  // A refund (within 7 days) ends the timeline: it is added as its own
  // step, and anything not yet done will not happen.
  const refunded = !!at.refunded
  if (refunded) {
    steps.push({
      key: 'refunded',
      label: 'Refunded',
      done: true,
      time: fmtWhen(at.refunded.occurred_at),
      detail: at.refunded.note || 'Your gift was refunded in full.',
    })
  }

  // The first unfinished step is the one in progress — unless the payment
  // failed, in which case nothing after it will happen.
  const currentIndex = failed ? 1 : refunded ? -1 : steps.findIndex(s => !s.done)
  return steps.map((s, i) => ({
    ...s,
    state: s.done ? 'done'
      : s.failed ? 'failed'
      : i === currentIndex ? 'current'
      : failed || refunded ? 'stopped'
      : 'upcoming',
  }))
}

// One short phrase for lists (giving history).
export function statusLabel(gift) {
  switch (gift.status) {
    case 'initiated': return 'Awaiting payment'
    case 'held': return 'Held securely'
    case 'paid_out': return 'Paid to church'
    case 'church_confirmed': return 'Church confirmed'
    case 'failed': return 'Payment declined'
    case 'cancelled': return 'Not completed'
    case 'refunded': return 'Refunded'
    default: return ''
  }
}

// Gifts that count towards "lifetime giving".
export const isGiven = (gift) => !['initiated', 'failed', 'cancelled', 'refunded'].includes(gift.status)
