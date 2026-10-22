// The three payment providers behind one shape:
//   createCheckout(gift, returnUrl) → hosted checkout page URL
//   verify(gift)                    → did the provider take the money?
//   parseWebhook(rawBody, headers)  → which gift does this event concern?
//
// All three use the provider's *hosted* checkout page, so card and
// mobile-money details never touch BURDEN (PCI SAQ-A, per blueprint §15),
// and the same flow works from the web app and from the native app's
// browser sheet. Plain fetch against each REST API — no SDKs.
//
// Charge amounts assume two-decimal currencies (USD, GBP, GHS, NGN, KES …).

import { hmacHex, timingSafeEqual } from './crypto.ts';
import type { Provider } from './gift-input.ts';

export type GiftRow = {
  id: string;
  provider: Provider;
  provider_ref: string | null;
  charge_currency: string;
  charge_amount_minor: number;
  donor_email: string;
  donor_name: string | null;
  church_name: string;
  campaign_title: string;
  // Monthly gifts: Stripe runs them as a subscription; Paystack keeps a
  // reusable authorisation (see plans.ts).
  recurring?: boolean;
};

export type Verification =
  | {
    outcome: 'paid'; providerRef: string; method: string | null;
    // For monthly gifts: a reusable Paystack card authorisation, or the
    // Stripe subscription that will charge the following months.
    reusableAuth?: string | null; subscription?: string | null;
  }
  | { outcome: 'failed'; reason: string }
  | { outcome: 'cancelled' }
  | { outcome: 'pending' };

export type Secrets = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  PAYSTACK_SECRET_KEY?: string;
  FLUTTERWAVE_SECRET_KEY?: string;
  FLUTTERWAVE_WEBHOOK_HASH?: string;
};

export class ProviderError extends Error {}

function need(value: string | undefined, name: string): string {
  if (!value) throw new ProviderError(`${name} is not set — this payment method is not configured yet.`);
  return value;
}

const PENDING: Verification = { outcome: 'pending' };

// ── Stripe ──────────────────────────────────────────────────────────────

function stripeForm(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

async function stripeFetch(secrets: Secrets, path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${need(secrets.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new ProviderError(`Stripe: ${json?.error?.message ?? res.status}`);
  return json;
}

function stripeVerification(gift: GiftRow, session: Record<string, any>): Verification {
  if (session.payment_status === 'paid') {
    if (session.amount_total !== gift.charge_amount_minor ||
        String(session.currency).toUpperCase() !== gift.charge_currency) {
      return { outcome: 'failed', reason: 'The amount charged did not match your gift. No funds were released.' };
    }
    return { outcome: 'paid', providerRef: session.id, method: null, subscription: session.subscription ?? null };
  }
  if (session.status === 'expired') return { outcome: 'cancelled' };
  return PENDING;
}

// Stripe-Signature: "t=1700000000,v1=<hex>[,v1=<hex>]"
export async function verifyStripeSignature(
  rawBody: string, header: string | null, secret: string, nowSeconds: number, toleranceSeconds = 300,
): Promise<boolean> {
  if (!header) return false;
  const parts = header.split(',').map((p) => p.split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || sigs.length === 0) return false;
  if (Math.abs(nowSeconds - Number(t)) > toleranceSeconds) return false;
  const expected = await hmacHex('SHA-256', secret, `${t}.${rawBody}`);
  return sigs.some((s) => timingSafeEqual(s, expected));
}

// ── Paystack ────────────────────────────────────────────────────────────

async function paystackFetch(secrets: Secrets, path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${need(secrets.PAYSTACK_SECRET_KEY, 'PAYSTACK_SECRET_KEY')}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json.status === false) throw new ProviderError(`Paystack: ${json?.message ?? res.status}`);
  return json;
}

// x-paystack-signature = HMAC-SHA512(secret key, raw body), hex.
export async function verifyPaystackSignature(rawBody: string, header: string | null, secretKey: string) {
  if (!header) return false;
  return timingSafeEqual(header, await hmacHex('SHA-512', secretKey, rawBody));
}

// ── Flutterwave ─────────────────────────────────────────────────────────

async function flutterwaveFetch(secrets: Secrets, path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.flutterwave.com/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${need(secrets.FLUTTERWAVE_SECRET_KEY, 'FLUTTERWAVE_SECRET_KEY')}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json.status === 'error') throw new ProviderError(`Flutterwave: ${json?.message ?? res.status}`);
  return json;
}

// ── The shared shape ────────────────────────────────────────────────────

export async function createCheckout(gift: GiftRow, returnUrl: string, secrets: Secrets) {
  const description = `${gift.campaign_title} — ${gift.church_name}`;

  if (gift.provider === 'stripe') {
    // A monthly gift is a Stripe subscription: Stripe charges each month and
    // tells us by webhook (invoice.paid), and the donor can stop it any time.
    const params: Record<string, string> = {
      mode: gift.recurring ? 'subscription' : 'payment',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': gift.charge_currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(gift.charge_amount_minor),
      'line_items[0][price_data][product_data][name]': `Gift to ${gift.church_name}`,
      'line_items[0][price_data][product_data][description]': gift.campaign_title,
      customer_email: gift.donor_email,
      client_reference_id: gift.id,
      'metadata[gift_id]': gift.id,
      success_url: returnUrl,
      cancel_url: `${returnUrl}&cancelled=1`,
    };
    if (gift.recurring) {
      params['line_items[0][price_data][recurring][interval]'] = 'month';
      params['subscription_data[metadata][gift_id]'] = gift.id;
    } else {
      params['payment_intent_data[metadata][gift_id]'] = gift.id;
    }
    const session = await stripeFetch(secrets, '/checkout/sessions', {
      method: 'POST',
      headers: { 'Idempotency-Key': `gift-${gift.id}` },
      body: stripeForm(params),
    });
    return { checkoutUrl: session.url as string, providerRef: session.id as string };
  }

  if (gift.provider === 'paystack') {
    const json = await paystackFetch(secrets, '/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email: gift.donor_email,
        amount: gift.charge_amount_minor,
        currency: gift.charge_currency,
        reference: gift.id,
        callback_url: returnUrl,
        metadata: { gift_id: gift.id, description, cancel_action: `${returnUrl}&cancelled=1` },
      }),
    });
    return { checkoutUrl: json.data.authorization_url as string, providerRef: gift.id };
  }

  const json = await flutterwaveFetch(secrets, '/payments', {
    method: 'POST',
    body: JSON.stringify({
      tx_ref: gift.id,
      amount: gift.charge_amount_minor / 100,
      currency: gift.charge_currency,
      redirect_url: returnUrl,
      customer: { email: gift.donor_email, name: gift.donor_name ?? 'Anonymous donor' },
      customizations: { title: 'BURDEN', description },
      meta: { gift_id: gift.id },
    }),
  });
  return { checkoutUrl: json.data.link as string, providerRef: gift.id };
}

export async function verify(gift: GiftRow, secrets: Secrets): Promise<Verification> {
  if (gift.provider === 'stripe') {
    if (!gift.provider_ref) return PENDING;
    const session = await stripeFetch(secrets, `/checkout/sessions/${encodeURIComponent(gift.provider_ref)}`);
    return stripeVerification(gift, session);
  }

  if (gift.provider === 'paystack') {
    let json;
    try {
      json = await paystackFetch(secrets, `/transaction/verify/${encodeURIComponent(gift.id)}`);
    } catch {
      return PENDING; // Paystack 404s until the donor has started paying.
    }
    const d = json.data;
    if (d.status === 'success') {
      if (d.amount !== gift.charge_amount_minor || d.currency !== gift.charge_currency) {
        return { outcome: 'failed', reason: 'The amount charged did not match your gift. No funds were released.' };
      }
      // A card marked reusable can be charged again next month (monthly gifts).
      const auth = d.authorization ?? {};
      const reusable = d.channel === 'card' && auth.reusable === true;
      return {
        outcome: 'paid', providerRef: String(d.id), method: d.channel ?? null,
        ...(reusable ? { reusableAuth: String(auth.authorization_code) } : {}),
      };
    }
    if (d.status === 'failed') return { outcome: 'failed', reason: declineCopy(d.gateway_response) };
    return PENDING; // abandoned / ongoing / pending
  }

  let json;
  try {
    json = await flutterwaveFetch(secrets, `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(gift.id)}`);
  } catch {
    return PENDING; // No transaction yet for this reference.
  }
  const d = json.data;
  if (d.status === 'successful') {
    if (Math.round(Number(d.amount) * 100) < gift.charge_amount_minor || d.currency !== gift.charge_currency) {
      return { outcome: 'failed', reason: 'The amount charged did not match your gift. No funds were released.' };
    }
    return { outcome: 'paid', providerRef: String(d.id), method: d.payment_type ?? null };
  }
  if (d.status === 'failed') return { outcome: 'failed', reason: declineCopy(d.processor_response) };
  return PENDING;
}

// Never show raw decline codes (blueprint §13 "Failed payment handling").
function declineCopy(raw: unknown): string {
  const r = String(raw ?? '').toLowerCase();
  if (r.includes('insufficient')) {
    return 'Your payment was declined for insufficient funds. Please try a different method.';
  }
  return 'Your payment was declined. Please try a different method or contact your bank.';
}

export type WebhookResult =
  | { valid: false }
  | {
    valid: true; giftId: string | null; stripeSession?: Record<string, any>; stripeType?: string;
    // A later month of a Stripe monthly gift (invoice.paid, subscription_cycle).
    stripeCycle?: { subscription: string; invoice: string; amountPaid: number; currency: string };
  };

export async function parseWebhook(
  provider: Provider, rawBody: string, headers: Headers, secrets: Secrets, nowSeconds: number,
): Promise<WebhookResult> {
  if (provider === 'stripe') {
    const ok = await verifyStripeSignature(
      rawBody, headers.get('stripe-signature'), need(secrets.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET'), nowSeconds,
    );
    if (!ok) return { valid: false };
    const event = JSON.parse(rawBody);
    const session = event.data?.object ?? {};
    if (event.type === 'invoice.paid' && session.billing_reason === 'subscription_cycle') {
      const sub = typeof session.subscription === 'string' ? session.subscription
        : session.parent?.subscription_details?.subscription ?? null;
      return {
        valid: true, giftId: null, stripeType: event.type,
        stripeCycle: sub ? {
          subscription: sub, invoice: String(session.id), amountPaid: Number(session.amount_paid),
          currency: String(session.currency).toUpperCase(),
        } : undefined,
      };
    }
    return {
      valid: true,
      giftId: session.metadata?.gift_id ?? session.client_reference_id ?? null,
      stripeSession: session,
      stripeType: event.type,
    };
  }

  if (provider === 'paystack') {
    const ok = await verifyPaystackSignature(
      rawBody, headers.get('x-paystack-signature'), need(secrets.PAYSTACK_SECRET_KEY, 'PAYSTACK_SECRET_KEY'),
    );
    if (!ok) return { valid: false };
    const event = JSON.parse(rawBody);
    return { valid: true, giftId: event.data?.reference ?? null };
  }

  const expected = need(secrets.FLUTTERWAVE_WEBHOOK_HASH, 'FLUTTERWAVE_WEBHOOK_HASH');
  if (!timingSafeEqual(headers.get('verif-hash') ?? '', expected)) return { valid: false };
  const event = JSON.parse(rawBody);
  return { valid: true, giftId: event.data?.tx_ref ?? null };
}

// Stripe webhooks carry the full session, so no extra API round-trip.
export function stripeWebhookVerification(gift: GiftRow, type: string, session: Record<string, any>): Verification {
  if (type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded') {
    return stripeVerification(gift, session);
  }
  if (type === 'checkout.session.async_payment_failed') {
    return { outcome: 'failed', reason: 'Your bank declined this payment. Please try a different method.' };
  }
  if (type === 'checkout.session.expired') return { outcome: 'cancelled' };
  return PENDING;
}

// ── Monthly gifts and payouts (see plans.ts, payouts.ts) ────────────────

// Charge a saved, reusable Paystack card for the next month of a plan.
export async function chargePaystackAuthorization(gift: GiftRow, authorizationCode: string, secrets: Secrets) {
  await paystackFetch(secrets, '/transaction/charge_authorization', {
    method: 'POST',
    body: JSON.stringify({
      authorization_code: authorizationCode,
      email: gift.donor_email,
      amount: gift.charge_amount_minor,
      currency: gift.charge_currency,
      reference: gift.id,
      metadata: { gift_id: gift.id },
    }),
  });
}

export async function cancelStripeSubscription(subscription: string, secrets: Secrets) {
  await stripeFetch(secrets, `/subscriptions/${encodeURIComponent(subscription)}`, { method: 'DELETE' });
}

// Paystack transfer recipients: type mobile_money (bank_code = the network's
// code from the same bank list as MoMo charges) or ghipss for Ghana banks.
export async function createPaystackRecipient(
  secrets: Secrets,
  r: { type: 'mobile_money' | 'ghipss'; name: string; accountNumber: string; bankCode: string; currency: string },
): Promise<string> {
  const json = await paystackFetch(secrets, '/transferrecipient', {
    method: 'POST',
    body: JSON.stringify({
      type: r.type, name: r.name, account_number: r.accountNumber, bank_code: r.bankCode, currency: r.currency,
    }),
  });
  return String(json.data.recipient_code);
}

export async function paystackTransfer(
  secrets: Secrets,
  t: { amountMinor: number; currency: string; recipient: string; reference: string; reason: string },
): Promise<{ status: string; transferCode: string }> {
  const json = await paystackFetch(secrets, '/transfer', {
    method: 'POST',
    body: JSON.stringify({
      source: 'balance', amount: t.amountMinor, currency: t.currency, recipient: t.recipient,
      reference: t.reference, reason: t.reason,
    }),
  });
  return { status: String(json.data.status), transferCode: String(json.data.transfer_code) };
}
