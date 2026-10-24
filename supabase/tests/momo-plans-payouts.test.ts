// Unit tests for approve-on-your-phone MoMo, monthly gifts, church payouts
// and USSD giving (2026-10-22). Run from the repo root:
//   node --test 'supabase/tests/*.test.ts'

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import {
  chargeMomo, matchMomoCode, momoStateFrom, normaliseGhanaPhone, submitMomoOtp,
} from '../functions/_shared/momo.ts';
import { MAX_FAILURES, nextMonth, planRouteFor } from '../functions/_shared/plan-logic.ts';
import { payoutAmountMinor, payoutBlocker, payoutLabel } from '../functions/_shared/payout-logic.ts';
import { minGhs, networkFromCode, ussdStep } from '../functions/_shared/ussd-logic.ts';
import { BURDENS } from '../functions/_shared/burdens.ts';
import { createCheckout, parseWebhook, verify, type GiftRow } from '../functions/_shared/providers.ts';

const gift: GiftRow = {
  id: '22222222-2222-2222-2222-222222222222', provider: 'paystack', provider_ref: null,
  charge_currency: 'GHS', charge_amount_minor: 39645, donor_email: 'ama@example.com', donor_name: 'Ama',
  church_name: "St. Andrew's", campaign_title: 'Osu Bursary',
};
const s = { PAYSTACK_SECRET_KEY: 'sk_test_x', STRIPE_SECRET_KEY: 'sk_test_y', STRIPE_WEBHOOK_SECRET: 'whsec_z' };
const BANKS = [
  { name: 'MTN', code: 'MTN' },
  { name: 'Vodafone (Telecel)', code: 'VOD' },
  { name: 'AirtelTigo', code: 'ATL' },
];

// Records every request so tests can check what was sent to Paystack.
function mockFetchSeq(...payloads: unknown[]) {
  const calls: { url: string; body: any }[] = [];
  let i = 0;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : null });
    const payload = payloads[Math.min(i++, payloads.length - 1)];
    return { ok: true, status: 200, json: async () => payload };
  }) as typeof fetch;
  return calls;
}

// ── Mobile money ────────────────────────────────────────────────────────

test('Ghana numbers are normalised; landlines and junk are refused', () => {
  assert.equal(normaliseGhanaPhone('024 123 4567'), '0241234567');
  assert.equal(normaliseGhanaPhone('+233 24 123 4567'), '0241234567');
  assert.equal(normaliseGhanaPhone('233201234567'), '0201234567');
  assert.equal(normaliseGhanaPhone('(055) 123-4567'), '0551234567');
  assert.equal(normaliseGhanaPhone('0302123456'), null); // Accra landline
  assert.equal(normaliseGhanaPhone('12345'), null);
  assert.equal(normaliseGhanaPhone(undefined), null);
});

test("network codes come from Paystack's own list, matched by name", () => {
  assert.equal(matchMomoCode(BANKS, 'mtn'), 'MTN');
  assert.equal(matchMomoCode(BANKS, 'telecel'), 'VOD');
  assert.equal(matchMomoCode(BANKS, 'airteltigo'), 'ATL');
  assert.equal(matchMomoCode([{ name: 'MTN', code: 'MTN' }], 'telecel'), null);
});

test('charge statuses become plain next steps', () => {
  assert.equal(momoStateFrom({ status: 'pay_offline' }).state, 'approve');
  assert.equal(momoStateFrom({ status: 'pending' }).state, 'approve');
  assert.equal(momoStateFrom({ status: 'send_otp', display_text: 'Enter voucher' }).state, 'otp');
  assert.equal(momoStateFrom({ status: 'success' }).state, 'paid');
  assert.equal(momoStateFrom({ status: 'failed' }).state, 'failed');
  const s1 = momoStateFrom({ status: 'pay_offline', display_text: 'Please complete authorization on your phone' });
  assert.equal((s1 as { message: string }).message, 'Please complete authorization on your phone');
});

test('chargeMomo looks up the network, then asks Paystack to send the prompt', async () => {
  const calls = mockFetchSeq(
    { status: true, data: BANKS },
    { status: true, data: { status: 'pay_offline', display_text: 'Approve on your phone' } },
  );
  const next = await chargeMomo(gift, '0241234567', 'mtn', s);
  assert.equal(next.state, 'approve');
  assert.match(calls[0].url, /\/bank\?currency=GHS&type=mobile_money$/);
  assert.match(calls[1].url, /\/charge$/);
  assert.deepEqual(calls[1].body.mobile_money, { phone: '0241234567', provider: 'MTN' });
  assert.equal(calls[1].body.reference, gift.id);
  assert.equal(calls[1].body.amount, 39645);
  assert.equal(calls[1].body.currency, 'GHS');
});

test('OTP goes to submit_otp with the gift as reference', async () => {
  const calls = mockFetchSeq({ status: true, data: { status: 'pay_offline' } });
  assert.equal((await submitMomoOtp(gift, '123456', s)).state, 'approve');
  assert.match(calls[0].url, /\/charge\/submit_otp$/);
  assert.deepEqual(calls[0].body, { otp: '123456', reference: gift.id });
});

test('unconfigured Paystack says so', async () => {
  await assert.rejects(chargeMomo(gift, '0241234567', 'mtn', {}), /PAYSTACK_SECRET_KEY is not set/);
});

// ── Monthly gifts ───────────────────────────────────────────────────────

const paid = { outcome: 'paid' as const, providerRef: 'x', method: 'card' };

test('each provider gets the right monthly route', () => {
  assert.deepEqual(planRouteFor('stripe', { ...paid, subscription: 'sub_1' }, { phone: null, network: null }),
    { ok: true, method: 'subscription', stripe_subscription: 'sub_1' });
  assert.deepEqual(planRouteFor('paystack', { ...paid, reusableAuth: 'AUTH_1' }, { phone: null, network: null }),
    { ok: true, method: 'card', paystack_auth_code: 'AUTH_1' });
  // Mobile money wins over a card authorisation: a fresh prompt each month.
  assert.deepEqual(planRouteFor('paystack', paid, { phone: '0241234567', network: 'mtn' }),
    { ok: true, method: 'momo', momo_phone: '0241234567', momo_network: 'mtn' });
  assert.equal(planRouteFor('flutterwave', paid, { phone: null, network: null }).ok, false);
  assert.equal(planRouteFor('paystack', paid, { phone: null, network: null }).ok, false);
});

test('next month keeps the day, clamping the 31st', () => {
  assert.equal(nextMonth(new Date('2026-10-22T09:00:00Z')).toISOString(), '2026-11-22T09:00:00.000Z');
  assert.equal(nextMonth(new Date('2027-01-31T09:00:00Z')).toISOString(), '2027-02-28T09:00:00.000Z');
  assert.equal(nextMonth(new Date('2026-12-15T00:00:00Z')).toISOString(), '2027-01-15T00:00:00.000Z');
  assert.equal(MAX_FAILURES, 3);
});

test('a monthly Stripe gift opens a subscription checkout', async () => {
  let sent = '';
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    sent = String(init?.body);
    return { ok: true, status: 200, json: async () => ({ id: 'cs_1', url: 'https://checkout' }) };
  }) as typeof fetch;
  await createCheckout({ ...gift, provider: 'stripe', charge_currency: 'USD', recurring: true }, 'http://localhost/r?x=1', s);
  const params = new URLSearchParams(sent);
  assert.equal(params.get('mode'), 'subscription');
  assert.equal(params.get('line_items[0][price_data][recurring][interval]'), 'month');
  assert.equal(params.get('subscription_data[metadata][gift_id]'), gift.id);
  assert.equal(params.get('payment_intent_data[metadata][gift_id]'), null);

  await createCheckout({ ...gift, provider: 'stripe', charge_currency: 'USD' }, 'http://localhost/r?x=1', s);
  assert.equal(new URLSearchParams(sent).get('mode'), 'payment');
});

test('Paystack verify keeps a reusable card authorisation, never a MoMo one', async () => {
  const base = { status: 'success', amount: 39645, currency: 'GHS', id: 7 };
  mockFetchSeq({ status: true, data: { ...base, channel: 'card', authorization: { reusable: true, authorization_code: 'AUTH_9' } } });
  assert.equal((await verify(gift, s) as { reusableAuth?: string }).reusableAuth, 'AUTH_9');
  mockFetchSeq({ status: true, data: { ...base, channel: 'mobile_money', authorization: { reusable: true, authorization_code: 'AUTH_M' } } });
  assert.equal((await verify(gift, s) as { reusableAuth?: string }).reusableAuth, undefined);
});

test("Stripe's later monthly charges arrive as invoice.paid cycles", async () => {
  const body = JSON.stringify({
    type: 'invoice.paid',
    data: { object: { id: 'in_1', billing_reason: 'subscription_cycle', subscription: 'sub_1', amount_paid: 2643, currency: 'usd' } },
  });
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac('sha256', s.STRIPE_WEBHOOK_SECRET).update(`${t}.${body}`).digest('hex');
  const r = await parseWebhook('stripe', body, new Headers({ 'stripe-signature': `t=${t},v1=${sig}` }), s, t);
  assert.ok(r.valid);
  assert.deepEqual(r.stripeCycle, { subscription: 'sub_1', invoice: 'in_1', amountPaid: 2643, currency: 'USD' });
});

// ── Church payouts ──────────────────────────────────────────────────────

const account = {
  method: 'momo' as const, network: 'mtn', account_number: '0241234567', currency: 'GHS',
  paystack_recipient: 'RCP_1', verified_at: '2026-10-22T00:00:00Z',
};
const liveGift = { provider: 'paystack', amount_minor: 2500, fx_rate: 15, charge_currency: 'GHS', test_mode: false };

test('the church receives the gift itself, in the collected currency', () => {
  assert.equal(payoutAmountMinor(liveGift), 37500); // $25 at 15 → GHS 375.00
  assert.equal(payoutLabel(account), 'MTN MoMo wallet ending 4567');
  assert.equal(payoutLabel({ method: 'bank', network: 'GCB Bank', account_number: '1234567890' }), 'GCB Bank account ending 7890');
});

test('payouts wait for a verified, registered, matching account', () => {
  assert.equal(payoutBlocker(liveGift, account), null);
  assert.equal(payoutBlocker({ ...liveGift, test_mode: true }, account), 'test gift');
  assert.match(payoutBlocker(liveGift, null)!, /no verified payout account/);
  assert.match(payoutBlocker(liveGift, { ...account, verified_at: null })!, /no verified payout account/);
  assert.match(payoutBlocker(liveGift, { ...account, paystack_recipient: null })!, /not registered/);
  assert.match(payoutBlocker({ ...liveGift, provider: 'stripe' }, account)!, /stripe gifts/);
  assert.match(payoutBlocker({ ...liveGift, charge_currency: 'NGN' }, account)!, /NGN/);
});

// ── USSD ────────────────────────────────────────────────────────────────

test('USSD menu: give, choose, amount, confirm', () => {
  const rate = 15;
  assert.match((ussdStep('', BURDENS, rate) as { text: string }).text, /1\. Give to a burden/);
  const list = ussdStep('1', BURDENS, rate);
  assert.equal(list.kind, 'con');
  assert.match((list as { text: string }).text, /1\. Osu Bursary Fund \(Accra\)/);
  assert.match((ussdStep('1*1', BURDENS, rate) as { text: string }).text, /min 15/);
  const confirm = ussdStep('1*1*50', BURDENS, rate);
  assert.equal(confirm.kind, 'con');
  assert.match((confirm as { text: string }).text, /GHS 50 to Osu Bursary Fund/);
  const done = ussdStep('1*1*50*1', BURDENS, rate);
  assert.equal(done.kind, 'charge');
  assert.equal((done as { ghs: number }).ghs, 50);
  assert.equal((done as { burden: { id: string } }).burden.id, 'cmp_andrew_bursary');
  assert.equal(ussdStep('1*1*50*2', BURDENS, rate).kind, 'end');
  assert.equal(ussdStep('1*1*5', BURDENS, rate).kind, 'end');    // under $1
  assert.equal(ussdStep('1*9', BURDENS, rate).kind, 'end');      // no such burden
  assert.equal(ussdStep('2', BURDENS, rate).kind, 'end');
  assert.equal(minGhs(15.2), 16);
});

test('USSD network codes map to MoMo networks', () => {
  assert.equal(networkFromCode('62001'), 'mtn');
  assert.equal(networkFromCode('62002'), 'telecel');
  assert.equal(networkFromCode('62006'), 'airteltigo');
  assert.equal(networkFromCode('99999'), null);
});
