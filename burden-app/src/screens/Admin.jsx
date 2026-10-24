import { useCallback, useEffect, useMemo, useState } from 'react'
import { colors, font, type } from '../theme.js'
import { Badge, Button, Label, Rule } from '../components/UI.jsx'
import SignIn from '../components/SignIn.jsx'
import { campaigns, churches } from '../data/mock.js'
import { formatDay } from '../lib/community.js'
import { authLive, currentSession, signOut } from '../lib/auth.js'
import {
  KYB_CHECKS, TIERS, adminAction, demoAdminAction, loadAdmin, missingFor, originalWording, tierEarned, useDemoTrust,
} from '../lib/trust.js'

// The BURDEN team's console: checking churches (KYB), burden wording,
// words of support the rules held back, reports from the public, sanctions
// matches and payout accounts — every decision needs a written reason and
// lands in the audit log. Live: the `admin` function (only emails in
// burden_admins). Demo: the same queues, kept in this browser.

const TABS = ['Overview', 'Churches', 'Burden wording', 'Words & reports', 'Money', 'Audit log']

export default function Admin({ navigate, demoPayouts, setDemoPayout }) {
  const [session, setSession] = useState(null)
  const [live, setLive] = useState(null)
  const [tab, setTab] = useState(TABS[0])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const trust = useDemoTrust()

  useEffect(() => { if (authLive) currentSession().then(s => s?.access_token && setSession(s)) }, [])
  const refresh = useCallback(async () => {
    try { setLive(await loadAdmin()); setError('') } catch (e) { setError(e.message) }
  }, [])
  useEffect(() => { if (authLive && session) refresh() }, [session, refresh])

  // The demo, in the server's shape.
  const demo = useMemo(() => (authLive ? null : {
    me: { name: 'Demo reviewer', email: 'reviewer@burden.demo', role: 'owner' },
    applications: trust.applications.filter(a => ['submitted', 'in_review'].includes(a.status)),
    churches: churches.map(c => ({ churchId: c.id, name: c.name, city: c.location.split(',')[0], tier: trust.tiers[c.id]?.tier ?? c.tier })),
    edits: trust.edits.filter(e => e.status === 'pending'),
    held: trust.held,
    reports: trust.reports.filter(r => r.status === 'open'),
    screening: trust.screening,
    payouts: Object.entries(demoPayouts).filter(([, p]) => !p.verified).map(([id, p]) => ({
      church_id: id, method: p.method, network: p.network, account_name: p.accountName,
      account_number: '•••• ' + String(p.accountNumber).slice(-4), submitted_by: 'church dashboard', updated_at: p.submittedAt,
    })),
    audit: trust.audit,
  }), [trust, demoPayouts])
  const data = authLive ? live : demo

  async function act(action, fields, success) {
    setError(''); setNotice('')
    try {
      if (authLive) { await adminAction(action, fields); await refresh() } else {
        demoAdminAction(action, fields, 'Demo reviewer', {
          verifyPayout: id => setDemoPayout(id, { ...demoPayouts[id], verified: true }),
        })
      }
      setNotice(success)
      return true
    } catch (e) { setError(e.message); return false }
  }

  if (authLive && !session) {
    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 28px 96px' }}>
        <Label>BURDEN team</Label>
        <h1 style={h1}>Trust and safety console</h1>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: colors.inkSoft, marginBottom: 28 }}>For the people who check churches and review what is posted. Only emails on the BURDEN team can open it.</p>
        <SignIn onSignedIn={setSession} />
      </main>
    )
  }

  const count = d => ({
    Churches: d.applications.length, 'Burden wording': d.edits.length, 'Words & reports': d.held.length + d.reports.length,
    Money: d.screening.length + d.payouts.length,
  })

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 28px 96px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <Label>BURDEN team{authLive ? '' : ' · Demo'}</Label>
        {authLive && <button style={linkBtn} onClick={async () => { await signOut(); setSession(null); setLive(null) }}>Sign out</button>}
      </div>
      <h1 style={h1}>Trust and safety</h1>
      {!data && !error && <p style={{ color: colors.inkSoft }}>Loading…</p>}
      {error && !data && <p role="alert" style={{ color: colors.fundLow }}>{error}</p>}
      {data && (
        <>
          <div style={{ fontSize: 13, color: colors.inkSoft }}>{data.me.name} · {data.me.role === 'owner' ? 'Owner' : 'Reviewer'}</div>
          <nav aria-label="Console sections" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', margin: '28px 0 8px' }}>
            {TABS.map(t => {
              const n = count(data)[t]
              return (
                <button key={t} onClick={() => { setTab(t); setNotice(''); setError('') }} aria-current={tab === t ? 'page' : undefined}
                  style={{ ...chip, background: tab === t ? colors.ink : 'transparent', color: tab === t ? colors.accentInk : colors.ink }}>
                  {t}{n ? ` · ${n}` : ''}
                </button>
              )
            })}
          </nav>
          <Rule soft />
          {notice && <p role="status" style={{ marginTop: 20, fontSize: 13, color: colors.trust }}>{notice}</p>}
          {error && <p role="alert" style={{ marginTop: 20, fontSize: 13, color: colors.fundLow }}>{error}</p>}

          {tab === 'Overview' && <Overview data={data} counts={count(data)} setTab={setTab} />}
          {tab === 'Churches' && <Churches data={data} act={act} />}
          {tab === 'Burden wording' && <Wording data={data} act={act} navigate={navigate} />}
          {tab === 'Words & reports' && <WordsReports data={data} act={act} />}
          {tab === 'Money' && <Money data={data} act={act} />}
          {tab === 'Audit log' && <Audit data={data} />}
        </>
      )}
    </main>
  )
}

// ── Sections ────────────────────────────────────────────────────────────

function Overview({ counts, setTab }) {
  const rows = [
    ['Churches', 'Applications waiting for checks'],
    ['Burden wording', 'Changes churches want to make to their burdens'],
    ['Words & reports', 'Words of support held by the rules, and reports from the public'],
    ['Money', 'Possible sanctions matches, and payout accounts to verify'],
  ]
  return (
    <section style={{ paddingTop: 20 }}>
      {rows.map(([t, what]) => (
        <div key={t} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '18px 0', borderBottom: '1px solid ' + colors.ruleSoft, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{t}</div>
            <div style={{ fontSize: 13, color: colors.inkSoft }}>{what}</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 500 }}>{counts[t]}</span>
            <Button variant="ghost" onClick={() => setTab(t)}>Open</Button>
          </div>
        </div>
      ))}
      <p style={{ marginTop: 24, fontSize: 12, lineHeight: 1.7, color: colors.inkMuted, maxWidth: 640 }}>
        Every decision here asks for a reason and is written to the audit log with your name. Givers' emails and
        account numbers never appear in it.
      </p>
    </section>
  )
}

// A reason box and the decision buttons — nothing is decided without a reason.
function Decide({ actions, placeholder = 'Your reason (goes in the audit log)', needNote = true }) {
  const [note, setNote] = useState('')
  return (
    <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
      <input aria-label="Reason for the decision" value={note} maxLength={500} onChange={e => setNote(e.target.value)} placeholder={placeholder} style={input} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {actions.map(([label, run, variant]) => (
          <Button key={label} variant={variant} disabled={needNote && !note.trim()} onClick={async () => { if (await run(note.trim())) setNote('') }}>{label}</Button>
        ))}
      </div>
    </div>
  )
}

function Churches({ data, act }) {
  return (
    <section style={{ paddingTop: 20 }}>
      <Label>Applications</Label>
      {data.applications.length === 0 && <p style={empty}>No applications waiting.</p>}
      {data.applications.map(a => <Application key={a.id} a={a} act={act} />)}

      <div style={{ marginTop: 48 }}>
        <Label>Churches on BURDEN</Label>
        <p style={{ ...empty, marginBottom: 8 }}>Change a tier after a re-check, or suspend a church — a suspended church is paid nothing until it is restored.</p>
        {data.churches.map(c => <ChurchRow key={c.churchId} c={c} act={act} />)}
      </div>
    </section>
  )
}

function Application({ a, act }) {
  const [notes, setNotes] = useState({})
  const [tier, setTier] = useState('Verified')
  const earned = tierEarned(a.checks)
  const missing = missingFor(tier, a.checks)
  return (
    <article style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{a.church_name}</h2>
        <span style={meta}>Applied {formatDay(a.created_at)} · {earned ? `meets ${earned}` : 'no tier yet'}</span>
      </div>
      <dl style={dl}>
        <dt style={{ color: colors.inkMuted }}>Where</dt><dd style={{ margin: 0 }}>{a.city}, {a.country} · {a.tradition}</dd>
        <dt style={{ color: colors.inkMuted }}>Leader</dt><dd style={{ margin: 0 }}>{a.leader_name}, {a.leader_role}</dd>
        <dt style={{ color: colors.inkMuted }}>Answers to</dt><dd style={{ margin: 0 }}>{a.oversight}</dd>
        <dt style={{ color: colors.inkMuted }}>Registered</dt><dd style={{ margin: 0 }}>{a.registration_body} · {a.registration_no}</dd>
        <dt style={{ color: colors.inkMuted }}>Contact</dt><dd style={{ margin: 0 }}>{a.contact_email}{a.website ? ` · ${a.website}` : ''}</dd>
        <dt style={{ color: colors.inkMuted }}>References</dt><dd style={{ margin: 0 }}>{a.references_text}</dd>
      </dl>
      <div style={{ marginTop: 16 }}>
        <Label>Checks</Label>
        {KYB_CHECKS.map(c => {
          const done = a.checks?.[c.id]
          return (
            <div key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid ' + colors.ruleSoft }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13 }}><span style={{ ...meta, marginRight: 8 }}>{c.tier}</span>{c.label}</span>
                {done?.ok && <Badge tone="trust">Done</Badge>}
              </div>
              {done?.ok ? (
                <div style={{ fontSize: 12, color: colors.inkSoft, marginTop: 6 }}>
                  {done.note} <button style={linkBtn} onClick={() => act('check', { id: a.id, check: c.id, ok: false, note: '' }, 'Check reopened.')}>Undo</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input aria-label={`What you checked: ${c.label}`} value={notes[c.id] ?? ''} onChange={e => setNotes(n => ({ ...n, [c.id]: e.target.value }))}
                    placeholder="What you saw or who you spoke to" style={{ ...input, padding: '10px 12px' }} />
                  <Button variant="ghost" disabled={!(notes[c.id] ?? '').trim()} onClick={() => act('check', { id: a.id, check: c.id, ok: true, note: notes[c.id].trim() }, 'Check recorded.')}>Done</Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 20 }}>
        <Label>Decision</Label>
        <div role="radiogroup" aria-label="Tier" style={{ display: 'flex', gap: 4, margin: '10px 0 4px', flexWrap: 'wrap' }}>
          {TIERS.map(t => (
            <button key={t} role="radio" aria-checked={tier === t} onClick={() => setTier(t)}
              style={{ ...chip, background: tier === t ? colors.ink : 'transparent', color: tier === t ? colors.accentInk : colors.ink }}>{t}</button>
          ))}
        </div>
        {missing.length > 0 && <p style={{ fontSize: 12, color: colors.inkMuted, margin: '6px 0 0' }}>Still to check for {tier}: {missing.join(', ')}.</p>}
        <Decide actions={[
          [`Approve as ${tier}`, note => act('decide_application', { id: a.id, decision: 'approve', tier, note }, `${a.church_name} approved as ${tier}. Their contact email can now open the church dashboard.`)],
          ['Decline', note => act('decide_application', { id: a.id, decision: 'reject', note }, 'Declined. Write to the church with the reason.'), 'ghost'],
        ]} />
      </div>
    </article>
  )
}

function ChurchRow({ c, act }) {
  const [open, setOpen] = useState(false)
  const [tier, setTier] = useState(c.tier ?? 'Verified')
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid ' + colors.ruleSoft }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
          <div style={{ fontSize: 12, color: colors.inkMuted }}>{c.city} · {c.tier ?? 'not set'}</div>
        </div>
        <button style={linkBtn} onClick={() => setOpen(o => !o)}>{open ? 'Close' : 'Change tier'}</button>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          <div role="radiogroup" aria-label="Tier" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[...TIERS, 'Suspended'].map(t => (
              <button key={t} role="radio" aria-checked={tier === t} onClick={() => setTier(t)}
                style={{ ...chip, background: tier === t ? colors.ink : 'transparent', color: tier === t ? colors.accentInk : colors.ink }}>{t}</button>
            ))}
          </div>
          <Decide actions={[[`Set to ${tier}`, note => act('set_tier', { churchId: c.churchId, tier, note }, `${c.name} is now ${tier}.`)]]} />
        </div>
      )}
    </div>
  )
}

const FIELD_LABEL = { summary: 'Summary', objective: 'What it is for', currentState: 'Where things stand', moneyWorkflow: 'Where the money goes', prayerFocus: 'What to pray for' }

function Wording({ data, act, navigate }) {
  if (!data.edits.length) return <p style={{ ...empty, paddingTop: 20 }}>No changes waiting.</p>
  return (
    <section style={{ paddingTop: 20 }}>
      {data.edits.map(e => {
        const c = campaigns.find(x => x.id === e.campaign_id)
        const before = { ...originalWording(e.campaign_id), ...(e.current || {}) }
        return (
          <article key={e.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{c?.title ?? e.campaign_id}</h2>
              <span style={meta}>{formatDay(e.created_at)} · {e.submitted_by}</span>
            </div>
            {e.flags?.length > 0 && <p style={{ margin: '10px 0 0' }}><Badge tone="warn">Check for {e.flags.join(' and ')} language</Badge></p>}
            {Object.entries(e.fields).map(([k, v]) => (
              <div key={k} style={{ marginTop: 16 }}>
                <Label>{FIELD_LABEL[k] ?? k}</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 8 }}>
                  <Wordbox title="Now" text={before[k]} />
                  <Wordbox title="Proposed" text={v} strong />
                </div>
              </div>
            ))}
            <Decide needNote={false} placeholder="Note to the church (needed to send it back)" actions={[
              ['Approve and publish', note => act('edit', { id: e.id, decision: 'approve', note }, 'Approved. The burden page shows the new wording now.')],
              ['Send back', note => act('edit', { id: e.id, decision: 'reject', note }, 'Sent back to the church with your note.'), 'ghost'],
              ['See the page', () => { navigate({ name: 'campaign', id: e.campaign_id }); return Promise.resolve(false) }, 'ghost'],
            ]} />
          </article>
        )
      })}
    </section>
  )
}

function Wordbox({ title, text, strong }) {
  const lines = Array.isArray(text) ? text : [text ?? '']
  return (
    <div style={{ border: '1px solid ' + (strong ? colors.ink : colors.ruleSoft), padding: 14 }}>
      <div style={meta}>{title}</div>
      {lines.map((l, i) => <p key={i} style={{ fontSize: 13, lineHeight: 1.6, margin: '8px 0 0', color: strong ? colors.ink : colors.inkSoft }}>{Array.isArray(text) ? `${i + 1}. ` : ''}{l}</p>)}
    </div>
  )
}

const REASON = { scam: 'Scam or fraud', abuse: 'Abusive or hateful', false: 'Not true', private: 'Private details', other: 'Something else' }

function WordsReports({ data, act }) {
  return (
    <section style={{ paddingTop: 20 }}>
      <Label>Words of support held by the rules</Label>
      {data.held.length === 0 && <p style={empty}>Nothing held.</p>}
      {data.held.map(m => (
        <article key={m.id} style={card}>
          <div style={meta}>{formatDay(m.created_at)} · {campaigns.find(c => c.id === m.campaign_id)?.title} · held for: {(m.reasons || []).join(', ')}</div>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: '10px 0 0' }}>“{m.message}” — {m.display_name}</p>
          <Decide needNote={false} placeholder="Note (optional)" actions={[
            ['Publish', note => act('message', { id: m.id, decision: 'approve', note }, 'Published.')],
            ['Don’t publish', note => act('message', { id: m.id, decision: 'reject', note }, 'Not published. The giver sees that it was not shown.'), 'ghost'],
          ]} />
        </article>
      ))}

      <div style={{ marginTop: 40 }}>
        <Label>Reports from the public</Label>
        {data.reports.length === 0 && <p style={empty}>No open reports.</p>}
        {data.reports.map(r => (
          <article key={r.id} style={card}>
            <div style={meta}>{formatDay(r.created_at)} · {r.kind} on {campaigns.find(c => c.id === r.campaign_id)?.title} · {REASON[r.reason]} · from {r.reporter || 'anonymous'}</div>
            {r.text && <p style={{ fontSize: 14, lineHeight: 1.6, margin: '10px 0 0' }}>{r.text}</p>}
            {r.detail && <p style={{ fontSize: 13, color: colors.inkSoft, margin: '8px 0 0' }}>Reporter: {r.detail}</p>}
            <Decide actions={[
              ['Remove it', note => act('report', { id: r.id, decision: 'remove', note }, 'Removed from the burden page.')],
              ['Keep it', note => act('report', { id: r.id, decision: 'keep', note }, 'Kept. The report is closed.'), 'ghost'],
            ]} />
          </article>
        ))}
      </div>
    </section>
  )
}

function Money({ data, act }) {
  return (
    <section style={{ paddingTop: 20 }}>
      <Label>Possible sanctions matches</Label>
      <p style={{ ...empty, marginBottom: 8 }}>Gifts and payouts linked to these names are paused. Compare dates of birth, places and other details before deciding; if a match is confirmed, take advice before refunding or reporting.</p>
      {data.screening.length === 0 && <p style={empty}>None open.</p>}
      {data.screening.map(x => (
        <article key={x.id} style={card}>
          <div style={meta}>{formatDay(x.created_at)} · {x.subject_type === 'donor' ? 'a giver' : 'a payout account'} · {x.list ?? 'sanctions list'}{x.score ? ` · ${Math.round(x.score * 100)}% similar` : ''}</div>
          <p style={{ fontSize: 14, margin: '10px 0 0' }}>{x.name} <span style={{ color: colors.inkMuted }}>vs</span> {x.matched_name}</p>
          <Decide actions={[
            ['Not the same person — release', note => act('screening', { id: x.id, outcome: 'clear', note }, 'Cleared. Paused gifts move on.')],
            ['Confirmed match — keep blocked', note => act('screening', { id: x.id, outcome: 'confirmed', note }, 'Kept blocked. Take advice on refunds and reporting.'), 'ghost'],
          ]} />
        </article>
      ))}

      <div style={{ marginTop: 40 }}>
        <Label>Payout accounts to verify</Label>
        <p style={{ ...empty, marginBottom: 8 }}>Check the name the bank or network returns matches the church's registered name before any money is sent.</p>
        {data.payouts.length === 0 && <p style={empty}>None waiting.</p>}
        {data.payouts.map(p => (
          <article key={p.church_id} style={card}>
            <div style={meta}>{churches.find(c => c.id === p.church_id)?.name ?? p.church_id} · sent by {p.submitted_by}</div>
            <p style={{ fontSize: 14, margin: '10px 0 0' }}>{p.method === 'momo' ? `${String(p.network).toUpperCase()} MoMo` : p.network} · {p.account_name} · {p.account_number}</p>
            <Decide actions={[['Verified — pay into it', note => act('verify_payout', { churchId: p.church_id, note }, 'Verified. Payouts can go to this account.')]]}
              placeholder="How you verified it (e.g. Paystack name check matched)" />
          </article>
        ))}
      </div>
    </section>
  )
}

function Audit({ data }) {
  if (!data.audit.length) return <p style={{ ...empty, paddingTop: 20 }}>Nothing yet.</p>
  return (
    <section style={{ paddingTop: 20, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <caption className="sr-only">Audit log, newest first</caption>
        <thead>
          <tr style={{ textAlign: 'left', color: colors.inkMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
            <th scope="col" style={th}>When</th><th scope="col" style={th}>Who</th><th scope="col" style={th}>What</th><th scope="col" style={th}>On</th><th scope="col" style={th}>Detail</th>
          </tr>
        </thead>
        <tbody>
          {data.audit.map(e => (
            <tr key={e.id} style={{ borderTop: '1px solid ' + colors.ruleSoft, verticalAlign: 'top' }}>
              <td style={td}>{new Date(e.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td>
              <td style={td}>{e.actor}</td>
              <td style={td}>{e.action}</td>
              <td style={td}>{e.subject_type} {e.subject_id}</td>
              <td style={{ ...td, color: colors.inkSoft }}>{Object.entries(e.detail || {}).filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && !v.length)).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: colors.inkMuted, marginTop: 12 }}>The log cannot be edited or deleted — the database refuses it.</p>
    </section>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────

const h1 = { fontFamily: font.sans, fontSize: type['2xl'].fontSize, fontWeight: 500, margin: '12px 0 4px' }
const input = { width: '100%', padding: '12px 14px', border: '1px solid ' + colors.rule, background: 'transparent', fontSize: 13, color: colors.ink, outline: 'none', boxSizing: 'border-box' }
const chip = { padding: '10px 14px', border: '1px solid ' + colors.rule, fontSize: 12, letterSpacing: 1, cursor: 'pointer' }
const linkBtn = { background: 'transparent', border: 'none', padding: 0, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: colors.ink, textDecoration: 'underline', cursor: 'pointer' }
const card = { border: '1px solid ' + colors.rule, padding: 20, marginTop: 16 }
const meta = { fontSize: 11, letterSpacing: 1, color: colors.inkMuted, textTransform: 'uppercase', lineHeight: 1.6 }
const empty = { fontSize: 13, color: colors.inkSoft, margin: '10px 0 0', lineHeight: 1.6 }
const dl = { display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '6px 16px', fontSize: 13, margin: '16px 0 0', lineHeight: 1.6 }
const th = { padding: '10px 8px 10px 0', fontWeight: 500 }
const td = { padding: '12px 8px 12px 0' }
