// Talks to the BURDEN payment server (Supabase edge functions in
// ../../../supabase/functions). Mirrors burden-app/src/lib/payments.js.
// Without EXPO_PUBLIC_SUPABASE_URL the app stays on the demo checkout.

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const liveCheckout = Boolean(SUPABASE_URL);

// The server sends the donor back here after checkout (see App.tsx linking).
export const RETURN_URL = 'burden://gift';

export const PAYMENT_METHODS = [
  {
    id: 'stripe',
    label: 'Card, Apple Pay or Google Pay',
    detail: 'Processed by Stripe. Best for UK, US and European cards.',
  },
  {
    id: 'paystack',
    label: 'Mobile money or card — Ghana & Nigeria',
    detail: 'Processed by Paystack. MTN MoMo, Telecel Cash, AirtelTigo, bank and local cards.',
  },
  {
    id: 'flutterwave',
    label: 'Mobile money, M-Pesa or card — across Africa',
    detail: 'Processed by Flutterwave. M-Pesa, MoMo, bank transfer and cards.',
  },
] as const;

export type ProviderId = (typeof PAYMENT_METHODS)[number]['id'];

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ANON_KEY) {
    headers.apikey = ANON_KEY;
    headers.Authorization = `Bearer ${ANON_KEY}`;
  }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
  return body as T;
}

export function startCheckout(payload: Record<string, unknown>) {
  return call<{
    giftId: string; token: string; checkoutUrl: string; testMode: boolean; planId?: string; planToken?: string;
  }>('create-gift', {
    method: 'POST',
    body: JSON.stringify({ ...payload, returnUrl: RETURN_URL }),
  });
}

// Approve on your phone (mobile money in Ghana) — the network sends the donor
// a prompt and they approve with their PIN on the phone; BURDEN never sees it.
export type MomoStart = {
  giftId: string; token: string; testMode: boolean; planId?: string; planToken?: string;
  state: 'approve' | 'otp' | 'paid' | 'failed'; message?: string;
};
export function startMomoCharge(payload: Record<string, unknown>) {
  return call<MomoStart>('momo-charge', { method: 'POST', body: JSON.stringify({ ...payload, returnUrl: RETURN_URL }) });
}

// Some networks (Telecel vouchers) send a code first.
export function submitMomoOtp(id: string, token: string, otp: string) {
  return call<{ state: string; message?: string }>('momo-otp', {
    method: 'POST', body: JSON.stringify({ gift: id, t: token, otp }),
  });
}

// Stop a monthly gift with the plan token from the first gift.
export function cancelMonthlyGift(planId: string, planToken: string) {
  return call<{ ok: true }>('cancel-recurring', { method: 'POST', body: JSON.stringify({ plan: planId, t: planToken }) });
}

// Ghana numbers: 024 123 4567, +233 24 123 4567 → 0241234567 (as the server does).
export function normaliseGhanaPhone(raw: string): string | null {
  let d = raw.replace(/[\s\-().]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('233')) d = '0' + d.slice(3);
  return /^0[25]\d{8}$/.test(d) ? d : null;
}

export const MOMO_NETWORKS = [
  { id: 'mtn', label: 'MTN MoMo' },
  { id: 'telecel', label: 'Telecel Cash' },
  { id: 'airteltigo', label: 'AirtelTigo Money' },
] as const;
export type MomoNetworkId = (typeof MOMO_NETWORKS)[number]['id'];

// The USSD short code, once BURDEN rents one (e.g. "*713*55#"). Unset: not shown.
export const USSD_CODE = process.env.EXPO_PUBLIC_BURDEN_USSD_CODE ?? '';

// The 7-day refund.
export function requestRefund(id: string, token: string) {
  return call<{ ok: true }>('request-refund', { method: 'POST', body: JSON.stringify({ gift: id, t: token }) });
}

// Updates the church posted from its dashboard (public feed).
export function fetchBurdenUpdates(campaignId: string) {
  return call<{ updates: { date: string; author: string; role: string; title: string; body: string }[] }>(
    `burden-updates?campaign=${encodeURIComponent(campaignId)}`, { method: 'GET' },
  );
}

// Approved words of support for one burden (the review queue's public end).
export function fetchSupportWords(campaignId: string) {
  return call<{ words: { name: string; message: string; date: string }[] }>(
    `support-messages?campaign=${encodeURIComponent(campaignId)}`, { method: 'GET' },
  );
}

export function fetchGiftStatus(id: string, token: string) {
  return call<{
    gift: Record<string, any>;
    events: { step: string; occurred_at: string; note: string | null }[];
    plan?: { status: string; note?: string | null; method?: string | null; nextChargeAt?: string | null } | null;
    supportStatus?: string | null;
  }>(
    `gift-status?gift=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`,
    { method: 'GET' },
  );
}
