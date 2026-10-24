// BURDEN by HOUSEPVA — design tokens
// Reverent, trustworthy, warm, plain. No religious iconography by default.
//
// 2026-10-17: brought in line with the native app (burden-native/src/
// constants/theme.ts) — Helvetica throughout, lighter blue gradient tiles,
// amber mid-funding tone. Keep the two files in step.

export const colors = {
  bg: '#f7f6f2',          // warm paper
  bgAlt: '#ecebe5',       // subtle panel
  ink: '#0a0a0a',         // primary text
  inkSoft: '#4a4a4a',     // secondary text
  inkMuted: '#676762',    // tertiary / labels — was #8a8a85 (3.2:1); darkened 2026-10-24 for WCAG AA 4.5:1
  rule: '#1a1a1a',        // hairlines & strong borders (inputs + hero card ONLY per §4)
  ruleSoft: '#d8d6cf',    // soft dividers (inputs only per §4)
  accent: '#1a1a1a',      // primary action (mono, restrained)
  accentInk: '#f7f6f2',   // text on accent
  trust: '#2c5e3f',       // verified badge — quiet evergreen (paper bg)
  warn: '#8a5a2b',        // pending — quiet ochre (paper bg)
  trustOnNavy: '#7ec48a', // verified badge — bright evergreen (navy bg)
  warnOnNavy: '#e0a86b',  // pending — warm ochre (navy bg)

  // Blue tile palette — lightened 2026-10-17 to match the app (was #0b1a35).
  navy:        '#3a69ad',
  navyTop:     '#3563a6',   // tile gradient top — was #5a8bd1; darkened 2026-10-25 so text on tiles passes WCAG AA
  navyBottom:  '#2d5797',   // … to deeper bottom
  navyDeep:    '#1d3a6e',   // text on white buttons inside a tile
  navyEdge:    '#6b95d3',
  navyInk:     '#eef2fb',   // primary text on blue
  navySoft:    '#e8eef9',   // secondary text on blue
  navyMuted:   '#ebf0fa',   // tertiary text on blue — was #cfdcf2 (2.5–4:1); now ≥4.5:1 everywhere on the tile
  navyRule:    'rgba(255,255,255,0.10)',
  navyHi:      'rgba(255,255,255,0.06)',  // top sheen — was 0.10; softer so the top keeps 4.5:1 contrast
  navyLo:      'rgba(0,0,0,0.38)',        // bottom shadow inside tile

  // Funding square tones: red (under a third), amber (halfway), green (almost / fully)
  fundLow:  '#b8433a', // was #c44a3e (4.4:1) — WCAG AA
  fundMid:  '#e09a2d',
  fundHigh: '#3f8a5a',
}

// Blue gradient + soft lift — used on tiles to "pop".
export const tile = {
  background: `
    linear-gradient(180deg, ${colors.navyHi} 0%, rgba(255,255,255,0) 38%),
    linear-gradient(160deg, ${colors.navyTop} 0%, ${colors.navyBottom} 100%)
  `,
  border: '1px solid ' + colors.navyEdge,
  shadow: [
    '0 1px 0 rgba(255,255,255,0.14) inset',
    '0 14px 24px -14px rgba(5,12,29,0.45)',
  ].join(', '),
  shadowHover: [
    '0 1px 0 rgba(255,255,255,0.18) inset',
    '0 22px 36px -16px rgba(5,12,29,0.5)',
  ].join(', '),
  ink:    colors.navyInk,
  soft:   colors.navySoft,
  muted:  colors.navyMuted,
  rule:   colors.navyRule,
}

// Helvetica throughout, as in the app. The three keys are kept so existing
// screens keep working; they all resolve to the same stack now.
const helvetica = "Helvetica, 'Helvetica Neue', Arial, sans-serif"
export const font = {
  serif: helvetica,
  sans: helvetica,
  mono: helvetica,
}

// Type scale (px) — §2, do not deviate.
export const type = {
  xs:    { fontSize: 12, lineHeight: 1.45 },
  sm:    { fontSize: 14, lineHeight: 1.45 },
  base:  { fontSize: 16, lineHeight: 1.5 },
  lg:    { fontSize: 18, lineHeight: 1.5 },
  xl:    { fontSize: 22, lineHeight: 1.35 },
  '2xl': { fontSize: 28, lineHeight: 1.25 },
  '3xl': { fontSize: 40, lineHeight: 1.2 },
}

// Strict 8px spacing scale (§3): 8, 16, 24, 32, 48, 64, 96, 128.
// space(1)=8 … 4px exists solely for inline icon nudges.
export const space = (n) => `${n * 8}px`

export const radius = {
  none: '0px',
  sm: '2px',
  md: '4px',
  tile: '14px',
}
