import { colors } from '../theme.js'
import { Badge, Button, Label } from '../components/UI.jsx'
import { qrSvgPath } from '../lib/qr.js'
import { findFundraiser, shareUrl } from '../lib/community.js'
import { USSD_CODE } from '../lib/payments.js'
import { campaigns, churches } from '../data/mock.js'

// A printable QR poster for a burden — for the church noticeboard or the
// Sunday service. Scanning opens the burden page (or a fundraiser's link),
// where the giver sees the verification tier and where every dollar goes.

export default function Poster({ id, navigate, fundraisers = [], fundraiserId }) {
  const campaign = campaigns.find(c => c.id === id)
  const church = campaign && churches.find(ch => ch.id === campaign.churchId)
  if (!campaign) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 28px' }}>
        <p>Burden not found.</p>
        <Button onClick={() => navigate({ name: 'discover' })}>Back to Discover</Button>
      </main>
    )
  }
  const fundraiser = findFundraiser(fundraiserId, fundraisers)
  const url = shareUrl(campaign.id, fundraiser?.id)
  const { size, d } = qrSvgPath(url)

  return (
    <main className="print-area" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 120px' }}>
      <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        <Button onClick={() => window.print()}>Print poster</Button>
        <Button variant="ghost" onClick={() => navigate({ name: 'campaign', id: campaign.id, fundraiserId: fundraiser?.id })}>
          Back to the burden
        </Button>
      </div>

      <article style={{
        border: '1px solid ' + colors.rule, background: '#fff', padding: '48px 40px',
        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        <Label>Carry this burden with us</Label>
        <div style={{ fontSize: 15, fontWeight: 600, color: colors.ink }}>{church.name}</div>
        {church.verified && <Badge tone="trust">{church.tier}</Badge>}
        <h1 style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 500, margin: '8px 0', color: colors.ink }}>{campaign.title}</h1>
        {fundraiser && (
          <div style={{ fontSize: 13, color: colors.inkSoft }}>with {fundraiser.name}</div>
        )}
        <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} width="280" height="280" role="img"
          aria-label={`QR code for ${url}`} shapeRendering="crispEdges" style={{ margin: '16px 0' }}>
          <rect x="-2" y="-2" width={size + 4} height={size + 4} fill="#fff" />
          <path d={d} fill={colors.ink} />
        </svg>
        <div style={{ fontSize: 14, color: colors.ink }}>Scan with your phone camera to give.</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: colors.inkSoft, maxWidth: 380 }}>
          Mobile money, card, Apple Pay or Google Pay. Every gift goes to the church's verified account,
          and the page shows where every dollar goes.
        </div>
        {USSD_CODE && (
          <div style={{ fontSize: 13, color: colors.ink, marginTop: 4 }}>
            No smartphone? Dial <strong>{USSD_CODE}</strong> on MTN, Telecel or AirtelTigo.
          </div>
        )}
        <div style={{ fontSize: 10, letterSpacing: 1, color: colors.inkMuted, wordBreak: 'break-all', marginTop: 8 }}>{url}</div>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: colors.inkMuted, marginTop: 16 }}>
          BURDEN by HOUSEPVA
        </div>
      </article>
    </main>
  )
}
