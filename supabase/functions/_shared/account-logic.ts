// Pure rules for giver accounts and fundraisers (no database, no network) —
// unit-tested in Node. The Deno side: functions/account, functions/fundraisers.

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export const FUNDRAISER_NOTE_MAX = 280;

export function parseFundraiser(b: Record<string, unknown>): Parsed<{ campaign_id: string; name: string; note: string; goal_minor: number }> {
  const campaignId = typeof b.campaignId === 'string' ? b.campaignId.trim() : '';
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const note = typeof b.note === 'string' ? b.note.trim() : '';
  const goal = Math.floor(Number(b.goal));
  if (!campaignId) return { ok: false, error: 'Missing the burden.' };
  if (!name || name.length > 80) return { ok: false, error: 'Enter your name as your circle knows you.' };
  if (!note || note.length > FUNDRAISER_NOTE_MAX) return { ok: false, error: `Say why you’re carrying it, in up to ${FUNDRAISER_NOTE_MAX} characters.` };
  if (!(goal >= 1) || goal > 100_000) return { ok: false, error: 'Set a goal for your circle of at least $1.' };
  return { ok: true, value: { campaign_id: campaignId, name, note, goal_minor: goal * 100 } };
}

// fr_ + 12 random base-36 characters (the caller passes the random bytes).
export function fundraiserId(bytes: Uint8Array): string {
  return 'fr_' + Array.from(bytes.slice(0, 12), (x) => (x % 36).toString(36)).join('');
}

export type FundraiserRow = {
  id: string; created_at: string; campaign_id: string; name: string; note: string; goal_minor: number; status: string;
};

// The public shape (matches the apps' Fundraiser type). `raised` counts only
// gifts that went through — the same rule as the burden's own total.
export function publicFundraiser(f: FundraiserRow, raisedMinor: number, own = false) {
  return {
    id: f.id, campaignId: f.campaign_id, name: f.name, note: f.note,
    goal: f.goal_minor / 100, raised: raisedMinor / 100, started: f.created_at.slice(0, 10),
    closed: f.status !== 'open', ...(own ? { own: true } : {}),
  };
}

export const COUNTED_STATUSES = ['held', 'paid_out', 'church_confirmed'];

export function raisedBy(gifts: { fundraiser_id: string | null; status: string; amount_minor: number }[]) {
  const out: Record<string, number> = {};
  for (const g of gifts) {
    if (!g.fundraiser_id || !COUNTED_STATUSES.includes(g.status)) continue;
    out[g.fundraiser_id] = (out[g.fundraiser_id] ?? 0) + g.amount_minor;
  }
  return out;
}

// The giver's view of one of their gifts on any device (gift-status's shape,
// without the token the original device holds).
export type GiverGiftRow = {
  id: string; status: string; status_note: string | null; hold_until: string | null; provider: string;
  payment_method: string | null; test_mode: boolean; campaign_id: string; campaign_title: string; church_name: string;
  amount_minor: number; fee_minor: number; total_minor: number; recurring: boolean; anonymous: boolean;
  created_at: string; payout_to: string | null; fundraiser_id: string | null; donor_name: string | null;
};

export function giverGift(g: GiverGiftRow, events: { step: string; occurred_at: string; note: string | null }[]) {
  return {
    id: g.id, live: true, account: true, status: g.status, statusNote: g.status_note, holdUntil: g.hold_until,
    provider: g.provider, paymentMethod: g.payment_method, testMode: g.test_mode,
    campaignId: g.campaign_id, campaignTitle: g.campaign_title, churchName: g.church_name,
    amount: g.amount_minor / 100, coveredFee: g.fee_minor / 100, total: g.total_minor / 100,
    recurring: g.recurring, anonymous: g.anonymous, donorName: g.donor_name ?? '',
    timestamp: g.created_at, payoutTo: g.payout_to, fundraiserId: g.fundraiser_id, events,
  };
}
