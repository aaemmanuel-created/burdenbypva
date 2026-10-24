import { useEffect, useState } from 'react'
import { colors, tile } from '../theme.js'
import { Button, Label, Progress, Tile, formatMoney } from './UI.jsx'
import { formatDay, shareText, shareUrl } from '../lib/community.js'

// The burden page's community sections — Updates, Words of support,
// Fundraisers — and the Share sheet. Web twins of
// burden-native/src/components/Community.tsx.

const body = { marginTop: 10, fontSize: 14, lineHeight: 1.75, color: colors.inkSoft }
const meta = { fontSize: 11, letterSpacing: 1, color: colors.inkMuted, textTransform: 'uppercase' }
const more = {
  marginTop: 16, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
  fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: colors.ink, textDecoration: 'underline',
}

function SectionHead({ label, count }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Label>{label}</Label>
      {count > 0 && <span style={{ fontSize: 12, letterSpacing: 1, color: colors.inkMuted }}>{count}</span>}
    </div>
  )
}

// Dated posts from the burden's team — newest open, older ones folded.
export function UpdatesSection({ updates }) {
  const [all, setAll] = useState(false)
  const shown = all ? updates : updates.slice(0, 1)
  return (
    <div>
      <SectionHead label="Updates" count={updates.length} />
      {updates.length === 0 && (
        <p style={body}>The team posts a public update every month. The first is on its way.</p>
      )}
      {shown.map((u, i) => (
        <article key={u.date + u.title} style={{
          padding: '18px 0', borderBottom: i < shown.length - 1 ? '1px solid ' + colors.ruleSoft : 'none',
        }}>
          <div style={meta}>{formatDay(u.date)} · {u.author}{u.role ? `, ${u.role}` : ''}</div>
          <h3 style={{ marginTop: 8, fontSize: 16, fontWeight: 600, lineHeight: 1.4, color: colors.ink }}>{u.title}</h3>
          <p style={body}>{u.body}</p>
        </article>
      ))}
      {updates.length > 1 && (
        <button style={more} onClick={() => setAll(a => !a)}>
          {all ? 'Show latest only' : `See ${updates.length - 1} older update${updates.length > 2 ? 's' : ''}`}
        </button>
      )}
    </div>
  )
}

// Messages givers leave with their gifts. Never the amount.
export function SupportSection({ words, onGive }) {
  const [all, setAll] = useState(false)
  const shown = all ? words : words.slice(0, 3)
  return (
    <div>
      <SectionHead label="Words of support" count={words.length} />
      <p style={{ ...body, fontSize: 12, color: colors.inkMuted }}>
        Givers can leave a few words or a prayer with their gift. Every message is checked before it appears,
        and amounts are never shown.
      </p>
      {shown.map((w, i) => (
        <div key={w.date + i} style={{ padding: '16px 0', borderBottom: '1px solid ' + colors.ruleSoft }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>
              {w.name}{w.waiting ? ' (you — only you can see this until it is reviewed)' : w.own ? ' (you)' : ''}
            </span>
            <span style={meta}>{formatDay(w.date)}</span>
          </div>
          <p style={{ ...body, marginTop: 6, color: colors.ink }}>{w.message}</p>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 24, alignItems: 'baseline', flexWrap: 'wrap' }}>
        {words.length > 3 && (
          <button style={more} onClick={() => setAll(a => !a)}>{all ? 'Show fewer' : `Show all ${words.length}`}</button>
        )}
        <button style={more} onClick={onGive}>Give and leave words of support</button>
      </div>
    </div>
  )
}

// People carrying this burden with their own circle.
export function FundraisersSection({ fundraisers, highlightId, onGiveThrough, onStart }) {
  return (
    <div>
      <SectionHead label="Carrying it with others" count={fundraisers.length} />
      <p style={{ ...body, fontSize: 12, color: colors.inkMuted }}>
        Anyone can raise for this burden among their own friends. Every gift still goes straight
        to the church's verified account.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {fundraisers.map(f => (
          <Tile key={f.id} flat as="div" padding={20} style={{
            gap: 12, outline: f.id === highlightId ? '2px solid ' + colors.ink : 'none', outlineOffset: 3,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: tile.ink }}>{f.name}{f.own ? ' (you)' : ''}</span>
              <span style={{ fontSize: 11, letterSpacing: 1, color: tile.muted }}>SINCE {formatDay(f.started)}</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: tile.soft }}>{f.note}</p>
            <Progress value={f.raised} goal={f.goal} onNavy />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: tile.muted, letterSpacing: 1 }}>
                {formatMoney(f.raised)} of {formatMoney(f.goal)}
              </span>
              <Button variant="onNavy" style={{ padding: '10px 14px' }} onClick={() => onGiveThrough(f)}>
                Give through {f.own ? 'your page' : f.name.split(' ')[0]}
              </Button>
            </div>
          </Tile>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <Button variant="ghost" onClick={onStart}>Fundraise for this burden</Button>
      </div>
    </div>
  )
}

// Copy link, WhatsApp, Email, and the device's own share menu where there is one.
export function ShareOptions({ campaign, church, fundraiser, onPoster }) {
  const url = shareUrl(campaign.id, fundraiser?.id)
  const text = shareText(campaign, church, fundraiser)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true) } catch { window.prompt('Copy this link', url) }
  }
  const canShare = typeof navigator !== 'undefined' && !!navigator.share
  const row = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
    padding: '16px 0', background: 'transparent', border: 'none', borderBottom: '1px solid ' + colors.ruleSoft,
    fontSize: 14, color: colors.ink, cursor: 'pointer', textAlign: 'left', textDecoration: 'none',
  }
  return (
    <div>
      <Label>Your link</Label>
      <div style={{ display: 'flex', marginTop: 12, border: '1px solid ' + colors.rule }}>
        <input readOnly value={url} onFocus={e => e.target.select()} aria-label="Share link" style={{
          flex: 1, minWidth: 0, padding: '14px 16px', border: 'none', background: 'transparent',
          fontSize: 12, color: colors.inkSoft, outline: 'none',
        }} />
        <button onClick={copy} style={{
          padding: '0 16px', border: 'none', borderLeft: '1px solid ' + colors.rule, cursor: 'pointer',
          background: colors.ink, color: colors.accentInk, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
        }}>{copied ? 'Copied ✓' : 'Copy link'}</button>
      </div>
      <div style={{ marginTop: 16 }}>
        <a style={row} href={'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url)} target="_blank" rel="noreferrer">
          WhatsApp <span aria-hidden>→</span>
        </a>
        <a style={row} href={'mailto:?subject=' + encodeURIComponent(campaign.title) + '&body=' + encodeURIComponent(text + '\n\n' + url)}>
          Email <span aria-hidden>→</span>
        </a>
        {canShare && (
          <button style={row} onClick={() => navigator.share({ title: campaign.title, text, url }).catch(() => {})}>
            More options <span aria-hidden>→</span>
          </button>
        )}
        {onPoster && (
          <button style={row} onClick={onPoster}>
            QR poster for church <span aria-hidden>→</span>
          </button>
        )}
      </div>
    </div>
  )
}

// A sheet over the page, as GoFundMe's "Quick share", in BURDEN's paper and hairlines.
export function ShareSheet({ open, onClose, campaign, church, fundraiser, onFundraise, onPoster }) {
  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      // above the Dock (50), below the Splash (100)
      position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(10,10,10,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div role="dialog" aria-modal="true" aria-label="Share this burden" onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 560, background: colors.bg, padding: '24px 24px 40px',
        borderTop: '1px solid ' + colors.rule, maxHeight: '88vh', overflowY: 'auto', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: colors.ink }}>Share this burden</span>
          <button onClick={onClose} aria-label="Close" style={{
            background: 'transparent', border: 'none', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: colors.ink,
          }}>×</button>
        </div>
        <ShareOptions campaign={campaign} church={church} fundraiser={fundraiser} onPoster={onPoster} />
        {onFundraise && (
          <div style={{ marginTop: 28 }}>
            <Label>Carry it further</Label>
            <p style={{ ...body, fontSize: 13 }}>
              Start your own page for this burden and invite your friends, church or colleagues to give through it.
            </p>
            <div style={{ marginTop: 16 }}>
              <Button full onClick={onFundraise}>Fundraise for this burden</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
