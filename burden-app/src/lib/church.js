// Church accounts on the web. Live (VITE_SUPABASE_URL set): staff sign in
// with a one-time code sent to their email (Supabase Auth) and the `church`
// edge function decides what they may see and do. Demo (no server): pick a
// church and everything happens in this browser, so the whole loop — confirm
// a gift, post an update — can be tried end to end.

import { createClient } from '@supabase/supabase-js'
import { liveCheckout } from './payments.js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const churchLive = liveCheckout && !!ANON_KEY
const supabase = churchLive ? createClient(SUPABASE_URL, ANON_KEY) : null

export async function sendCode(email) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) throw new Error('We could not send a code to that email. Please check it and try again.')
}

export async function verifyCode(email, code) {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
  if (error) throw new Error('That code did not work. Codes last a few minutes — ask for a new one if needed.')
}

export async function currentSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
}

async function call(method, body) {
  const session = await currentSession()
  if (!session) throw new Error('Please sign in.')
  const res = await fetch(`${SUPABASE_URL}/functions/v1/church`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${session.access_token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.')
  return json
}

// → { email, churches: [{ churchId, me, burdens, totals, gifts, updates, payout, team }] }
export const loadDashboard = () => call('GET')
export const churchAction = (churchId, action, fields) => call('POST', { churchId, action, ...fields })

// Updates for one burden, live (public feed).
export async function fetchBurdenUpdates(campaignId) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/burden-updates?campaign=${encodeURIComponent(campaignId)}`, {
    headers: { apikey: ANON_KEY ?? '', Authorization: `Bearer ${ANON_KEY ?? ''}` },
  })
  if (!res.ok) throw new Error('Could not load updates.')
  return res.json()
}
