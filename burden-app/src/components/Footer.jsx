import { colors, font, type } from '../theme.js'
import { LANGUAGES, useI18n } from '../lib/i18n.jsx'

// Footer — §4: the dividing rule is gone; 96px of whitespace does the work.

export default function Footer({ navigate }) {
  const { t, lang, setLang } = useI18n()
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
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <button onClick={() => navigate?.({ name: 'church' })} style={{
            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit',
            letterSpacing: 'inherit', color: colors.ink, textDecoration: 'underline',
          }}>{t('footer.churches')}</button>
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'baseline' }}>
            {t('lang.label')}
            <select value={lang} onChange={e => setLang(e.target.value)} style={{
              font: 'inherit', color: colors.ink, background: 'transparent', border: 'none', borderBottom: '1px solid ' + colors.rule, cursor: 'pointer',
            }}>
              {Object.entries(LANGUAGES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </label>
          <span>Eligibility policy</span>
          <span>Trust &amp; verification</span>
          <span>Privacy</span>
          <span>Transparency report</span>
        </div>
      </div>
    </footer>
  )
}
