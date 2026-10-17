// BURDEN by HOUSEPVA — design tokens
// Reverent, trustworthy, warm, plain. No religious iconography by default.
//
// 2026-07-02 overhaul pass (BURDEN_app_design_overhaul_prompt.md) applied
// WITHOUT the §1 color pivot — palette remains warm paper + glassy navy.
// Adopted: §2 typography (Source Serif 4 + Inter, 3 weights, fixed scale),
// §3 strict 8px spacing, §4 whitespace-not-lines, §5 motion, §6 daily
// reading, §7 haptics.

export const colors = {
  bg: '#f7f6f2',          // warm paper
  bgAlt: '#ecebe5',       // subtle panel
  ink: '#0a0a0a',         // primary text
  inkSoft: '#4a4a4a',     // secondary text
  inkMuted: '#8a8a85',    // tertiary / labels
  rule: '#1a1a1a',        // hairlines & strong borders (inputs + hero card ONLY per §4)
  ruleSoft: '#d8d6cf',    // soft dividers (inputs only per §4)
  accent: '#1a1a1a',      // primary action (mono, restrained)
  accentInk: '#f7f6f2',   // text on accent
  trust: '#2c5e3f',       // verified badge — quiet evergreen (paper bg)
  warn: '#8a5a2b',        // pending — quiet ochre (paper bg)
  trustOnNavy: '#7ec48a', // verified badge — bright evergreen (navy bg)
  warnOnNavy: '#e0a86b',  // pending — warm ochre (navy bg)

  // Glassy navy tile palette — used for cards, tiles, surfaces that should "pop".
  navy:        '#0b1a35',
  navyDeep:    '#050c1d',
  navyEdge:    '#1f3360',
  navyInk:     '#eef2fb',   // primary text on navy
  navySoft:    '#b9c4dc',   // secondary text on navy
  navyMuted:   '#7a89a8',   // tertiary text on navy
  navyRule:    'rgba(255,255,255,0.10)',
  navyHi:      'rgba(255,255,255,0.10)',  // top sheen
  navyLo:      'rgba(0,0,0,0.38)',        // bottom shadow inside tile

  // Funding banner tones
  fundLow:  '#c44a3e',
  fundMid:  '#caa14b',
  fundHigh: '#3f8a5a',
}

// Glassy navy gradient + 3D shadow stack — used on tiles to "pop".
export const tile = {
  // Diagonal navy gradient with a top sheen highlight.
  background: `
    linear-gradient(180deg, ${colors.navyHi} 0%, rgba(255,255,255,0) 38%),
    linear-gradient(155deg, ${colors.navy} 0%, ${colors.navyDeep} 100%)
  `,
  border: '1px solid ' + colors.navyEdge,
  // Layered shadow: outer drop + raised bevel + inset top highlight + inset bottom shade.
  shadow: [
    '0 1px 0 rgba(255,255,255,0.10) inset',
    '0 -14px 22px rgba(0,0,0,0.28) inset',
    '0 18px 30px -12px rgba(5,12,29,0.55)',
    '0 6px 12px -6px rgba(5,12,29,0.45)',
  ].join(', '),
  shadowHover: [
    '0 1px 0 rgba(255,255,255,0.14) inset',
    '0 -14px 22px rgba(0,0,0,0.32) inset',
    '0 28px 44px -14px rgba(5,12,29,0.65)',
    '0 10px 18px -8px rgba(5,12,29,0.55)',
  ].join(', '),
  ink:    colors.navyInk,
  soft:   colors.navySoft,
  muted:  colors.navyMuted,
  rule:   colors.navyRule,
}

// Two fonts, three weights (400/500/600) — nothing else (§2).
// Serif: wordmark, hero headline, section labels, project titles.
// Sans: everything else.
export const font = {
  serif: "'Source Serif 4 Variable', 'Source Serif 4', Georgia, 'Times New Roman', serif",
  sans: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  // Legacy key — a few files import `font.mono`; it now resolves to the
  // sans stack (JetBrains Mono retired per §2).
  mono: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
