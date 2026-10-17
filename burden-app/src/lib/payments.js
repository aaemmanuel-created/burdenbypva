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

// → { gift, events }
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
