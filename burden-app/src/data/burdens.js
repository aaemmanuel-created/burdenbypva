// Adapt the existing campaign/church mock data into the shape the new
// glass-blue screens expect (church label, objective, state, handlers,
// workflow, delivery, prayer focus).
//
// Kept as a thin derivation so the canonical mock data in mock.js stays
// untouched — change a campaign field and both old + new screens update.

import { campaigns, churches } from './mock.js'

const PRAYER_MEETS = {
  cmp_grace_school: 'Saturdays · 9:00am EAT',
  cmp_redeemer_clinic: 'Thursdays · 7:00pm WAT',
  cmp_andrew_bursary: 'Sundays · 5:00pm GMT',
  cmp_allnations_meals: 'Wednesdays · 7:00pm BST',
  cmp_lighthouse_rebuild: 'Tuesdays · 8:00pm PHT',
}

// One campaign is the editorial pick — same id as the highlight in the
// original Home screen, so the "of the week" surface stays consistent.
const FEATURED_ID = 'cmp_redeemer_clinic'

// This week's Spree selection — five burdens, all of the live campaigns.
// SPREE_TOTAL is the dollar target (1 per burden).
const SPREE_IDS = new Set([
  'cmp_grace_school',
  'cmp_redeemer_clinic',
  'cmp_andrew_bursary',
  'cmp_allnations_meals',
  'cmp_lighthouse_rebuild',
])

function adaptOne(campaign) {
  const church = churches.find((c) => c.id === campaign.churchId)
  const churchLabel = church ? `${church.name} · ${church.location.split(',')[0]}` : ''
  return {
    id: campaign.id,
    churchId: campaign.churchId,
    church: churchLabel,
    churchFull: church,
    name: campaign.title,
    tag: campaign.category,
    featured: campaign.id === FEATURED_ID,
    objective: campaign.objective || campaign.summary,
    state: {
      raised: campaign.raised,
      goal: campaign.goal,
      currency: '$',
      note: campaign.currentState || campaign.summary,
    },
    handlers: (campaign.team || []).map((t) => ({ role: t.role, person: t.name })),
    workflow: campaign.moneyWorkflow || [],
    delivery: campaign.currentState || campaign.summary,
    prayer: {
      members: campaign.prayerGroup?.members ?? 0,
      meets: PRAYER_MEETS[campaign.id] || 'Weekly · check church bulletin',
      focus: campaign.prayerGroup?.focusLine || '',
    },
    daysLeft: campaign.daysLeft,
    donors: campaign.donors,
  }
}

export const burdens = campaigns.map(adaptOne)

export const spreeIds = SPREE_IDS
export const spreeTotal = SPREE_IDS.size

export function findBurden(id) {
  return burdens.find((b) => b.id === id)
}

export function formatMoney(amount, currency = '$') {
  return currency + amount.toLocaleString('en-US')
}

export function pct(raised, goal) {
  return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)))
}

export function vibrate(pattern) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try { navigator.vibrate(pattern) } catch (_) { /* no-op */ }
}
