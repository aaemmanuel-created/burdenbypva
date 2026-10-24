// Mobile money without leaving BURDEN — "approve on your phone", as MTN
// MoMo's Collections request-to-pay and expressPay's Merchant Direct API work
// (studied with REA, 2026-10-22). The donor types their number; the network
// sends a prompt to their phone; they approve with their PIN *on the phone*.
// BURDEN never sees the PIN. Runs on Paystack's Charge API (/charge with
// mobile_money), which reaches MTN, Telecel and AirtelTigo in Ghana.
//
// A prompt can be approved seconds or minutes later, so the gift stays
// "initiated" until Paystack's webhook (or gift-status's own check) sees the
// payment — the same path a hosted-checkout gift takes.

import { ProviderError, type GiftRow, type Secrets } from './providers.ts';

export type MomoNetwork = 'mtn' | 'telecel' | 'airteltigo';
export const MOMO_NETWORKS: MomoNetwork[] = ['mtn', 'telecel', 'airteltigo'];

// What the Give screen shows next.
export type MomoState =
  | { state: 'approve'; message: string }   // prompt sent — approve on the phone
  | { state: 'otp'; message: string }       // network wants a code first (e.g. Telecel voucher)
  | { state: 'paid' }                       // already went through
  | { state: 'failed'; message: string };

// Ghana numbers: 024 123 4567, +233 24 123 4567, 233241234567 → 0241234567.
export function normaliseGhanaPhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let digits = raw.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('233')) digits = '0' + digits.slice(3);
  return /^0[25]\d{8}$/.test(digits) ? digits : null; // mobile ranges are 02x and 05x
}

// Paystack's network codes come from its own bank list
// (GET /bank?currency=GHS&type=mobile_money), so match on the name rather
// than hard-coding codes that could change.
const NAME_MATCH: Record<MomoNetwork, RegExp> = {
  mtn: /\bmtn\b/i,
  telecel: /telecel|vodafone/i,
  airteltigo: /airtel|tigo/i,
};

export function matchMomoCode(banks: { name: string; code: string }[], network: MomoNetwork): string | null {
  return banks.find((b) => NAME_MATCH[network].test(b.name))?.code ?? null;
}

async function paystack(secrets: Secrets, path: string, init: RequestInit = {}) {
  if (!secrets.PAYSTACK_SECRET_KEY) {
    throw new ProviderError('PAYSTACK_SECRET_KEY is not set — this payment method is not configured yet.');
  }
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secrets.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json.status === false) throw new ProviderError(`Paystack: ${json?.message ?? res.status}`);
  return json;
}

export async function momoCode(network: MomoNetwork, currency: string, secrets: Secrets): Promise<string> {
  const json = await paystack(secrets, `/bank?currency=${encodeURIComponent(currency)}&type=mobile_money`);
  const code = matchMomoCode(json.data ?? [], network);
  if (!code) throw new ProviderError('That mobile money network is not available right now.');
  return code;
}

// Paystack's charge statuses → what the donor sees. display_text is
// Paystack's own instruction (e.g. "Please complete authorization process
// on your mobile phone"); we keep our plain wording and add theirs.
export function momoStateFrom(data: Record<string, any>): MomoState {
  const status = String(data?.status ?? '');
  const extra = typeof data?.display_text === 'string' ? data.display_text : '';
  if (status === 'success') return { state: 'paid' };
  if (status === 'send_otp') {
    return { state: 'otp', message: extra || 'Enter the code your network sent you to finish this gift.' };
  }
  if (status === 'failed') {
    return { state: 'failed', message: 'Your network declined this payment. Please check your balance or try another method.' };
  }
  // pay_offline, pending, ongoing — the prompt is on its way.
  return { state: 'approve', message: extra || 'Approve the prompt on your phone with your mobile money PIN.' };
}

export async function chargeMomo(
  gift: GiftRow, phone: string, network: MomoNetwork, secrets: Secrets,
): Promise<MomoState> {
  const provider = await momoCode(network, gift.charge_currency, secrets);
  const json = await paystack(secrets, '/charge', {
    method: 'POST',
    body: JSON.stringify({
      email: gift.donor_email,
      amount: gift.charge_amount_minor,
      currency: gift.charge_currency,
      reference: gift.id,
      mobile_money: { phone, provider },
      metadata: { gift_id: gift.id, description: `${gift.campaign_title} — ${gift.church_name}` },
    }),
  });
  return momoStateFrom(json.data);
}

export async function submitMomoOtp(gift: GiftRow, otp: string, secrets: Secrets): Promise<MomoState> {
  const json = await paystack(secrets, '/charge/submit_otp', {
    method: 'POST',
    body: JSON.stringify({ otp, reference: gift.id }),
  });
  return momoStateFrom(json.data);
}
