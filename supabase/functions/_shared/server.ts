// Deno-side glue shared by every function: env, database, HTTP helpers,
// and the one place a provider's answer turns into a timeline step.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { ChargeConfig, GiftInput, Provider } from './gift-input.ts';
import { randomToken, sha256Hex, timingSafeEqual } from './crypto.ts';
import { type GiftRow, type Secrets, type Verification, verify } from './providers.ts';
import { activatePlan, createPlan } from './plans.ts';
import { reviewSupportMessage } from './support.ts';

const env = (name: string) => Deno.env.get(name) ?? undefined;

export const SUPABASE_URL = env('SUPABASE_URL')!;

export const db = createClient(SUPABASE_URL, env('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

export const secrets: Secrets = {
  STRIPE_SECRET_KEY: env('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: env('STRIPE_WEBHOOK_SECRET'),
  PAYSTACK_SECRET_KEY: env('PAYSTACK_SECRET_KEY'),
  FLUTTERWAVE_SECRET_KEY: env('FLUTTERWAVE_SECRET_KEY'),
  FLUTTERWAVE_WEBHOOK_HASH: env('FLUTTERWAVE_WEBHOOK_HASH'),
};

const SECRET_KEY: Record<Provider, string | undefined> = {
  stripe: secrets.STRIPE_SECRET_KEY,
  paystack: secrets.PAYSTACK_SECRET_KEY,
  flutterwave: secrets.FLUTTERWAVE_SECRET_KEY,
};

// Test keys: Stripe/Paystack "sk_test_…", Flutterwave "FLWSECK_TEST-…".
export function isTestKey(provider: Provider): boolean {
  const key = SECRET_KEY[provider] ?? '';
  return key.startsWith('sk_test_') || key.startsWith('FLWSECK_TEST');
}

// Safety gate: a live key does nothing until PAYMENTS_LIVE=true is set on
// purpose (after the legal entity, provider approval and payouts exist).
export const LIVE_ALLOWED = env('PAYMENTS_LIVE') === 'true';

export const HOLD_HOURS = Number(env('HOLD_HOURS') ?? 72);

export const charge: ChargeConfig = {
  currency: {
    stripe: 'USD',
    paystack: env('PAYSTACK_CURRENCY') ?? 'GHS',
    flutterwave: env('FLUTTERWAVE_CURRENCY') ?? 'USD',
  },
  usdRate: {
    stripe: 1,
    paystack: Number(env('PAYSTACK_USD_RATE') ?? 15),
    flutterwave: Number(env('FLUTTERWAVE_USD_RATE') ?? 1),
  },
};

export const ALLOWED_RETURN_PREFIXES = (env('ALLOWED_RETURN_URLS') ??
  'http://localhost:,https://aaemmanuel-created.github.io/,burden://')
  .split(',')
  .map((s) => s.trim());

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

export function preflight(req: Request): Response | null {
  return req.method === 'OPTIONS' ? new Response('ok', { headers: CORS }) : null;
}

export const functionUrl = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`;

export type FullGift = GiftRow & {
  status: string;
  status_note: string | null;
  access_token_hash: string;
  return_url: string;
  hold_until: string | null;
  test_mode: boolean;
  plan_id?: string | null;
  momo_phone?: string | null;
  momo_network?: string | null;
  [key: string]: unknown;
};

// Record a new gift (and, for a monthly gift, its plan). Shared by
// create-gift (hosted checkout) and momo-charge (approve on your phone).
export async function insertGift(input: GiftInput, testMode: boolean, extra: Record<string, unknown> = {}) {
  const token = randomToken();
  const { data: id, error } = await db.rpc('create_gift', {
    p_gift: { ...input, access_token_hash: await sha256Hex(token), test_mode: testMode },
  });
  if (error) throw error;
  if (Object.keys(extra).length) await db.from('gifts').update(extra).eq('id', id);
  if (input.message) {
    await db.from('support_messages').insert({
      gift_id: id, campaign_id: input.campaign_id, message: input.message,
      display_name: input.anonymous ? 'Anonymous' : (input.donor_name ?? 'Anonymous'),
    });
  }
  const plan = input.recurring ? await createPlan(input, id as string) : null;
  return { gift: (await loadGift(id as string))!, token, plan };
}

export async function loadGift(id: string): Promise<FullGift | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await db.from('gifts').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as FullGift | null;
}

export async function loadGiftWithToken(id: string | null, token: string | null): Promise<FullGift | null> {
  if (!id || !token) return null;
  const gift = await loadGift(id);
  if (!gift) return null;
  return timingSafeEqual(gift.access_token_hash, await sha256Hex(token)) ? gift : null;
}

async function transition(id: string, to: string, note: string | null, source: string, patch = {}) {
  const { data, error } = await db.rpc('transition_gift', {
    p_gift_id: id, p_to: to, p_note: note, p_source: source, p_patch: patch,
  });
  if (error) throw error;
  return data as boolean;
}

function money(minor: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(minor / 100);
}

// Turn a provider's answer into a timeline step. Safe to call repeatedly.
export async function applyVerification(gift: FullGift, v: Verification, source: string) {
  if (v.outcome === 'paid') {
    const holdUntil = new Date(Date.now() + HOLD_HOURS * 3600_000).toISOString();
    let note = `${money(gift.charge_amount_minor, gift.charge_currency)} charged`;
    if (gift.charge_currency !== 'USD') {
      note += ` at 1 USD = ${gift.fx_rate} ${gift.charge_currency}${gift.test_mode ? ' (test rate)' : ''}`;
    }
    if (gift.test_mode) note += ' · Test payment, no real money';
    const moved = await transition(gift.id, 'held', note + '.', source, {
      provider_ref: v.providerRef, payment_method: v.method, hold_until: holdUntil,
    });
    // The first gift of a monthly plan switches the plan on.
    if (moved && gift.plan_id) await activatePlan(gift, v);
    // Only givers' words are published, and only after the review queue.
    if (moved) await reviewSupportMessage(gift.id);
  } else if (v.outcome === 'failed') {
    await transition(gift.id, 'failed', v.reason, source);
  } else if (v.outcome === 'cancelled') {
    await transition(gift.id, 'cancelled', 'You left checkout before paying. Nothing was charged.', source);
  }
}

export async function verifyAndApply(gift: FullGift, source: string) {
  if (gift.status !== 'initiated') return;
  await applyVerification(gift, await verify(gift, secrets), source);
}

export function asProvider(value: string | null): Provider | null {
  return value === 'stripe' || value === 'paystack' || value === 'flutterwave' ? value : null;
}
