// Unit tests for the pure payment logic. Run from the repo root:
//   node --test 'supabase/tests/*.test.ts'
// (Node 22.6+ runs these .ts files directly.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import { feeMinor, parseGiftInput, type ChargeConfig } from '../functions/_shared/gift-input.ts';
import {
  verifyPaystackSignature, verifyStripeSignature, stripeWebhookVerification, verify, type GiftRow,
} from '../functions/_shared/providers.ts';
import { timingSafeEqual } from '../functions/_shared/crypto.ts';

const charge: ChargeConfig = {
  currency: { stripe: 'USD', paystack: 'GHS', flutterwave: 'USD' },
  usdRate: { stripe: 1, paystack: 15, flutterwave: 1 },
};
const allowed = ['http://localhost:', 'burden://'];
const base = {
  provider: 'stripe', amount: 25, coverFee: true, anonymous: false, name: 'Ama Mensah',
  email: 'ama@example.com', campaignId: 'cp_1', campaignTitle: 'School roof', churchId: 'ch_1',
  churchName: 'Grace Church', returnUrl: 'http://localhost:5174/burdenbypva/',
};

test('fee matches the Give screen formula (4.5% + $0.30)', () => {
  assert.equal(feeMinor(2500), 143);  // $25 → $1.43 (1.125 + 0.30 = 1.425, rounds up)
  assert.equal(feeMinor(100), 35);    // $1 → $0.35
  assert.equal(feeMinor(10000), 480); // $100 → $4.80
});

test('server recomputes fee and total', () => {
  const r = parseGiftInput({ ...base, fee: 0, total: 1 }, charge, allowed);
  assert.ok(r.ok);
  assert.equal(r.value.amount_minor, 2500);
  assert.equal(r.value.fee_minor, 143);
  assert.equal(r.value.total_minor, 2643);
  assert.equal(r.value.charge_amount_minor, 2643);
});

test('no fee when donor does not cover it', () => {
  const r = parseGiftInput({ ...base, coverFee: false }, charge, allowed);
  assert.ok(r.ok);
  assert.equal(r.value.total_minor, 2500);
});

test('Paystack charges in local currency at the configured rate', () => {
  const r = parseGiftInput({ ...base, provider: 'paystack' }, charge, allowed);
  assert.ok(r.ok);
  assert.equal(r.value.charge_currency, 'GHS');
  assert.equal(r.value.charge_amount_minor, 2643 * 15);
});

test('rejects bad input', () => {
  const bad = (patch: object) => parseGiftInput({ ...base, ...patch }, charge, allowed).ok;
  assert.equal(bad({ amount: 0.5 }), false);
  assert.equal(bad({ amount: 10_000.01 }), false);
  assert.equal(bad({ provider: 'paypal' }), false);
  assert.equal(bad({ email: 'not-an-email' }), false);
  assert.equal(bad({ name: '' }), false);
  assert.equal(bad({ returnUrl: 'https://evil.example/' }), false);
});

test('anonymous gifts need an email but drop the name', () => {
  const r = parseGiftInput({ ...base, anonymous: true, name: '' }, charge, allowed);
  assert.ok(r.ok);
  assert.equal(r.value.donor_name, null);
});

test('Stripe signature: valid, tampered, stale', async () => {
  const secret = 'whsec_test123';
  const body = '{"id":"evt_1"}';
  const t = 1_700_000_000;
  const sig = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  const header = `t=${t},v1=${sig}`;
  assert.equal(await verifyStripeSignature(body, header, secret, t + 10), true);
  assert.equal(await verifyStripeSignature(body + ' ', header, secret, t + 10), false);
  assert.equal(await verifyStripeSignature(body, header, secret, t + 1000), false);
  assert.equal(await verifyStripeSignature(body, null, secret, t), false);
});

test('Paystack signature', async () => {
  const key = 'sk_test_abc';
  const body = '{"event":"charge.success"}';
  const sig = createHmac('sha512', key).update(body).digest('hex');
  assert.equal(await verifyPaystackSignature(body, sig, key), true);
  assert.equal(await verifyPaystackSignature(body + ' ', sig, key), false);
});

test('timingSafeEqual', () => {
  assert.equal(timingSafeEqual('abc', 'abc'), true);
  assert.equal(timingSafeEqual('abc', 'abd'), false);
  assert.equal(timingSafeEqual('abc', 'abcd'), false);
});

const gift: GiftRow = {
  id: '11111111-1111-1111-1111-111111111111', provider: 'stripe', provider_ref: 'cs_test_1',
  charge_currency: 'USD', charge_amount_minor: 2643, donor_email: 'a@b.co', donor_name: 'A',
  church_name: 'Grace', campaign_title: 'Roof',
};

test('Stripe webhook outcomes, including amount mismatch', () => {
  const paid = { id: 'cs_test_1', payment_status: 'paid', amount_total: 2643, currency: 'usd' };
  assert.equal(stripeWebhookVerification(gift, 'checkout.session.completed', paid).outcome, 'paid');
  assert.equal(
    stripeWebhookVerification(gift, 'checkout.session.completed', { ...paid, amount_total: 100 }).outcome, 'failed');
  assert.equal(
    stripeWebhookVerification(gift, 'checkout.session.completed', { ...paid, payment_status: 'unpaid' }).outcome,
    'pending');
  assert.equal(stripeWebhookVerification(gift, 'checkout.session.expired', {}).outcome, 'cancelled');
});

function mockFetch(payload: unknown, ok = true) {
  globalThis.fetch = (async () => ({ ok, status: ok ? 200 : 404, json: async () => payload })) as typeof fetch;
}

test('Paystack verify: success, mismatch, abandoned', async () => {
  const g = { ...gift, provider: 'paystack' as const, charge_currency: 'GHS', charge_amount_minor: 39645 };
  const s = { PAYSTACK_SECRET_KEY: 'sk_test_x' };
  mockFetch({ status: true, data: { status: 'success', amount: 39645, currency: 'GHS', id: 9, channel: 'mobile_money' } });
  assert.deepEqual(await verify(g, s), { outcome: 'paid', providerRef: '9', method: 'mobile_money' });
  mockFetch({ status: true, data: { status: 'success', amount: 100, currency: 'GHS', id: 9 } });
  assert.equal((await verify(g, s)).outcome, 'failed');
  mockFetch({ status: true, data: { status: 'abandoned' } });
  assert.equal((await verify(g, s)).outcome, 'pending');
  mockFetch({ status: false, message: 'Transaction reference not found' }, false);
  assert.equal((await verify(g, s)).outcome, 'pending');
});

test('Flutterwave verify: success and failure', async () => {
  const g = { ...gift, provider: 'flutterwave' as const };
  const s = { FLUTTERWAVE_SECRET_KEY: 'FLWSECK_TEST-x' };
  mockFetch({ status: 'success', data: { status: 'successful', amount: 26.43, currency: 'USD', id: 5, payment_type: 'mobilemoneygh' } });
  assert.deepEqual(await verify(g, s), { outcome: 'paid', providerRef: '5', method: 'mobilemoneygh' });
  mockFetch({ status: 'success', data: { status: 'failed', processor_response: 'Insufficient Funds' } });
  const v = await verify(g, s);
  assert.equal(v.outcome, 'failed');
  assert.match((v as { reason: string }).reason, /insufficient funds/);
});

test('unconfigured provider says so instead of crashing silently', async () => {
  await assert.rejects(verify(gift, {}), /STRIPE_SECRET_KEY is not set/);
});
