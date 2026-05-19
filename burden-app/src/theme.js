// BURDEN by PVA — design tokens
// Glass-blue palette, mobile-first. JetBrains Mono everywhere except the splash
// thank-you line (Helvetica) and the menu items (Helvetica).

export const colors = {
  bg: '#f4f6fb',
  bgPure: '#ffffff',
  fg: '#0b1638',
  fgSoft: '#1f2c52',
  muted: 'rgba(11,22,56,0.5)',
  mutedStrong: 'rgba(11,22,56,0.72)',
  line: 'rgba(11,22,56,0.08)',
  lineStrong: 'rgba(11,22,56,0.14)',
  navyDeep: '#0b1638',
  navyMid: '#1a2c66',
  navyBright: '#3d5db5',
  accent: '#2b4aa3',
  accentSoft: 'rgba(43,74,163,0.10)',
  accentBorder: 'rgba(43,74,163,0.28)',

  // Legacy aliases kept so unused screens (Give, History, About) keep compiling.
  ink: '#0b1638',
  inkSoft: '#1f2c52',
  inkMuted: 'rgba(11,22,56,0.5)',
  rule: 'rgba(11,22,56,0.14)',
  ruleSoft: 'rgba(11,22,56,0.08)',
  accentInk: '#ffffff',
  bgAlt: '#ecedf3',
  trust: '#2c5e3f',
  warn: '#8a5a2b',
}

export const font = {
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
}

export const space = (n) => `${n * 4}px`

export const radius = {
  none: '0px',
  sm: '2px',
  md: '4px',
  lg: '14px',
  xl: '22px',
}
