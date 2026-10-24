// Talks to the BURDEN payment server (Supabase edge functions in
// ../../supabase/functions). When VITE_SUPABASE_URL isn't set the app
// stays on the demo checkout and no money is ever involved.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const liveCheckout = Boolean(SUPABASE_URL)

export const PAYMENT_METHODS = [
  {
    id: 'stripe',
    label: 'Card, Apple Pay or Google Pay',
    detail: 'Processed by Stripe. Best for UK, US and European cards.',
  },
  {
    id: 'paystack',
    label: 'Mobile money or card — Ghana & Nigeria',
    detail: 'Processed by Paystack. MTN MoMo, Telecel Cash, AirtelTigo, bank and local cards.',
  },
  {
    id: 'flutterwave',
    label: 'Mobile money, M-Pesa or card — across Africa',
    detail: 'Processed by Flutterwave. M-Pesa, MoMo, bank transfer and cards.',
  },
]

function headers() {
  const h = { 'Content-Type': 'application/json' }
  if (ANON_KEY) { h.apikey = ANON_KEY; h.Authorization = `Bearer ${ANON_KEY}` }
  return h
}

async function call(path, init) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, { ...init, headers: headers() })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'Something went wrong. Please try again.')
  return body
}

// → { giftId, token, checkoutUrl, testMode }
export function startCheckout(payload) {
  return call('create-gift', { method: 'POST', body: JSON.stringify(payload) })
}

// Approve on your phone (mobile money in Ghana) — the network sends the donor
// a prompt and they approve with their PIN on the phone; BURDEN never sees it.
// → { giftId, token, testMode, planId?, planToken?, state: approve|otp|paid|failed, message? }
export function startMomoCharge(payload) {
  return call('momo-charge', { method: 'POST', body: JSON.stringify(payload) })
}

// Some networks (Telecel vouchers) send a code first. → { state, message? }
export function submitMomoOtp(id, token, otp) {
  return call('momo-otp', { method: 'POST', body: JSON.stringify({ gift: id, t: token, otp }) })
}

// Stop a monthly gift with the plan token from the first gift.
export function cancelMonthlyGift(planId, planToken) {
  return call('cancel-recurring', { method: 'POST', body: JSON.stringify({ plan: planId, t: planToken }) })
}

// Ghana numbers: 024 123 4567, +233 24 123 4567 → 0241234567 (as the server does).
export function normaliseGhanaPhone(raw) {
  let d = String(raw || '').replace(/[\s\-().]/g, '')
  if (d.startsWith('+')) d = d.slice(1)
  if (d.startsWith('233')) d = '0' + d.slice(3)
  return /^0[25]\d{8}$/.test(d) ? d : null
}

export const MOMO_NETWORKS = [
  { id: 'mtn', label: 'MTN MoMo' },
  { id: 'telecel', label: 'Telecel Cash' },
  { id: 'airteltigo', label: 'AirtelTigo Money' },
]

// The USSD short code, once BURDEN rents one (e.g. "*713*55#"). Unset: not shown.
export const USSD_CODE = import.meta.env.VITE_BURDEN_USSD_CODE || ''

// Approved words of support for one burden (the review queue's public end).
// → { words: [{ name, message, date }] }
export function fetchSupportWords(campaignId) {
  return call(`support-messages?campaign=${encodeURIComponent(campaignId)}`, { method: 'GET' })
}

// → { gift, events, plan }
export function fetchGiftStatus(id, token) {
  return call(`gift-status?gift=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`, { method: 'GET' })
}

// Where the provider should send the donor back to: this page, minus any query.
export function returnUrl() {
  return window.location.origin + window.location.pathname
}

// After checkout the server redirects to ?gift=<id>&t=<token>. Read it once
// and tidy the address bar so a refresh doesn't re-trigger it.
export function takeCheckoutReturn() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const id = params.get('gift')
  const token = params.get('t')
  if (!id || !token) return null
  window.history.replaceState(null, '', window.location.pathname)
  return { id, token }
}
