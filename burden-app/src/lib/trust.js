// Trust and safety on the web: the KYB checks, burden wording churches have
// changed (once approved), reports, and — in the demo — a stand-in for the
// admin console's server so the whole loop runs in this browser:
// a church proposes new wording → a reviewer approves → the burden page shows it.
// The rules mirror supabase/functions/_shared/admin-logic.ts; keep them in step.

import { useEffect, useState } from 'react'
import { campaigns } from '../data/mock.js'
import { authLive, callFunction, callPublic } from './auth.js'

// ── KYB (admin-logic.ts KYB_CHECKS) ─────────────────────────────────────

export const KYB_CHECKS = [
  { id: 'registration', tier: 'Basic', label: 'Registered with a recognised body — number checked on the register' },
  { id: 'leadership', tier: 'Basic', label: 'Named leader, and the oversight body they answer to, confirmed' },
  { id: 'creed', tier: 'Basic', label: 'Affirms the historic creeds; accountable Christian leadership' },
  { id: 'sanctions', tier: 'Basic', label: 'Church and leader names screened against sanctions lists — clear' },
  { id: 'references', tier: 'Verified', label: 'Two references outside the church contacted' },
  { id: 'address', tier: 'Verified', label: 'Place of worship confirmed (photo, map or visit)' },
  { id: 'bank', tier: 'Verified', label: "Payout account name matches the church's registered name" },
  { id: 'accounts', tier: 'Premium Trust', label: 'Last year’s financial statements seen (independently examined or audited)' },
  { id: 'visit', tier: 'Premium Trust', label: 'Video call or visit with the leader and the finance steward' },
]
export const TIERS = ['Basic', 'Verified', 'Premium Trust']
export const checksFor = tier => KYB_CHECKS.filter(c => TIERS.indexOf(c.tier) <= TIERS.indexOf(tier))
export const missingFor = (tier, checks) => checksFor(tier).filter(c => !checks?.[c.id]?.ok).map(c => c.id)
export function tierEarned(checks) {
  let earned = null
  for (const t of TIERS) { if (!missingFor(t, checks).length) earned = t; else break }
  return earned
}

// ── Burden wording (admin-logic.ts EDITABLE / flagsFor) ─────────────────

export const EDITABLE = [
  { id: 'summary', label: 'One-line summary', max: 240 },
  { id: 'objective', label: 'What this burden is for', max: 1200 },
  { id: 'currentState', label: 'Where things stand now', max: 1200 },
  { id: 'moneyWorkflow', label: 'Where the money goes, step by step', max: 400, list: true },
  { id: 'prayerFocus', label: 'What to pray for', max: 300 },
]
const URGENCY = /\b(urgent(ly)?|hurry|act now|last chance|before it'?s too late|only \d+ (days|hours) left|don'?t miss|time is running out)\b/i
const REWARD = /\b(sow (a|your) seed|seed (gift|offering)|hundred ?fold|god will (bless|reward|repay)|blessing in return|unlock (your )?(blessing|breakthrough)|breakthrough|harvest (will|is coming)|give to receive)\b/i
export function flagsFor(text) {
  const flags = []
  if (URGENCY.test(text)) flags.push('urgency')
  if (REWARD.test(text)) flags.push('spiritual reward')
  return flags
}

// The text each burden ships with, kept so approved wording can be laid over it.
const ORIGINAL = Object.fromEntries(campaigns.map(c => [c.id, {
  summary: c.summary, objective: c.objective, currentState: c.currentState,
  moneyWorkflow: c.moneyWorkflow, prayerFocus: c.prayerGroup?.focusLine,
}]))
export const originalWording = id => ORIGINAL[id]

// Lay approved wording over the shipped text. The mock campaigns are shared
// by every screen, so this updates them in place.
export function applyBurdenContent(content) {
  for (const c of campaigns) {
    const f = { ...ORIGINAL[c.id], ...(content?.[c.id] || {}) }
    c.summary = f.summary; c.objective = f.objective; c.currentState = f.currentState; c.moneyWorkflow = f.moneyWorkflow
    if (c.prayerGroup) c.prayerGroup = { ...c.prayerGroup, focusLine: f.prayerFocus }
    c.rewordedAt = content?.[c.id]?.approvedAt || null
  }
}

export async function loadBurdenContent() {
  if (!authLive) return readDemo().content
  return (await callPublic('burden-content')).content
}

// ── Demo store (the admin console's server, in this browser) ────────────

const DEMO_KEY = 'burden-trust-demo-v1'
const listeners = new Set()

function seed() {
  const day = n => new Date(Date.now() - n * 86400000).toISOString()
  return {
    applications: [{
      id: 'app_demo_hope', created_at: day(2), church_name: 'Hope Chapel', tradition: 'Pentecostal', city: 'Kumasi', country: 'Ghana',
      leader_name: 'Rev. Ama Owusu', leader_role: 'Senior Pastor', contact_email: 'office@hopechapel.example',
      registration_body: 'Registrar-General’s Department, Ghana', registration_no: 'G-48213', oversight: 'Ghana Pentecostal and Charismatic Council',
      website: 'https://hopechapel.example', references_text: 'Rev. Kwame Boateng (Methodist Church, Kumasi) — 024 000 0000; Dr. Efua Mensah (KNUST chaplaincy) — e.mensah@example.org',
      creed_affirmed: true, status: 'submitted', checks: {},
    }],
    tiers: {},
    edits: [],
    content: {},
    held: [{ id: 9001, created_at: day(1), campaign_id: 'cmp_grace_school', display_name: 'Peter', message: 'Praying for the children. WhatsApp me on 0712 000 000 if you need volunteers.', reasons: ['contact details'] }],
    reports: [{ id: 7001, created_at: day(1), kind: 'support', ref: 'demo', campaign_id: 'cmp_redeemer_clinic', reason: 'scam', detail: 'Asks people to send money to a private number.', reporter: 'anonymous', text: '“Send your gift direct to my account for faster help” — J. Okoro', status: 'open' }],
    screening: [{ id: 5001, created_at: day(3), subject_type: 'donor', subject_ref: 'gift giver', name: 'Viktor Petrov', matched_name: 'PETROV, Viktor Ivanovich', list: 'OFAC SDN', score: 0.93, decision: 'review' }],
    audit: [],
    hidden: [], // { kind, ref } removed after a report
  }
}

function readDemo() {
  try { return JSON.parse(localStorage.getItem(DEMO_KEY) || 'null') || seed() } catch { return seed() }
}
function writeDemo(next) {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(next)) } catch { /* private mode */ }
  listeners.forEach(fn => fn(next))
}

// The demo store, kept current across screens.
export function useDemoTrust() {
  const [state, setState] = useState(readDemo)
  useEffect(() => { listeners.add(setState); return () => listeners.delete(setState) }, [])
  return state
}

export function demoAudit(actor, action, subjectType, subjectId, detail = {}) {
  const s = readDemo()
  s.audit = [{ id: Date.now() + Math.random(), at: new Date().toISOString(), actor, action, subject_type: subjectType, subject_id: String(subjectId), detail }, ...s.audit].slice(0, 300)
  writeDemo(s)
}

export function demoReport({ kind, ref, campaignId, reason, detail, text }) {
  const s = readDemo()
  if (!s.reports.some(r => r.kind === kind && r.ref === ref && r.status === 'open')) {
    s.reports = [...s.reports, { id: Date.now(), created_at: new Date().toISOString(), kind, ref, campaign_id: campaignId, reason, detail: detail || null, reporter: 'anonymous', text: text || '', status: 'open' }]
    writeDemo(s)
  }
}

export function demoSubmitEdit(churchId, campaignId, fields, actor) {
  const s = readDemo()
  const flags = flagsFor(Object.values(fields).flat().join('\n'))
  s.edits = s.edits.map(e => (e.campaign_id === campaignId && e.status === 'pending' ? { ...e, status: 'withdrawn' } : e))
  const id = Date.now()
  s.edits = [{ id, created_at: new Date().toISOString(), campaign_id: campaignId, church_id: churchId, submitted_by: actor, fields, flags, status: 'pending' }, ...s.edits]
  writeDemo(s)
  demoAudit(actor, 'edit.submit', 'burden', campaignId, { edit: id, fields: Object.keys(fields), flags })
  return flags
}

export function demoApply(f) {
  const s = readDemo()
  const id = 'app_' + Date.now()
  s.applications = [...s.applications, {
    id, created_at: new Date().toISOString(), church_name: f.churchName, tradition: f.tradition, city: f.city, country: f.country,
    leader_name: f.leaderName, leader_role: f.leaderRole, contact_email: f.email.toLowerCase(), registration_body: f.registrationBody,
    registration_no: f.registrationNo, oversight: f.oversight, website: f.website || null, references_text: f.references,
    creed_affirmed: true, status: 'submitted', checks: {},
  }]
  writeDemo(s)
  demoAudit('applicant', 'application.submit', 'application', id, { church: f.churchName, city: f.city })
}

// Demo: is this update / word / fundraiser one a reviewer removed after a report?
export const isHidden = (trust, kind, ref) => (trust.hidden || []).some(h => h.kind === kind && h.ref === String(ref))

// Burden content from the demo store (approved edits only).
export const demoContent = () => readDemo().content

// The admin console's actions, in the demo. Same names and rules as functions/admin.
export function demoAdminAction(action, f, actor, hooks = {}) {
  const s = readDemo()
  const now = new Date().toISOString()
  const need = msg => { if (!f.note) throw new Error(msg) }
  const log = (a, type, id, detail = {}) => {
    s.audit = [{ id: Date.now() + Math.random(), at: now, actor, action: a, subject_type: type, subject_id: String(id), detail }, ...s.audit]
  }
  switch (action) {
    case 'check': {
      if (f.ok && !f.note) throw new Error('Write what you checked (e.g. the register entry you saw).')
      s.applications = s.applications.map(a => a.id === f.id
        ? { ...a, status: 'in_review', checks: { ...a.checks, [f.check]: { ok: f.ok, note: f.note, by: actor, at: now } } } : a)
      log(f.ok ? 'kyb.check' : 'kyb.uncheck', 'application', f.id, { check: f.check, note: f.note })
      break
    }
    case 'decide_application': {
      need('Write the reason for the decision.')
      const app = s.applications.find(a => a.id === f.id)
      if (f.decision === 'approve') {
        const missing = missingFor(f.tier, app.checks)
        if (missing.length) throw new Error(`Not every ${f.tier} check is done: ${missing.join(', ')}.`)
      }
      s.applications = s.applications.map(a => a.id === f.id ? { ...a, status: f.decision === 'approve' ? 'approved' : 'rejected', tier: f.tier, decision_note: f.note } : a)
      log(f.decision === 'approve' ? 'application.approve' : 'application.reject', 'application', f.id, { church: app.church_name, tier: f.tier, note: f.note })
      break
    }
    case 'set_tier':
      need('Write the reason.')
      s.tiers = { ...s.tiers, [f.churchId]: { tier: f.tier, note: f.note, at: now } }
      log(f.tier === 'Suspended' ? 'church.suspend' : 'church.tier', 'church', f.churchId, { tier: f.tier, note: f.note })
      break
    case 'verify_payout':
      need('Write how you verified it (e.g. Paystack name check matched).')
      hooks.verifyPayout?.(f.churchId)
      log('payout.verify', 'church', f.churchId, { note: f.note })
      break
    case 'edit': {
      const edit = s.edits.find(e => e.id === f.id)
      if (f.decision !== 'approve') need('Tell the church why, so they can fix it.')
      s.edits = s.edits.map(e => e.id === f.id ? { ...e, status: f.decision === 'approve' ? 'approved' : 'rejected', review_note: f.note || null } : e)
      if (f.decision === 'approve') {
        s.content = { ...s.content, [edit.campaign_id]: { ...(s.content[edit.campaign_id] || {}), ...edit.fields, approvedAt: now } }
      }
      log(f.decision === 'approve' ? 'edit.approve' : 'edit.reject', 'burden', edit.campaign_id, { edit: edit.id, fields: Object.keys(edit.fields), note: f.note })
      break
    }
    case 'message':
      s.held = s.held.filter(m => m.id !== f.id)
      log(`support.${f.decision}`, 'support', f.id, { note: f.note })
      break
    case 'report': {
      need('Write the reason.')
      const r = s.reports.find(x => x.id === f.id)
      s.reports = s.reports.map(x => x.id === f.id ? { ...x, status: f.decision === 'remove' ? 'removed' : 'kept' } : x)
      if (f.decision === 'remove') s.hidden = [...(s.hidden || []), { kind: r.kind, ref: r.ref }]
      log(f.decision === 'remove' ? 'report.remove' : 'report.keep', r.kind, r.ref, { report: r.id, reason: r.reason, note: f.note })
      break
    }
    case 'audit_change': {
      // An owner corrects or removes an entry; the earlier version is kept (functions/admin).
      if (!f.reason || f.reason.trim().length < 5) throw new Error('Say why you are changing it.')
      const entry = s.audit.find(e => e.id === f.id)
      s.auditHistory = [...(s.auditHistory || []), { entry_id: f.id, saved_at: now, previous: entry }]
      s.audit = s.audit.map(e => e.id !== f.id ? e : {
        ...e, changed_at: now, changed_by: actor, change_reason: f.reason.trim(),
        ...(f.remove ? { removed_at: now } : { detail: { ...e.detail, note: f.note } }),
      })
      writeDemo(s)
      return
    }
    case 'screening':
      need('Write what you compared (dates of birth, places, etc.).')
      s.screening = s.screening.filter(x => x.id !== f.id)
      log(`screening.${f.outcome}`, 'screening', f.id, { note: f.note })
      break
    default:
      throw new Error('Unknown action.')
  }
  writeDemo(s)
}

// ── Live admin console ──────────────────────────────────────────────────

export const loadAdmin = () => callFunction('admin', 'GET')
export const adminAction = (action, fields) => callFunction('admin', 'POST', { action, ...fields })
