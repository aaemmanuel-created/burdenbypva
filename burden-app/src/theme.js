// BURDEN by PVA — design tokens
// Reverent, trustworthy, plain. No religious iconography by default.

export const colors = {
  bg: '#ffffff',          // white backdrop, app-wide
  bgAlt: '#f3f5fa',       // subtle panel — faint cool tint
  ink: '#0a0a0a',         // primary text (black)
  inkSoft: '#3a3a3a',     // secondary text
  inkMuted: '#7a7a7a',    // tertiary / labels
  rule: '#0a0a0a',        // hairlines & strong borders
  ruleSoft: '#e2e6ee',    // soft dividers (cool tone now)
  accent: '#0a0a0a',      // primary action (mono, restrained)
  accentInk: '#ffffff',   // text on accent
  trust: '#1f6a3d',       // verified badge — quiet evergreen
  warn: '#7a4b1d',        // pending — quiet ochre

  // Glass-blue palette — used by the Tile primitive across the app.
  glassBlueHi:   'rgba(214, 230, 255, 0.85)',   // top of tile gradient
  glassBlueLo:   'rgba(168, 199, 246, 0.78)',   // bottom of tile gradient
  glassWhiteHi:  'rgba(255, 255, 255, 0.55)',   // sheen across top
  glassEdge:     'rgba(255, 255, 255, 0.78)',   // border highlight (glass rim)
  glassInk:      '#0a1430',                     // text on glass tile
  glassSoft:     '#33405e',                     // secondary text on glass
  glassMuted:    '#5a6680',                     // tertiary text on glass
  glassRule:     'rgba(20, 40, 90, 0.14)',
  // We keep the legacy on-tile text colour names so existing screens that
  // pass onNavy={true} continue to render correctly without a refactor —
  // the meaning is now "on glass tile" rather than "on navy".

  // Funding banner tones
  fundLow:  '#c44a3e',
  fundMid:  '#caa14b',
  fundHigh: '#2e8a5a',

  // Compatibility aliases (older screens may still reference these names).
  trustOnNavy: '#1f6a3d',
  warnOnNavy:  '#7a4b1d',
  navy:        '#0a1430',
  navyDeep:    '#050b1d',
  navyEdge:    '#1f3360',
  navyInk:     '#0a1430',
  navySoft:    '#33405e',
  navyMuted:   '#5a6680',
  navyRule:    'rgba(20, 40, 90, 0.14)',
  navyHi:      'rgba(255,255,255,0.55)',
  navyLo:      'rgba(0,0,0,0.10)',
}

// Blue-glass tile recipe — light, translucent, with a pop-up shadow stack
// that makes the card feel like it has just lifted off the page.
export const tile = {
  background: `
    linear-gradient(180deg, ${colors.glassWhiteHi} 0%, rgba(255,255,255,0) 50%),
    linear-gradient(155deg, ${colors.glassBlueHi} 0%, ${colors.glassBlueLo} 100%)
  `,
  backdropFilter: 'blur(14px) saturate(140%)',
  border: '1px solid ' + colors.glassEdge,
  shadow: [
    '0 1px 0 rgba(255,255,255,0.95) inset',
    '0 -8px 16px rgba(80,110,180,0.10) inset',
    '0 18px 34px -14px rgba(60,100,180,0.42)',
    '0 6px 14px -6px rgba(60,100,180,0.28)',
  ].join(', '),
  shadowHover: [
    '0 1px 0 rgba(255,255,255,1) inset',
    '0 -8px 16px rgba(80,110,180,0.14) inset',
    '0 32px 50px -16px rgba(60,100,180,0.55)',
    '0 12px 22px -8px rgba(60,100,180,0.40)',
  ].join(', '),
  ink:    colors.glassInk,
  soft:   colors.glassSoft,
  muted:  colors.glassMuted,
  rule:   colors.glassRule,
}

export const font = {
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
}

export const space = (n) => `${n * 4}px`

export const radius = {
  none: '0px',
  sm: '2px',
  md: '4px',
  tile: '14px',
}
