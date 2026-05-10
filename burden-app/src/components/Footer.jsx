import { colors } from '../theme.js'
import { Rule } from './UI.jsx'

export default function Footer() {
  return (
    <footer style={{ marginTop: 96 }}>
      <Rule soft />
      <div style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '32px 28px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 24,
        flexWrap: 'wrap',
        color: colors.inkMuted,
        fontSize: 10,
        letterSpacing: 1,
      }}>
        <div>BURDEN by PVA — bear one another's burdens.</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <span>Eligibility policy</span>
          <span>Trust &amp; verification</span>
          <span>Privacy</span>
          <span>Transparency report</span>
        </div>
      </div>
    </footer>
  )
}
