// BURDEN by PVA — design tokens
// Reverent, trustworthy, warm, plain. No religious iconography by default.

export const colors = {
  bg: '#f7f6f2',          // warm paper
  bgAlt: '#ecebe5',       // subtle panel
  ink: '#0a0a0a',         // primary text
  inkSoft: '#4a4a4a',     // secondary text
  inkMuted: '#8a8a85',    // tertiary / labels
  rule: '#1a1a1a',        // hairlines & strong borders
  ruleSoft: '#d8d6cf',    // soft dividers
  accent: '#1a1a1a',      // primary action (mono, restrained)
  accentInk: '#f7f6f2',   // text on accent
  trust: '#2c5e3f',       // verified badge — quiet evergreen
  warn: '#8a5a2b',        // pending — quiet ochre
}

export const font = {
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
}

export const space = (n) => `${n * 4}px`

export const radius = {
  none: '0px',
  sm: '2px',
  md: '4px',
}
