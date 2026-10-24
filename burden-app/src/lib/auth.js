// Sign-in for everyone on BURDEN — givers, church staff and the BURDEN team —
// with a one-time code sent by email (Supabase Auth). No passwords. What a
// signed-in person may see is decided by the server (account, church, admin
// functions), never here.
//
// Demo (no server): any email works and the code is 123456, so the whole
// flow can be tried; accounts live in this browser only (lib/account.js).

import { createClient } from '@supabase/supabase-js'
import { liveCheckout } from './payments.js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const authLive = liveCheckout && !!ANON_KEY
const supabase = authLive ? createClient(SUPABASE_URL, ANON_KEY) : null

export const DEMO_CODE = '123456'
const DEMO_SESSION_KEY = 'burden-demo-session-v1'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function sendCode(email) {
  if (!EMAIL_RE.test(email)) throw new Error('Enter your email address.')
  if (!authLive) return
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) throw new Error('We could not send a code to that email. Please check it and try again.')
}

export async function verifyCode(email, code) {
  if (!authLive) {
    if (code !== DEMO_CODE) throw new Error(`That code did not work. In the demo the code is ${DEMO_CODE}.`)
    const session = { demo: true, user: { email: email.toLowerCase() } }
    try { localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session)) } catch { /* private mode */ }
    return session
  }
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
  if (error) throw new Error('That code did not work. Codes last a few minutes — ask for a new one if needed.')
  return data.session
}

// → { access_token?, user: { email } } or null
export async function currentSession() {
  if (!authLive) {
    try { return JSON.parse(localStorage.getItem(DEMO_SESSION_KEY) || 'null') } catch { return null }
  }
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signOut() {
  if (!authLive) { try { localStorage.removeItem(DEMO_SESSION_KEY) } catch { /* private mode */ } return }
  await supabase.auth.signOut()
}

// Call one of BURDEN's functions as the signed-in person.
export async function callFunction(name, method = 'GET', body) {
  const session = await currentSession()
  if (!session?.access_token) throw new Error('Please sign in.')
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${session.access_token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.')
  return json
}

// Public functions (no sign-in): fundraisers, burden content, reports, applications.
export async function callPublic(path, method = 'GET', body) {
  const session = authLive ? await currentSession() : null
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY ?? '', Authorization: `Bearer ${session?.access_token ?? ANON_KEY ?? ''}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.')
  return json
}
