// Pure rules for paying a church after the hold (no database, no network),
// so they can be unit-tested in Node. As MoMo's Disbursements API and
// expressPay's bulk payments (REA, 2026-10-22): the church can receive into a
// verified MoMo wallet as well as a bank account.

export type PayoutAccount = {
  method: 'momo' | 'bank';
  network: string | null;
  account_number: string;
  currency: string;
  paystack_recipient: string | null;
  verified_at: string | null;
};

export type PayoutGift = {
  provider: string;
  amount_minor: number;   // the gift itself, USD cents
  fx_rate: number;        // USD → charge currency
  charge_currency: string;
  test_mode: boolean;
  screening?: string; // sanctions screening: only 'clear' gifts are paid out
};

// The church receives the gift itself; the covered fee pays processing and
// BURDEN's platform fee, as "Where every dollar goes" says.
export function payoutAmountMinor(g: PayoutGift): number {
  return Math.round(g.amount_minor * Number(g.fx_rate));
}

// Why a gift can't be sent automatically yet — or null when it can.
export function payoutBlocker(g: PayoutGift, a: PayoutAccount | null): string | null {
  if (g.test_mode) return 'test gift';
  if (g.screening && g.screening !== 'clear') return 'giver is waiting for a sanctions review';
  if (!a || !a.verified_at) return 'church has no verified payout account';
  if (!a.paystack_recipient) return 'payout account is not registered with Paystack';
  // Paystack pays out from its own balance, in the currency it collected.
  if (g.provider !== 'paystack') return `${g.provider} gifts are paid out from that provider's dashboard`;
  if (g.charge_currency !== a.currency) return `gift was charged in ${g.charge_currency}, account takes ${a.currency}`;
  return null;
}

export function payoutLabel(a: Pick<PayoutAccount, 'method' | 'network' | 'account_number'>): string {
  const last4 = a.account_number.slice(-4);
  return a.method === 'momo'
    ? `${(a.network ?? '').toUpperCase()} MoMo wallet ending ${last4}`
    : `${a.network ?? 'bank'} account ending ${last4}`;
}
