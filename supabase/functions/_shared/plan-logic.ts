// Pure rules for monthly gifts (no database, no network) so they can be
// unit-tested in Node. The Deno side is plans.ts.
//
// How each month after the first is paid — the "tokenisation" and
// "automated debit with consent" ideas from expressPay and MTN MoMo (REA):
//   • Stripe card      → a Stripe subscription; Stripe charges monthly itself.
//   • Paystack card    → the reusable authorisation from the first payment.
//   • Mobile money     → a fresh approve-on-your-phone prompt each month. The
//                        donor approves every month with their PIN, so
//                        nothing is ever taken without them.
//   • Flutterwave      → not yet; only the first gift is charged.

import type { Verification } from './providers.ts';
import type { MomoNetwork } from './momo.ts';

export type PlanRoute =
  | { ok: true; method: 'subscription'; stripe_subscription: string }
  | { ok: true; method: 'card'; paystack_auth_code: string }
  | { ok: true; method: 'momo'; momo_phone: string; momo_network: MomoNetwork }
  | { ok: false; note: string };

export function planRouteFor(
  provider: string,
  v: Extract<Verification, { outcome: 'paid' }>,
  momo: { phone: string | null; network: MomoNetwork | null },
): PlanRoute {
  if (provider === 'stripe' && v.subscription) {
    return { ok: true, method: 'subscription', stripe_subscription: v.subscription };
  }
  if (provider === 'paystack' && momo.phone && momo.network) {
    return { ok: true, method: 'momo', momo_phone: momo.phone, momo_network: momo.network };
  }
  if (provider === 'paystack' && v.reusableAuth) {
    return { ok: true, method: 'card', paystack_auth_code: v.reusableAuth };
  }
  if (provider === 'flutterwave') {
    return { ok: false, note: 'Monthly repeats are not available through Flutterwave yet. Only this first gift was charged.' };
  }
  return {
    ok: false,
    note: 'This payment method cannot be charged again automatically. Only this first gift was charged.',
  };
}

// Same day next month; the 31st becomes the last day of a shorter month.
export function nextMonth(from: Date): Date {
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(from.getUTCDate(), lastDay),
    from.getUTCHours(), from.getUTCMinutes(), from.getUTCSeconds()));
}

// After three failed months in a row the plan stops, and says why.
export const MAX_FAILURES = 3;
