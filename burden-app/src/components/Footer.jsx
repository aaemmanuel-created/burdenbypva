import { colors, font, type } from '../theme.js'

// Footer — §4: the dividing rule is gone; 96px of whitespace does the work.

export default function Footer() {
  return (
    <footer style={{ marginTop: 96 }}>
      <div style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '32px 32px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 24,
        flexWrap: 'wrap',
        color: colors.inkMuted,
        fontFamily: font.sans,
        fontSize: type.xs.fontSize,
        lineHeight: type.xs.lineHeight,
        letterSpacing: '6%',
      }}>
        <div>BURDEN by HOUSEPVA — bear one another's burdens.</div>
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
