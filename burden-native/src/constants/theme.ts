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
  trustOnNavy: '#7ec48a',
  warnOnNavy: '#e0a86b',

  // Glassy navy tile palette — used for cards, tiles, surfaces that should "pop".
  navy:      '#0b1a35',
  navyDeep:  '#050c1d',
  navyEdge:  '#1f3360',
  navyInk:   '#eef2fb',
  navySoft:  '#b9c4dc',
  navyMuted: '#7a89a8',
  navyRule:  'rgba(255,255,255,0.10)',

  // Funding banner tones
  fundLow:  '#c44a3e',
  fundMid:  '#caa14b',
  fundHigh: '#3f8a5a',
} as const;

export const tile = {
  // Solid navy fallback for RN (no CSS gradients on raw View — use
  // expo-linear-gradient when porting tile components).
  background: colors.navy,
  border: colors.navyEdge,
  ink: colors.navyInk,
  soft: colors.navySoft,
  muted: colors.navyMuted,
  rule: colors.navyRule,
  // 3D shadow recipe — pass these props to a View.
  shadow: {
    shadowColor: '#050c1d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
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

// Funding tier — shared logic with web. Returns a tier object whose colour
// can be applied to a banner or pill on the native side.
export const fundingTier = (raised: number, goal: number) => {
  const pct = goal > 0 ? (raised / goal) * 100 : 0;
  if (pct >= 100) return { key: 'complete' as const, label: 'Fully funded — thank you', color: colors.fundHigh };
  if (pct >= 67)  return { key: 'high'     as const, label: 'Almost funded',            color: colors.fundHigh };
  if (pct >= 33)  return { key: 'mid'      as const, label: 'Halfway home',             color: colors.fundMid };
  return            { key: 'low'      as const, label: 'Just getting started',     color: colors.fundLow };
};
