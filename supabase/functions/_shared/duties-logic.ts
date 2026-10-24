// Pure rules for the money duties the blueprint requires (2026-10-24):
// receipts, refunds, Gift Aid, exchange rates and SMS receipts. No database,
// no network — unit-tested in Node. The Deno side is duties.ts.

// ── Receipts ────────────────────────────────────────────────────────────

export type ReceiptGift = {
  id: string;
  receipt_number: number | string;
  created_at: string;
  amount_minor: number;
  fee_minor: number;
  total_minor: number;
  charge_currency: string;
  charge_amount_minor: number;
  fx_rate: number;
  church_name: string;
  campaign_title: string;
  donor_name: string | null;
  anonymous: boolean;
  recurring: boolean;
  provider: string;
  payment_method: string | null;
  test_mode: boolean;
  gift_aid?: boolean;
};

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(minor / 100);

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const BURDEN_LEGAL_NAME = 'BURDEN by HOUSEPVA';

// USSD donors have no email; their gifts carry a placeholder (ussd function).
export const isPlaceholderEmail = (email: string) => email.endsWith('.invalid');

export function buildReceipt(g: ReceiptGift): { subject: string; text: string } {
  const lines = [
    g.test_mode ? 'TEST RECEIPT — no real money moved.\n' : '',
    `Receipt no. ${g.receipt_number}`,
    `Date: ${day(g.created_at)}`,
    '',
    `Thank you${g.donor_name ? `, ${g.donor_name}` : ''}. Your gift to ${g.church_name} has been received.`,
    '',
    `Burden: ${g.campaign_title}`,
    `Gift: ${money(g.amount_minor, 'USD')}`,
    g.fee_minor > 0 ? `Fee you covered: ${money(g.fee_minor, 'USD')}` : 'Fee: not covered',
    `Total: ${money(g.total_minor, 'USD')}`,
    g.charge_currency !== 'USD'
      ? `Charged: ${money(g.charge_amount_minor, g.charge_currency)} at 1 USD = ${g.fx_rate} ${g.charge_currency} (no BURDEN margin)`
      : '',
    `Paid with: ${g.payment_method === 'mobile_money' ? 'mobile money' : g.payment_method ?? g.provider}`,
    g.recurring ? 'This is a monthly gift. You can stop it any time from the gift page.' : '',
    g.anonymous ? 'You gave anonymously: the church and other givers do not see your name.' : '',
    g.gift_aid ? 'Gift Aid: you declared this gift as a UK taxpayer. Thank you.' : '',
    '',
    'No goods or services were provided in exchange for this gift.',
    'You can ask for a full refund within 7 days of giving, from the gift page.',
    '',
    `${BURDEN_LEGAL_NAME} — gift reference ${g.id}`,
  ];
  return {
    subject: `${g.test_mode ? '[TEST] ' : ''}Your gift to ${g.church_name} — receipt ${g.receipt_number}`,
    text: lines.filter((l, i) => l !== '' || lines[i - 1] !== '').join('\n').trim(),
  };
}

// One SMS for a USSD giver (160 characters where possible).
export function smsReceiptText(g: Pick<ReceiptGift, 'receipt_number' | 'charge_amount_minor' | 'charge_currency' | 'church_name' | 'test_mode'>): string {
  const amount = `${g.charge_currency} ${(g.charge_amount_minor / 100).toFixed(2)}`;
  return `${g.test_mode ? 'TEST: ' : ''}BURDEN: your gift of ${amount} to ${g.church_name} is received. Receipt ${g.receipt_number}. Full refund within 7 days: contact BURDEN with this receipt number.`;
}

// ── Refunds ─────────────────────────────────────────────────────────────

export const REFUND_DAYS = 7;

export function refundBlocker(g: { status: string; created_at: string }, now = new Date()): string | null {
  if (g.status === 'refunded') return 'This gift has already been refunded.';
  if (!['held', 'paid_out'].includes(g.status)) {
    return g.status === 'church_confirmed'
      ? 'The church has already confirmed and used this gift. Please contact BURDEN.'
      : 'Only a completed gift can be refunded.';
  }
  const ageDays = (now.getTime() - new Date(g.created_at).getTime()) / 86_400_000;
  if (ageDays > REFUND_DAYS) return `Refunds are available for ${REFUND_DAYS} days after giving. Please contact BURDEN.`;
  return null;
}

// ── Gift Aid (UK) ───────────────────────────────────────────────────────

// HMRC's model declaration wording for a single donation.
export const GIFT_AID_WORDING =
  'I want to Gift Aid this donation. I am a UK taxpayer and understand that if I pay less Income Tax and/or ' +
  'Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year it is my ' +
  'responsibility to pay any difference.';

const UK_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/i;

export type GiftAidInput = { first_name: string; last_name: string; house: string; postcode: string; title?: string };

export function parseGiftAid(b: unknown): { ok: true; value: GiftAidInput } | { ok: false; error: string } {
  const d = (b ?? {}) as Record<string, unknown>;
  const s = (v: unknown, max: number) => (typeof v === 'string' && v.trim() && v.trim().length <= max ? v.trim() : null);
  const first = s(d.firstName, 35), last = s(d.lastName, 35), house = s(d.house, 40);
  const pc = typeof d.postcode === 'string' ? d.postcode.trim().toUpperCase().match(UK_POSTCODE) : null;
  if (!first || !last) return { ok: false, error: 'Gift Aid needs your first and last name.' };
  if (!house) return { ok: false, error: 'Gift Aid needs the first line of your home address.' };
  if (!pc) return { ok: false, error: 'Gift Aid needs a UK postcode, e.g. SE15 4QF.' };
  return { ok: true, value: { first_name: first, last_name: last, house, postcode: `${pc[1]} ${pc[2]}`, title: s(d.title, 4) ?? undefined } };
}

// One row of HMRC's Charities Online schedule (Gift Aid donations). HMRC
// claims are made on the sterling amount received, so only GBP gifts are
// exported; others are listed as needing a GBP charge.
export function hmrcRow(
  d: GiftAidInput & { declared_at: string },
  g: { charge_currency: string; amount_minor: number; fx_rate: number },
): string[] | null {
  if (g.charge_currency !== 'GBP') return null;
  const dt = new Date(d.declared_at);
  const date = `${String(dt.getUTCDate()).padStart(2, '0')}/${String(dt.getUTCMonth() + 1).padStart(2, '0')}/${String(dt.getUTCFullYear()).slice(2)}`;
  const gbp = (Math.round(g.amount_minor * Number(g.fx_rate)) / 100).toFixed(2);
  return [d.title ?? '', d.first_name, d.last_name, d.house, d.postcode, '', '', date, gbp];
}
export const HMRC_HEADER = ['Title', 'First name', 'Last name', 'House name or number', 'Postcode',
  'Aggregated donations', 'Sponsored event', 'Donation date', 'Amount'];

export const csv = (rows: string[][]) =>
  rows.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n');

// ── Exchange rates ──────────────────────────────────────────────────────

export const FX_MAX_AGE_HOURS = 12;

// open.er-api.com / exchangerate-api shape: { result: "success", rates: { GHS: 15.2, … } }
export function pickRate(json: unknown, currency: string): number | null {
  const j = json as { result?: string; rates?: Record<string, unknown> };
  if (j?.result && j.result !== 'success') return null;
  const r = Number(j?.rates?.[currency]);
  return Number.isFinite(r) && r > 0 ? r : null;
}

export const isFresh = (fetchedAt: string, now = new Date(), maxHours = FX_MAX_AGE_HOURS) =>
  now.getTime() - new Date(fetchedAt).getTime() <= maxHours * 3_600_000;
