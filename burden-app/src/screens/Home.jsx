import { colors } from '../theme.js'
import { campaigns } from '../data/mock.js'

// Home — page 2 of the app (page 1 is the splash).
//
// By design this page is a menu, nothing more: the BURDEN by PVA wordmark
// at the top (rendered by Header) and three section titles below. All
// titles in Helvetica, weight 300, not bold. Clicking a title takes you
// to its dedicated screen — no tile grids, no intro paragraph, no other
// content lives on this page.

const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export default function Home({ navigate }) {
  // BURDEN OF THE WEEK opens the editor's weekly pick directly.
  const highlightId = campaigns.find(c => c.id === 'cmp_redeemer_clinic')?.id

  const titles = [
    { label: 'BURDEN OF THE WEEK', go: () => navigate({ name: 'campaign', id: highlightId }) },
    { label: 'BURDEN',             go: () => navigate({ name: 'discover' }) },
    { label: 'SPREE',              go: () => navigate({ name: 'spree' }) },
  ]

  return (
    <main style={{
      maxWidth: 1080,
      margin: '0 auto',
      padding: '0 28px',
      minHeight: 'calc(100vh - 160px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      gap: 'clamp(28px, 6vh, 64px)',
    }}>
      {titles.map(t => (
        <button
          key={t.label}
          onClick={t.go}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: HELVETICA,
            fontWeight: 300,
            fontSize: 'clamp(36px, 8vw, 80px)',
            letterSpacing: -0.5,
            lineHeight: 1.05,
            color: colors.ink,
          }}
        >{t.label}</button>
      ))}
    </main>
  )
}
