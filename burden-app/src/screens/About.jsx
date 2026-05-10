import { colors } from '../theme.js'
import { Label, Rule } from '../components/UI.jsx'
import { principles } from '../data/mock.js'

export default function About() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 28px 0' }}>
      <Label>About</Label>
      <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: -0.5, marginTop: 14, marginBottom: 36, lineHeight: 1.15 }}>
        A trustworthy way to give to the global church.
      </h1>

      <p style={{ fontSize: 14, lineHeight: 1.8, color: colors.inkSoft, marginBottom: 24 }}>
        BURDEN by PVA is a global Christian fundraising platform. It exists so that local churches
        and Christian institutions can raise funds transparently from regular people, anywhere in
        the world. Donors can give as little as one dollar. Every church is verified before it
        can receive funds.
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: colors.inkSoft, marginBottom: 48 }}>
        BURDEN is ecumenical — Catholic, Orthodox, and Protestant traditions are eligible if they
        affirm the historic creeds and operate under accountable Christian leadership. The platform
        does not rank or favour any tradition. It does not host political endorsements, and it
        does not tie giving to material reward.
      </p>

      <Rule />

      <section style={{ padding: '40px 0' }}>
        <Label>Operating principles</Label>
        <ol style={{
          marginTop: 18,
          listStyle: 'none',
          padding: 0,
          counterReset: 'b',
        }}>
          {principles.map((p, i) => (
            <li key={i} style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr',
              gap: 16,
              padding: '18px 0',
              borderBottom: '1px solid ' + colors.ruleSoft,
              alignItems: 'baseline',
            }}>
              <span style={{
                fontSize: 11,
                color: colors.inkMuted,
                letterSpacing: 1,
              }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ fontSize: 14, lineHeight: 1.6, color: colors.ink }}>{p}</span>
            </li>
          ))}
        </ol>
      </section>

      <Rule />

      <section style={{ padding: '40px 0' }}>
        <Label>Verification tiers</Label>
        <div style={{ marginTop: 18 }}>
          {[
            { tier: 'Basic', desc: 'Identity-verified leadership, registered legal entity, capped at $5,000 monthly.' },
            { tier: 'Verified', desc: 'Bank-verified payout, two-person leadership reference, board attestation, no cap.' },
            { tier: 'Premium Trust', desc: 'Audited financials, public transparency report, eligible for featuring.' },
          ].map(t => (
            <div key={t.tier} style={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr',
              gap: 24,
              padding: '18px 0',
              borderBottom: '1px solid ' + colors.ruleSoft,
              alignItems: 'baseline',
            }}>
              <span style={{
                fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                fontWeight: 600, color: colors.ink,
              }}>{t.tier}</span>
              <span style={{ fontSize: 13, lineHeight: 1.6, color: colors.inkSoft }}>{t.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <Rule />

      <section style={{ padding: '40px 0 0' }}>
        <Label>Where BURDEN is launching</Label>
        <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.75, color: colors.inkSoft }}>
          Pilot market: <strong style={{ color: colors.ink }}>United Kingdom</strong>, with diaspora
          giving corridors to Nigeria, Ghana, Kenya, and the Philippines in the first year. Expansion
          to United States and Canada targeted at month 12.
        </p>
      </section>
    </main>
  )
}
