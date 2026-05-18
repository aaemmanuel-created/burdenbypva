import { colors } from '../theme.js'
import { campaigns } from '../data/mock.js'

// Home — page 2 of the app. Designed to match the supplied screenshot:
//   • a soft glassy pastel-blue background covering the whole viewport
//   • the BURDEN by PVA wordmark stacked in the top-left
//       (BURDEN bold and large, BY PVA letter-spaced underneath)
//   • three uppercase titles, tight stack, left-aligned, navy
//
// The page's own background and wordmark override the global Header,
// which is suppressed on this route (see App.jsx / Header.jsx).

const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
const NAVY = '#0e1b3a'
const NAVY_MUTED = '#9aa0b3'

// Frosted glass — layered radial gradients on a cool light base. Cooler
// blue blobs at top-left and bottom-right echo the screenshot's haze.
const GLASS_BG = `
  radial-gradient(ellipse 70% 55% at 20% 15%, rgba(210, 222, 244, 0.65) 0%, rgba(210, 222, 244, 0) 65%),
  radial-gradient(ellipse 65% 55% at 85% 90%, rgba(178, 199, 235, 0.55) 0%, rgba(178, 199, 235, 0) 65%),
  radial-gradient(ellipse 90% 60% at 50% 50%, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 70%),
  linear-gradient(165deg, #eaeef7 0%, #dde5f2 55%, #e8edf6 100%)
`

export default function Home({ navigate }) {
  const highlightId = campaigns.find(c => c.id === 'cmp_redeemer_clinic')?.id

  const titles = [
    { label: 'BURDEN OF THE WEEK', go: () => navigate({ name: 'campaign', id: highlightId }) },
    { label: 'BURDENS',            go: () => navigate({ name: 'discover' }) },
    { label: 'SPREE',              go: () => navigate({ name: 'spree' }) },
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: GLASS_BG,
      overflow: 'auto',
    }}>
      <main style={{
        position: 'relative',
        minHeight: '100vh',
        padding: '36px 36px 64px',
        fontFamily: HELVETICA,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Stacked wordmark — top-left, JetBrains Mono.
            Both lines share the same left edge as the title stack
            below (the parent <main>'s left padding). The trailing
            letter-spacing on BY PVA only affects spacing AFTER each
            glyph, so the first letter stays flush with BURDEN's B. */}
        <div>
          <div style={{
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 'clamp(26px, 5vw, 34px)',
            letterSpacing: 0,
            color: NAVY,
            lineHeight: 1,
          }}>BURDEN</div>
          <div style={{
            fontFamily: MONO,
            fontWeight: 400,
            fontSize: 'clamp(10px, 1.3vw, 12px)',
            letterSpacing: 4,
            color: NAVY_MUTED,
            marginTop: 8,
          }}>BY PVA</div>
        </div>

        {/* Three titles — clustered roughly in the middle, tight stack */}
        <div style={{
          marginTop: 'auto',
          marginBottom: 'auto',
          paddingTop: 'clamp(48px, 14vh, 140px)',
          paddingBottom: 'clamp(48px, 14vh, 140px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(4px, 1.2vh, 12px)',
          alignItems: 'flex-start',
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
                fontWeight: 500,
                fontSize: 'clamp(26px, 5vw, 38px)',
                letterSpacing: 0.5,
                lineHeight: 1.25,
                color: NAVY,
              }}
            >{t.label}</button>
          ))}
        </div>
      </main>
    </div>
  )
}
