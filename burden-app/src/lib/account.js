// A giver's account: gifts and fundraisers that belong to a person, not a
// device. Live: the `account` and `fundraisers` functions. Demo: accounts
// are kept in this browser under each email, so signing out and back in
// (or in as someone else) shows what the server would.
// Mirrors burden-native/src/lib/account.ts.

import { authLive, callFunction, callPublic } from './auth.js'
import { demoReport } from './trust.js'

const DEMO_ACCOUNTS_KEY = 'burden-demo-accounts-v1'

function demoStore() {
  try { return JSON.parse(localStorage.getItem(DEMO_ACCOUNTS_KEY) || '{}') } catch { return {} }
}
function saveDemoStore(store) {
  try { localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(store)) } catch { /* private mode */ }
}

// Gifts and fundraisers on the device are added to the account; the
// account's are returned. → { gifts, fundraisers }
export async function syncAccount(email, deviceGifts, deviceFundraisers) {
  if (!authLive) {
    const store = demoStore()
    const acc = store[email] || { gifts: [], fundraisers: [] }
    const byId = (a, b) => [...a.filter(x => !b.some(y => y.id === x.id)), ...b]
    acc.gifts = byId(acc.gifts, deviceGifts)
    acc.fundraisers = byId(acc.fundraisers, deviceFundraisers.map(f => ({ ...f, own: true })))
    store[email] = acc
    saveDemoStore(store)
    return acc
  }
  // Gifts made here before signing in carry their checkout token — proof to claim them.
  const unclaimed = deviceGifts.filter(g => g.live && g.token && !g.account).map(g => ({ id: g.id, token: g.token }))
  if (unclaimed.length) await callFunction('account', 'POST', { action: 'claim', gifts: unclaimed })
  const res = await callFunction('account', 'GET')
  // Keep this device's token where it has one (it unlocks refunds and status checks).
  const gifts = res.gifts.map(s => {
    const local = deviceGifts.find(g => g.id === s.id)
    return local ? { ...local, ...s, token: local.token } : s
  })
  return { gifts, fundraisers: res.fundraisers }
}

// Demo: every change while signed in is saved to the account.
export function saveDemoAccount(email, gifts, fundraisers) {
  if (authLive || !email) return
  const store = demoStore()
  store[email] = { gifts, fundraisers }
  saveDemoStore(store)
}

export async function startFundraiserOnServer(fields) {
  const { fundraiser } = await callFunction('account', 'POST', { action: 'fundraise', ...fields })
  return fundraiser
}

export async function closeFundraiser(id) {
  if (authLive) await callFunction('account', 'POST', { action: 'close', fundraiser: id })
}

export async function deleteAccount(email) {
  if (!authLive) {
    const store = demoStore()
    delete store[email]
    saveDemoStore(store)
    return
  }
  await callFunction('account', 'POST', { action: 'delete' })
}

// Public: everyone's open fundraisers on a burden, or one by id (shared links).
export async function fetchFundraisers(campaignId) {
  if (!authLive) {
    // Demo: fundraisers started by any account in this browser are public here.
    return Object.values(demoStore()).flatMap(a => a.fundraisers || [])
      .filter(f => f.campaignId === campaignId && !f.closed).map(({ own, ...f }) => f)
  }
  return (await callPublic(`fundraisers?campaign=${encodeURIComponent(campaignId)}`)).fundraisers
}

export async function fetchFundraiser(id) {
  if (!authLive) return Object.values(demoStore()).flatMap(a => a.fundraisers || []).find(f => f.id === id) || null
  return (await callPublic(`fundraisers?id=${encodeURIComponent(id)}`)).fundraisers[0] || null
}

// Anyone can report an update, a word of support or a fundraiser; a person on
// the BURDEN team decides (nothing is taken down automatically).
export async function reportContent(fields) {
  if (!authLive) return demoReport(fields)
  const { text, ...rest } = fields
  return callPublic('report', 'POST', rest)
}
