// Church accounts on the web. Live (VITE_SUPABASE_URL set): staff sign in
// with a one-time code sent to their email (lib/auth.js) and the `church`
// edge function decides what they may see and do. Demo (no server): pick a
// church and everything happens in this browser, so the whole loop — confirm
// a gift, post an update — can be tried end to end.

import { authLive, callFunction, callPublic } from './auth.js'

export { currentSession, sendCode, signOut, verifyCode } from './auth.js'
export const churchLive = authLive

// → { email, churches: [{ churchId, me, burdens, totals, gifts, updates, payout, team, edits, content }] }
export const loadDashboard = () => callFunction('church', 'GET')
export const churchAction = (churchId, action, fields) => callFunction('church', 'POST', { churchId, action, ...fields })

// Updates for one burden, live (public feed).
export const fetchBurdenUpdates = (campaignId) => callPublic(`burden-updates?campaign=${encodeURIComponent(campaignId)}`)

// A church asks to join BURDEN (reviewed in the admin console).
export const applyAsChurch = (fields) => callPublic('church-apply', 'POST', fields)
