import { useCallback, useEffect, useMemo, useState } from 'react'
import { colors, font, tile, type } from '../theme.js'
import { Badge, Button, Label, Rule, Tile, formatMoney } from '../components/UI.jsx'
import { campaigns, churches } from '../data/mock.js'
import { formatDay } from '../lib/community.js'
import { MOMO_NETWORKS, normaliseGhanaPhone } from '../lib/payments.js'
import {
  churchAction, churchLive, currentSession, loadDashboard, sendCode, signOut, verifyCode,
} from '../lib/church.js'

// The church dashboard — for the people carrying a burden, not its givers.
// Everything the giver sees ("Paid to church", "Church confirms", updates)
// starts here. Live: signed-in staff via the `church` edge function. Demo:
// pick a church; gifts made in this browser show up, and confirming or
// posting appears on the giver's pages straight away.

const TABS = ['Overview', 'Gifts', 'Post an update', 'Payout account', 'Team']

export default function Church({ navigate, gifts, updateGift, churchUpdates, addChurchUpdate, demoPayouts, setDemoPayout }) {
  const [session, setSession] = useState(null) // live: Supabase session; demo: { churchId }
  const [data, setData] = useState(null)
  const [tab, setTab] = useState(TABS[0])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { if (churchLive) currentSession().then(s => s && setSession(s)) }, [])

  const refresh = useCallback(async () => {
    if (!churchLive) return
    try { setData(await loadDashboard()) } catch (e) { setError(e.message) }
  }, [])
  useEffect(() => { if (churchLive && session) refresh() }, [session, refresh])

  // Demo: the same shape the server returns, built from this browser's gifts.
  const demo = useMemo(() => (!churchLive && session ? demoDashboard(session.churchId, gifts, churchUpdates, demoPayouts) : null),
    [session, gifts, churchUpdates, demoPayouts])
  const church = churchLive ? data?.churches?.[0] : demo
  const info = church && churches.find(c => c.id === church.churchId)

  async function act(action, fields, success) {
    setError(''); setNotice('')
    try {
      if (churchLive) { await churchAction(church.churchId, action, fields); await refresh() } else demoAct(action, fields)
      setNotice(success)
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }

  function demoAct(action, f) {
    const at = new Date().toISOString()
    if (action === 'confirm') {
      const g = gifts.find(x => x.id === f.gift)
      updateGift(f.gift, {
        status: 'church_confirmed',
        events: [...(g.events || []), { step: 'church_confirmed', occurred_at: at, note: f.note || `${info.name} confirmed the funds arrived.` }],
      })
    } else if (action === 'demo_payout') {
      const g = gifts.find(x => x.id === f.gift)
      updateGift(f.gift, {
        status: 'paid_out',
        events: [...(g.events || []), { step: 'paid_out', occurred_at: at, note: `Simulated payout to ${info.name}'s ${info.payoutTo} — demo, no money moved.` }],
      })
    } else if (action === 'update') {
      addChurchUpdate({ campaignId: f.campaignId, date: at, author: church.me.name, role: church.me.roleTitle, title: f.title, body: f.body })
    } else if (action === 'payout') {
      setDemoPayout(church.churchId, { ...f, submittedAt: at })
    }
  }

  if (!session) return <SignIn onSignedIn={setSession} />

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 28px 96px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <Label>Church dashboard{churchLive ? '' : ' · Demo'}</Label>
        <button onClick={async () => { await signOut(); setSession(null); setData(null) }} style={linkBtn}>Sign out</button>
      </div>
      {!church && !error && <p style={{ marginTop: 24, color: colors.inkSoft }}>Loading…</p>}
      {error && !church && <p role="alert" style={{ marginTop: 24, color: colors.fundLow }}>{error}</p>}
      {church && info && (
        <>
          <h1 style={{ fontFamily: font.sans, fontSize: type['2xl'].fontSize, fontWeight: 500, margin: '12px 0 4px' }}>{info.name}</h1>
          <div style={{ fontSize: 13, color: colors.inkSoft }}>
            {church.me.name}{church.me.roleTitle ? ` · ${church.me.roleTitle}` : ''} · {church.me.role === 'admin' ? 'Admin' : 'Editor'}
          </div>

          <nav aria-label="Dashboard sections" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', margin: '28px 0 8px' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => { setTab(t); setNotice(''); setError('') }} aria-current={tab === t ? 'page' : undefined}
                style={{ ...chip, background: tab === t ? colors.ink : 'transparent', color: tab === t ? colors.accentInk : colors.ink }}>
                {t}
              </button>
            ))}
          </nav>
          <Rule soft />
          {notice && <p role="status" style={{ marginTop: 20, fontSize: 13, color: colors.trust }}>{notice}</p>}
          {error && <p role="alert" style={{ marginTop: 20, fontSize: 13, color: colors.fundLow }}>{error}</p>}

          {tab === 'Overview' && <Overview church={church} onGifts={() => setTab('Gifts')} navigate={navigate} />}
          {tab === 'Gifts' && <Gifts church={church} act={act} />}
          {tab === 'Post an update' && <PostUpdate church={church} act={act} navigate={navigate} />}
          {tab === 'Payout account' && <Payout church={church} act={act} />}
          {tab === 'Team' && <Team church={church} act={act} />}
        </>
      )}
    </main>
  )
}

// ── Sign in ─────────────────────────────────────────────────────────────

function SignIn({ onSignedIn }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function step(fn) {
    setBusy(true); setError('')
    try { await fn() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 28px 96px' }}>
      <Label>For churches</Label>
      <h1 style={{ fontFamily: font.sans, fontSize: type['2xl'].fontSize, fontWeight: 500, margin: '12px 0 16px', lineHeight: 1.25 }}>
        Your church dashboard
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: colors.inkSoft }}>
        See the gifts given to your burdens, confirm when money arrives, post updates for your givers and
        manage where BURDEN pays you.
      </p>

      {churchLive ? (
        <form onSubmit={e => { e.preventDefault(); step(async () => {
          if (!sent) { await sendCode(email.trim()); setSent(true) } else { await verifyCode(email.trim(), code.trim()); onSignedIn(await currentSession()) }
        }) }} style={{ marginTop: 32 }}>
          <label style={fieldLabel} htmlFor="church-email">Your email</label>
          <input id="church-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={sent} style={input} autoComplete="email" />
          {sent && (
            <>
              <label style={{ ...fieldLabel, marginTop: 16 }} htmlFor="church-code">The 6-digit code we emailed you</label>
              <input id="church-code" inputMode="numeric" autoComplete="one-time-code" required value={code}
                onChange={e => setCode(e.target.value)} style={{ ...input, letterSpacing: 4 }} />
            </>
          )}
          {error && <p role="alert" style={{ marginTop: 12, fontSize: 13, color: colors.fundLow }}>{error}</p>}
          <div style={{ marginTop: 20 }}>
            <Button type="submit" full disabled={busy || !email}>{busy ? 'One moment…' : sent ? 'Sign in' : 'Email me a code'}</Button>
          </div>
          <p style={{ marginTop: 16, fontSize: 12, color: colors.inkMuted, lineHeight: 1.6 }}>
            No password. Only emails your church admin (or BURDEN) has added can open a church dashboard.
          </p>
        </form>
      ) : (
        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 12, color: colors.inkMuted, lineHeight: 1.6, marginBottom: 16 }}>
            Demo — no server is connected. Choose a church to see its dashboard. Gifts you make in this browser appear
            there, and what you do (confirm a gift, post an update) shows on the giver's pages.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {churches.map(c => (
              <Button key={c.id} variant="ghost" full onClick={() => onSignedIn({ churchId: c.id })}>{c.name}</Button>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

// ── Sections ────────────────────────────────────────────────────────────

function Overview({ church, onGifts, navigate }) {
  const awaiting = church.gifts.filter(g => g.canConfirm).length
  return (
    <section style={{ paddingTop: 28 }}>
      {awaiting > 0 && (
        <div style={{ border: '1px solid ' + colors.rule, padding: 20, marginBottom: 28, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14 }}>{awaiting} gift{awaiting > 1 ? 's have' : ' has'} been paid to you. Please confirm the money arrived.</span>
          <Button onClick={onGifts}>Confirm gifts</Button>
        </div>
      )}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {church.burdens.map(b => {
          const t = church.totals.find(x => x.campaignId === b.id) ?? { given: 0, gifts: 0, held: 0, paidOut: 0, awaiting: 0 }
          const c = campaigns.find(x => x.id === b.id)
          return (
            <Tile key={b.id} flat as="div" padding={24} style={{ gap: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: tile.ink, lineHeight: 1.35 }}>{b.title}</div>
              <Row k="Given through BURDEN" v={formatMoney(t.given)} />
              <Row k="Gifts" v={t.gifts} />
              <Row k="Held (paid after 3 days)" v={formatMoney(t.held)} />
              <Row k="Paid to you" v={formatMoney(t.paidOut)} />
              <Row k="Waiting for your confirmation" v={t.awaiting} />
              {c && <Row k="Burden total (all channels)" v={`${formatMoney(c.raised)} of ${formatMoney(c.goal)}`} />}
              <Button variant="onNavy" onClick={() => navigate({ name: 'campaign', id: b.id })}>See the public page</Button>
            </Tile>
          )
        })}
      </div>
    </section>
  )
}

function Row({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, color: tile.soft, borderBottom: '1px solid ' + tile.rule, paddingBottom: 8 }}>
      <span>{k}</span><span style={{ color: tile.ink, fontWeight: 600 }}>{v}</span>
    </div>
  )
}

const STATUS = { held: 'Held', paid_out: 'Paid to you', church_confirmed: 'Confirmed', refunded: 'Refunded' }

function Gifts({ church, act }) {
  const [notes, setNotes] = useState({})
  if (!church.gifts.length) return <p style={{ paddingTop: 28, color: colors.inkSoft }}>No gifts yet.</p>
  return (
    <section style={{ paddingTop: 12 }}>
      <p style={{ fontSize: 12, color: colors.inkMuted, lineHeight: 1.6, margin: '16px 0' }}>
        Givers' emails are never shown. Anonymous givers stay anonymous. When a gift says "Paid to you", check it
        arrived, then confirm — the giver is told, with your note.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: colors.inkMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
            <th scope="col" style={th}>Date</th><th scope="col" style={th}>Giver</th><th scope="col" style={th}>Burden</th>
            <th scope="col" style={th}>Gift</th><th scope="col" style={th}>Status</th><th scope="col" style={th}><span className="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          {church.gifts.map(g => (
            <tr key={g.id} style={{ borderTop: '1px solid ' + colors.ruleSoft, verticalAlign: 'top' }}>
              <td style={td}>{formatDay(g.date)}<div style={{ fontSize: 10, color: colors.inkMuted }}>#{g.ref}</div></td>
              <td style={td}>{g.giver}{g.monthly && <div style={{ fontSize: 10, color: colors.inkMuted }}>MONTHLY</div>}</td>
              <td style={td}>{church.burdens.find(b => b.id === g.campaignId)?.title}</td>
              <td style={td}>{formatMoney(g.amount)}{g.local && <div style={{ fontSize: 11, color: colors.inkMuted }}>{formatMoney(g.local.amount, g.local.currency)}</div>}</td>
              <td style={td}>{STATUS[g.status] ?? g.status}{g.test && <div style={{ fontSize: 10, color: colors.inkMuted }}>TEST</div>}</td>
              <td style={{ ...td, minWidth: 220 }}>
                {g.canConfirm && (
                  <div style={{ display: 'grid', gap: 6 }}>
                    <label className="sr-only" htmlFor={`note-${g.id}`}>Note to the giver</label>
                    <input id={`note-${g.id}`} placeholder="A short note to the giver (optional)" value={notes[g.id] ?? ''}
                      onChange={e => setNotes(n => ({ ...n, [g.id]: e.target.value }))} style={{ ...input, padding: '10px 12px' }} maxLength={500} />
                    <Button onClick={() => act('confirm', { gift: g.id, note: notes[g.id] }, 'Confirmed. The giver has been told.')}>Money arrived</Button>
                  </div>
                )}
                {g.status === 'held' && !churchLive && (
                  <button style={linkBtn} onClick={() => act('demo_payout', { gift: g.id }, 'Demo: marked as paid to you.')}>Demo: pay out now</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function PostUpdate({ church, act, navigate }) {
  const [campaignId, setCampaignId] = useState(church.burdens[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const ok = title.trim().length >= 3 && body.trim().length >= 10
  return (
    <section style={{ paddingTop: 28, maxWidth: 640 }}>
      <p style={{ fontSize: 13, color: colors.inkSoft, lineHeight: 1.7, marginBottom: 24 }}>
        Updates appear on the burden page at once, under your name, and are sent to givers who asked for them.
        Say plainly what happened and what the money did. Please don't ask for more money or set deadlines.
      </p>
      {church.burdens.length > 1 && (
        <>
          <label style={fieldLabel} htmlFor="upd-burden">Burden</label>
          <select id="upd-burden" value={campaignId} onChange={e => setCampaignId(e.target.value)} style={{ ...input, marginBottom: 16 }}>
            {church.burdens.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
        </>
      )}
      <label style={fieldLabel} htmlFor="upd-title">Title</label>
      <input id="upd-title" value={title} onChange={e => setTitle(e.target.value.slice(0, 120))} style={input} placeholder="e.g. Books handed out to 48 children" />
      <label style={{ ...fieldLabel, marginTop: 16 }} htmlFor="upd-body">What happened</label>
      <textarea id="upd-body" value={body} onChange={e => setBody(e.target.value.slice(0, 2000))} rows={7}
        style={{ ...input, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical' }} />
      <div style={{ fontSize: 11, color: colors.inkMuted, textAlign: 'right', marginTop: 4 }}>{body.length}/2000</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <Button disabled={!ok} onClick={async () => {
          if (await act('update', { campaignId, title: title.trim(), body: body.trim() }, 'Posted. It is on the burden page now.')) { setTitle(''); setBody('') }
        }}>Post update</Button>
        <Button variant="ghost" onClick={() => navigate({ name: 'campaign', id: campaignId })}>See the burden page</Button>
      </div>
      {church.updates.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <Label>Posted</Label>
          {church.updates.map((u, i) => (
            <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid ' + colors.ruleSoft }}>
              <div style={{ fontSize: 11, letterSpacing: 1, color: colors.inkMuted }}>{formatDay(u.created_at ?? u.date)} · {String(u.author).toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{u.title}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Payout({ church, act }) {
  const [method, setMethod] = useState('momo')
  const [network, setNetwork] = useState('mtn')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState('')
  const p = church.payout
  const valid = accountName.trim() && (method === 'momo' ? !!normaliseGhanaPhone(accountNumber) : accountNumber.trim() && bankCode.trim())
  return (
    <section style={{ paddingTop: 28, maxWidth: 640 }}>
      {p ? (
        <div style={{ border: '1px solid ' + colors.rule, padding: 20, marginBottom: 32 }}>
          <Label>Where BURDEN pays you now</Label>
          <p style={{ marginTop: 10, fontSize: 14 }}>
            {p.method === 'momo' ? `${String(p.network).toUpperCase()} MoMo` : p.network} · {p.accountName} · {p.account}
          </p>
          <div style={{ marginTop: 10 }}>
            {p.verified ? <Badge tone="trust">Verified</Badge> : <Badge tone="warn">Waiting for BURDEN to verify</Badge>}
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: colors.inkSoft, marginBottom: 24 }}>No payout account yet. Gifts wait in BURDEN's protected account until one is verified.</p>
      )}
      <Label>{p ? 'Change the account' : 'Add an account'}</Label>
      <p style={{ fontSize: 12, color: colors.inkMuted, lineHeight: 1.6, margin: '8px 0 16px' }}>
        A BURDEN reviewer checks every new account before any money is sent to it, and the name is screened against
        sanctions lists. Changing the account pauses payouts until it is verified again.
      </p>
      <div role="radiogroup" aria-label="Account type" style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[['momo', 'Mobile money'], ['bank', 'Bank account']].map(([id, label]) => (
          <button key={id} role="radio" aria-checked={method === id} onClick={() => setMethod(id)}
            style={{ ...chip, background: method === id ? colors.ink : 'transparent', color: method === id ? colors.accentInk : colors.ink }}>{label}</button>
        ))}
      </div>
      {method === 'momo' && (
        <div role="radiogroup" aria-label="Network" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 12 }}>
          {MOMO_NETWORKS.map(n => (
            <button key={n.id} role="radio" aria-checked={network === n.id} onClick={() => setNetwork(n.id)}
              style={{ ...chip, background: network === n.id ? colors.ink : 'transparent', color: network === n.id ? colors.accentInk : colors.ink }}>{n.label}</button>
          ))}
        </div>
      )}
      <label style={fieldLabel} htmlFor="po-name">Account name (exactly as the {method === 'momo' ? 'network' : 'bank'} has it)</label>
      <input id="po-name" value={accountName} onChange={e => setAccountName(e.target.value)} style={input} />
      <label style={{ ...fieldLabel, marginTop: 12 }} htmlFor="po-number">{method === 'momo' ? 'MoMo number' : 'Account number'}</label>
      <input id="po-number" inputMode="numeric" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} style={input} />
      {method === 'bank' && (
        <>
          <label style={{ ...fieldLabel, marginTop: 12 }} htmlFor="po-bank">Bank code (from Paystack's bank list)</label>
          <input id="po-bank" value={bankCode} onChange={e => setBankCode(e.target.value)} style={input} />
        </>
      )}
      <div style={{ marginTop: 20 }}>
        <Button disabled={!valid} onClick={() => act('payout', {
          method, network: method === 'momo' ? network : 'Bank', accountName: accountName.trim(),
          accountNumber: method === 'momo' ? normaliseGhanaPhone(accountNumber) : accountNumber.trim(), bankCode: bankCode.trim(),
        }, 'Sent for verification. BURDEN will confirm before paying into it.')}>Send for verification</Button>
      </div>
    </section>
  )
}

function Team({ church, act }) {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const isAdmin = church.me.role === 'admin'
  return (
    <section style={{ paddingTop: 28, maxWidth: 640 }}>
      {church.team.map((m, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '14px 0', borderBottom: '1px solid ' + colors.ruleSoft, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{m.display_name}</div>
            <div style={{ fontSize: 12, color: colors.inkMuted }}>{[m.role_title, m.email, m.role === 'admin' ? 'Admin' : m.role && 'Editor'].filter(Boolean).join(' · ')}</div>
          </div>
          {isAdmin && m.email && churchLive && m.email !== church.email && (
            <button style={linkBtn} onClick={() => act('remove', { email: m.email }, 'Removed.')}>Remove</button>
          )}
        </div>
      ))}
      {isAdmin ? (
        <div style={{ marginTop: 32 }}>
          <Label>Add someone</Label>
          <p style={{ fontSize: 12, color: colors.inkMuted, lineHeight: 1.6, margin: '8px 0 16px' }}>
            They sign in with their own email — no password to share. Editors can confirm gifts and post updates;
            admins can also change the team.
          </p>
          <label style={fieldLabel} htmlFor="tm-name">Name, as it should appear on updates</label>
          <input id="tm-name" value={displayName} onChange={e => setDisplayName(e.target.value)} style={input} />
          <label style={{ ...fieldLabel, marginTop: 12 }} htmlFor="tm-role">Role (e.g. Finance steward)</label>
          <input id="tm-role" value={roleTitle} onChange={e => setRoleTitle(e.target.value)} style={input} />
          <label style={{ ...fieldLabel, marginTop: 12 }} htmlFor="tm-email">Email</label>
          <input id="tm-email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={input} />
          <div style={{ marginTop: 16 }}>
            <Button disabled={!email || !displayName || !churchLive} onClick={async () => {
              if (await act('invite', { email, displayName, roleTitle, role: 'editor' }, 'Added. They can sign in now.')) { setEmail(''); setDisplayName(''); setRoleTitle('') }
            }}>Add to the team</Button>
          </div>
          {!churchLive && <p style={{ fontSize: 11, color: colors.inkMuted, marginTop: 8 }}>Demo — adding people needs the live server.</p>}
        </div>
      ) : <p style={{ fontSize: 12, color: colors.inkMuted, marginTop: 20 }}>Ask your church admin to add or remove people.</p>}
    </section>
  )
}

// ── Demo data, in the server's shape ────────────────────────────────────

function demoDashboard(churchId, gifts, churchUpdates, demoPayouts) {
  const ch = churches.find(c => c.id === churchId)
  const mine = campaigns.filter(c => c.churchId === churchId)
  const lead = mine[0]?.team?.[0]
  const list = gifts.filter(g => mine.some(c => c.id === g.campaignId) && ['held', 'paid_out', 'church_confirmed', 'refunded'].includes(g.status))
  const view = list.map(g => ({
    id: g.id, ref: String(g.id).slice(-8).toUpperCase(), date: g.timestamp, campaignId: g.campaignId, status: g.status,
    amount: g.amount, local: null, giver: g.anonymous ? 'Anonymous' : (g.donorName || 'A giver'),
    monthly: g.recurring, test: true, canConfirm: g.status === 'paid_out',
  }))
  const totalsBy = mine.map(c => {
    const gs = view.filter(g => g.campaignId === c.id && g.status !== 'refunded')
    const sum = f => gs.filter(f).reduce((s, g) => s + g.amount, 0)
    return { campaignId: c.id, given: sum(() => true), gifts: gs.length, held: sum(g => g.status === 'held'), paidOut: sum(g => g.status !== 'held'), awaiting: gs.filter(g => g.canConfirm).length }
  })
  const saved = demoPayouts[churchId]
  return {
    churchId,
    email: 'demo@church',
    me: { name: lead?.name ?? 'Church admin', roleTitle: lead?.role ?? '', role: 'admin' },
    burdens: mine.map(c => ({ id: c.id, title: c.title })),
    totals: totalsBy,
    gifts: view.sort((a, b) => String(b.date).localeCompare(String(a.date))),
    updates: churchUpdates.filter(u => mine.some(c => c.id === u.campaignId)).sort((a, b) => b.date.localeCompare(a.date)),
    payout: saved
      ? { method: saved.method, network: saved.network, accountName: saved.accountName, account: '•••• ' + String(saved.accountNumber).slice(-4), verified: false }
      : { method: ch.payoutTo.includes('MoMo') ? 'momo' : 'bank', network: ch.payoutTo.includes('MoMo') ? 'mtn' : ch.payoutTo.split(' account')[0], accountName: ch.name, account: '•••• 4567', verified: true },
    team: (mine[0]?.team ?? []).map((m, i) => ({ display_name: m.name, role_title: m.role, role: i === 0 ? 'admin' : 'editor' })),
  }
}

// ── Styles ──────────────────────────────────────────────────────────────

const input = {
  width: '100%', padding: '14px 16px', border: '1px solid ' + colors.rule, background: 'transparent',
  fontSize: 13, color: colors.ink, outline: 'none', boxSizing: 'border-box',
}
const fieldLabel = { display: 'block', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.inkMuted, marginBottom: 8 }
const chip = { padding: '10px 14px', border: '1px solid ' + colors.rule, fontSize: 12, letterSpacing: 1, cursor: 'pointer' }
const linkBtn = { background: 'transparent', border: 'none', padding: 0, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: colors.ink, textDecoration: 'underline', cursor: 'pointer' }
const th = { padding: '10px 8px 10px 0', fontWeight: 500 }
const td = { padding: '14px 8px 14px 0' }
