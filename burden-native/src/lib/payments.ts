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
  return call<{ giftId: string; token: string; checkoutUrl: string; testMode: boolean }>('create-gift', {
    method: 'POST',
    body: JSON.stringify({ ...payload, returnUrl: RETURN_URL }),
  });
}

export function fetchGiftStatus(id: string, token: string) {
  return call<{ gift: Record<string, any>; events: { step: string; occurred_at: string; note: string | null }[] }>(
    `gift-status?gift=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`,
    { method: 'GET' },
  );
}
