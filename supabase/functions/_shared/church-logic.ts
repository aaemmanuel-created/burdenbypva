// Pure rules for church accounts and notifications (no database, no
// network) — unit-tested in Node. The Deno side: functions/church,
// functions/notify-sweep.

import { BURDENS } from './burdens.ts';

export type Member = { church_id: string; email: string; display_name: string; role_title: string; role: 'admin' | 'editor' };

export const burdensOf = (churchId: string) => BURDENS.filter((b) => b.churchId === churchId);
export const ownsBurden = (churchId: string, campaignId: string) =>
  BURDENS.some((b) => b.id === campaignId && b.churchId === churchId);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseUpdate(b: Record<string, unknown>): { ok: true; title: string; body: string } | { ok: false; error: string } {
  const title = typeof b.title === 'string' ? b.title.trim() : '';
  const body = typeof b.body === 'string' ? b.body.trim() : '';
  if (title.length < 3 || title.length > 120) return { ok: false, error: 'Give the update a short title (3–120 characters).' };
  if (body.length < 10 || body.length > 2000) return { ok: false, error: 'Write the update in 10–2,000 characters.' };
  return { ok: true, title, body };
}

export function parseInvite(b: Record<string, unknown>):
  { ok: true; email: string; display_name: string; role_title: string; role: 'admin' | 'editor' } | { ok: false; error: string } {
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const name = typeof b.displayName === 'string' ? b.displayName.trim() : '';
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Enter their email address.' };
  if (!name || name.length > 80) return { ok: false, error: 'Enter their name as it should appear on updates.' };
  const roleTitle = typeof b.roleTitle === 'string' ? b.roleTitle.trim().slice(0, 60) : '';
  return { ok: true, email, display_name: name, role_title: roleTitle, role: b.role === 'admin' ? 'admin' : 'editor' };
}

// What a church sees about each gift: never the giver's email; the name only
// when they did not give anonymously.
export type GiftForChurch = {
  id: string; created_at: string; campaign_id: string; status: string;
  amount_minor: number; charge_currency: string; charge_amount_minor: number; fx_rate: number;
  anonymous: boolean; donor_name: string | null; recurring: boolean; test_mode: boolean; payout_to: string | null;
};

export function churchView(g: GiftForChurch) {
  return {
    id: g.id,
    ref: g.id.slice(0, 8).toUpperCase(),
    date: g.created_at,
    campaignId: g.campaign_id,
    status: g.status,
    amount: g.amount_minor / 100,                          // USD, the gift itself
    local: g.charge_currency === 'USD' ? null
      : { currency: g.charge_currency, amount: Math.round(g.amount_minor * Number(g.fx_rate)) / 100 },
    giver: g.anonymous ? 'Anonymous' : (g.donor_name ?? 'Anonymous'),
    monthly: g.recurring,
    test: g.test_mode,
    paidTo: g.payout_to,
    canConfirm: g.status === 'paid_out',
  };
}

const COUNTED = ['held', 'paid_out', 'church_confirmed'];

export function totals(gifts: GiftForChurch[]) {
  const by = new Map<string, { campaignId: string; given: number; gifts: number; held: number; paidOut: number; awaiting: number }>();
  for (const g of gifts) {
    if (!COUNTED.includes(g.status)) continue;
    const t = by.get(g.campaign_id) ?? { campaignId: g.campaign_id, given: 0, gifts: 0, held: 0, paidOut: 0, awaiting: 0 };
    t.given += g.amount_minor / 100;
    t.gifts += 1;
    if (g.status === 'held') t.held += g.amount_minor / 100;
    if (g.status !== 'held') t.paidOut += g.amount_minor / 100;
    if (g.status === 'paid_out') t.awaiting += 1;
    by.set(g.campaign_id, t);
  }
  return [...by.values()];
}

export const maskAccount = (n: string) => '•••• ' + n.slice(-4);

// ── Notifications ───────────────────────────────────────────────────────

export type NotifyGift = { church_name: string; campaign_title: string; amount_minor: number; test_mode: boolean };

const usd = (minor: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'USD' }).format(minor / 100);

// The two gift events a giver hears about without opting in (they are about
// their own money), and the opt-in "new update" message.
export function giftEventMessage(step: string, g: NotifyGift, note: string | null): { title: string; body: string } | null {
  const pre = g.test_mode ? '[TEST] ' : '';
  if (step === 'paid_out') {
    return {
      title: `${pre}Your gift reached ${g.church_name}`,
      body: `Your ${usd(g.amount_minor)} gift to "${g.campaign_title}" has been paid to ${g.church_name}.` +
        (note ? ` ${note}` : ''),
    };
  }
  if (step === 'church_confirmed') {
    return {
      title: `${pre}${g.church_name} confirmed your gift`,
      body: `${g.church_name} confirmed your gift to "${g.campaign_title}" arrived.` + (note ? ` They wrote: "${note}"` : ''),
    };
  }
  return null;
}

export function updateMessage(u: { title: string; body: string; author: string }, campaignTitle: string) {
  return {
    title: `New update: ${campaignTitle}`,
    body: `${u.title} — ${u.body.length > 180 ? u.body.slice(0, 177) + '…' : u.body} (${u.author})`,
  };
}
