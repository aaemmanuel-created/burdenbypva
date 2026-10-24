// Updates, words of support, fundraisers and sharing for a burden — the
// three community pieces studied from GoFundMe's campaign page (REA,
// 2026-10-22) and reshaped to BURDEN's rules:
//   • Updates are dated posts from the named people on the burden's team.
//   • Words of support come only from givers and never show the amount —
//     no leaderboard, no "top donor".
//   • A fundraiser is someone carrying the burden with their own circle;
//     every gift through it still goes to the church's verified account.
// Demo content lives in data/community.json (mirrored in burden-native).
// Mirrors burden-native/src/lib/community.ts.
import community from '../data/community.json'
import { isGiven } from './giftTimeline.js'

export const SITE_URL = 'https://aaemmanuel-created.github.io/burdenbypva/'
export const MESSAGE_MAX = 280

// "14 OCT 2026" — dates read as a ledger would.
export function formatDay(iso) {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00Z' : iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase()
}

export function updatesFor(campaignId) {
  return [...(community.updates[campaignId] || [])].sort((a, b) => b.date.localeCompare(a.date))
}

// Words of support, newest first. Live: only what the server's review queue
// approved, plus the donor's own words still waiting (shown to them alone).
// Demo: the seeded words plus the donor's own.
export function supportFor(campaignId, gifts = [], liveWords = null) {
  const mine = gifts.filter(g => g.campaignId === campaignId && g.message && isGiven(g))
  const name = g => (g.anonymous ? 'Anonymous' : (g.donorName || 'You'))
  if (liveWords) {
    const waiting = mine
      .filter(g => !['approved', 'rejected'].includes(g.supportStatus))
      .map(g => ({ name: name(g), date: g.timestamp, message: g.message, own: true, waiting: true }))
    return [...waiting, ...liveWords].sort((a, b) => b.date.localeCompare(a.date))
  }
  const own = mine.map(g => ({ name: name(g), date: g.timestamp, message: g.message, own: true }))
  const seeded = community.support[campaignId] || []
  return [...own, ...seeded].sort((a, b) => b.date.localeCompare(a.date))
}

// Seeded fundraisers plus the donor's own; each one's total adds the gifts
// given through it on this device.
export function fundraisersFor(campaignId, own = [], gifts = []) {
  const all = [...own.filter(f => f.campaignId === campaignId), ...(community.fundraisers[campaignId] || [])]
  return all.map(f => ({
    ...f,
    raised: f.raised + gifts
      .filter(g => g.fundraiserId === f.id && isGiven(g))
      .reduce((sum, g) => sum + g.amount, 0),
  }))
}

export function findFundraiser(id, own = []) {
  if (!id) return null
  return own.find(f => f.id === id)
    || Object.values(community.fundraisers).flat().find(f => f.id === id)
    || null
}

export function shareUrl(campaignId, fundraiserId) {
  return SITE_URL + '?burden=' + campaignId + (fundraiserId ? '&f=' + fundraiserId : '')
}

// Plain words, no urgency — the link carries the rest.
export function shareText(campaign, church, fundraiser) {
  const lead = fundraiser
    ? `I'm helping carry a burden for ${church.name}: ${campaign.title}.`
    : `${church.name} is carrying a burden: ${campaign.title}.`
  return `${lead} BURDEN shows where every dollar goes.`
}

// A link opened as ?burden=<id>[&f=<fundraiser>] goes straight to that burden.
export function takeShareLink() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const burden = params.get('burden')
  if (!burden) return null
  const fundraiserId = params.get('f')
  params.delete('burden'); params.delete('f')
  const rest = params.toString()
  window.history.replaceState(null, '', window.location.pathname + (rest ? '?' + rest : ''))
  return { id: burden, fundraiserId }
}
