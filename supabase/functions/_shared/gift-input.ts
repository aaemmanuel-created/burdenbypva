// Validates a create-gift request and works out what to charge.
// The server never trusts the client's fee or total — it recomputes them
// with the same formula the Give screen shows (4.5% + $0.30, donor-covered).

export type Provider = 'stripe' | 'paystack' | 'flutterwave';
export const PROVIDERS: Provider[] = ['stripe', 'paystack', 'flutterwave'];

export const MIN_GIFT_MINOR = 100;        // $1
export const MAX_GIFT_MINOR = 1_000_000;  // $10,000 — enhanced KYC above this (not built)

export function feeMinor(amountMinor: number): number {
  return Math.round(amountMinor * 0.045 + 30);
}

export type ChargeConfig = {
  // Currency each provider charges in, and the USD → that-currency rate.
  // Test mode uses fixed rates from env; live mode needs a real FX source.
  currency: Record<Provider, string>;
  usdRate: Record<Provider, number>;
};

export type GiftInput = {
  campaign_id: string;
  campaign_title: string;
  church_id: string;
  church_name: string;
  currency: 'USD';
  amount_minor: number;
  fee_minor: number;
  total_minor: number;
  charge_currency: string;
  charge_amount_minor: number;
  fx_rate: number;
  recurring: boolean;
  anonymous: boolean;
  donor_name: string | null;
  donor_email: string;
  provider: Provider;
  return_url: string;
  // Words of support, checked before anyone else sees them (moderation-logic.ts).
  message: string | null;
};

type Result = { ok: true; value: GiftInput } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(v: unknown, max = 200): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 && t.length <= max ? t : null;
}

export function isAllowedReturnUrl(url: string, allowedPrefixes: string[]): boolean {
  return allowedPrefixes.some((p) => p.length > 0 && url.startsWith(p));
}

export function parseGiftInput(body: unknown, charge: ChargeConfig, allowedReturnPrefixes: string[]): Result {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Request body must be JSON.' };
  const b = body as Record<string, unknown>;

  const provider = b.provider as Provider;
  if (!PROVIDERS.includes(provider)) return { ok: false, error: 'Choose a payment method.' };

  const amount = Number(b.amount);
  if (!Number.isFinite(amount)) return { ok: false, error: 'Enter an amount.' };
  const amountMinor = Math.round(amount * 100);
  if (amountMinor < MIN_GIFT_MINOR) return { ok: false, error: 'The minimum gift is $1.' };
  if (amountMinor > MAX_GIFT_MINOR) {
    return { ok: false, error: 'Gifts above $10,000 need extra checks. Please contact the BURDEN team.' };
  }

  const campaignId = text(b.campaignId, 80);
  const campaignTitle = text(b.campaignTitle);
  const churchId = text(b.churchId, 80);
  const churchName = text(b.churchName);
  if (!campaignId || !campaignTitle || !churchId || !churchName) {
    return { ok: false, error: 'Missing campaign details.' };
  }

  const email = text(b.email, 254);
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: 'Enter a valid email for your receipt.' };

  const anonymous = b.anonymous === true;
  const name = text(b.name, 120);
  if (!anonymous && !name) return { ok: false, error: 'Enter your name, or choose to give anonymously.' };

  const returnUrl = text(b.returnUrl, 500);
  if (!returnUrl || !isAllowedReturnUrl(returnUrl, allowedReturnPrefixes)) {
    return { ok: false, error: 'This app is not allowed to start a checkout.' };
  }

  const fee = b.coverFee === false ? 0 : feeMinor(amountMinor);
  const total = amountMinor + fee;
  const rate = charge.usdRate[provider];
  const chargeCurrency = charge.currency[provider];
  if (!(rate > 0) || !chargeCurrency) return { ok: false, error: 'This payment method is not set up yet.' };

  return {
    ok: true,
    value: {
      campaign_id: campaignId,
      campaign_title: campaignTitle,
      church_id: churchId,
      church_name: churchName,
      currency: 'USD',
      amount_minor: amountMinor,
      fee_minor: fee,
      total_minor: total,
      charge_currency: chargeCurrency,
      charge_amount_minor: Math.round(total * rate),
      fx_rate: rate,
      recurring: b.recurring === true,
      anonymous,
      // Kept privately even for anonymous gifts (receipts, sanctions screening);
      // anonymity hides it from the church and other givers.
      donor_name: name,
      donor_email: email,
      provider,
      return_url: returnUrl,
      message: text(b.message, 280),
    },
  };
}
