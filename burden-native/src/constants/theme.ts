// BURDEN by PVA — design tokens (RN).
// Mirrors burden-app/src/theme.js so the two clients stay visually identical.

export const colors = {
  bg: '#f7f6f2',
  bgAlt: '#ecebe5',
  ink: '#0a0a0a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8a8a85',
  rule: '#1a1a1a',
  ruleSoft: '#d8d6cf',
  accent: '#1a1a1a',
  accentInk: '#f7f6f2',
  trust: '#2c5e3f',
  warn: '#8a5a2b',
} as const;

export const font = {
  regular: 'JetBrainsMono',
  bold: 'JetBrainsMono-Bold',
} as const;

export const formatMoney = (n: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
};
