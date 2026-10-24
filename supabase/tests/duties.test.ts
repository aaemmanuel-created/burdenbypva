// Unit tests for the money duties: receipts, refunds, Gift Aid, exchange
// rates, SMS receipts and sanctions matching. Run from the repo root:
//   node --test 'supabase/tests/*.test.ts'

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReceipt, csv, GIFT_AID_WORDING, hmrcRow, isFresh, isPlaceholderEmail, parseGiftAid, pickRate,
  refundBlocker, smsReceiptText,
} from '../functions/_shared/duties-logic.ts';
import {
  decisionFor, jaroWinkler, nameScore, nameTokens, parseOfacSdn, parseUkList, splitCsvLine,
} from '../functions/_shared/sanctions-logic.ts';
import { payoutBlocker } from '../functions/_shared/payout-logic.ts';
import { refundPayment, type GiftRow } from '../functions/_shared/providers.ts';

const gift = {
  id: '33333333-3333-3333-3333-333333333333', receipt_number: 1042, created_at: '2026-10-24T09:00:00Z',
  amount_minor: 2500, fee_minor: 143, total_minor: 2643, charge_currency: 'GHS', charge_amount_minor: 40174,
  fx_rate: 15.2, church_name: "St. Andrew's Presbyterian", campaign_title: 'Osu Bursary Fund',
  donor_name: 'Ama Mensah', anonymous: false, recurring: true, provider: 'paystack',
  payment_method: 'mobile_money', test_mode: false, gift_aid: false,
};

// ── Receipts ────────────────────────────────────────────────────────────

test('a receipt states the gift, the fee, the rate and the refund right', () => {
  const r = buildReceipt(gift);
  assert.match(r.subject, /receipt 1042/);
  assert.doesNotMatch(r.subject, /TEST/);
  for (const line of [/Receipt no\. 1042/, /24 October 2026/, /Gift: US\$25\.00/, /Fee you covered: US\$1\.43/,
    /(GHS|GH₵)\s?401\.74 at 1 USD = 15\.2 GHS \(no BURDEN margin\)/, /mobile money/, /monthly gift/,
    /No goods or services/, /refund within 7 days/]) {
    assert.match(r.text, line);
  }
  assert.doesNotMatch(r.text, /\n\n\n/);
});

test('test receipts say so; anonymous and Gift Aid lines appear when true', () => {
  const r = buildReceipt({ ...gift, test_mode: true, anonymous: true, gift_aid: true, donor_name: null });
  assert.match(r.subject, /^\[TEST\]/);
  assert.match(r.text, /TEST RECEIPT/);
  assert.match(r.text, /gave anonymously/);
  assert.match(r.text, /Gift Aid/);
});

test('USSD givers get an SMS receipt instead of email', () => {
  assert.ok(isPlaceholderEmail('241234567@ussd.burden.invalid'));
  assert.ok(!isPlaceholderEmail('ama@example.com'));
  const sms = smsReceiptText(gift);
  assert.match(sms, /GHS 401\.74/);
  assert.match(sms, /Receipt 1042/);
  assert.ok(sms.length <= 200, `SMS is ${sms.length} characters`);
});

// ── Refunds ─────────────────────────────────────────────────────────────

test('refunds: within 7 days, before the church has confirmed', () => {
  const now = new Date('2026-10-28T09:00:00Z');
  assert.equal(refundBlocker({ status: 'held', created_at: gift.created_at }, now), null);
  assert.equal(refundBlocker({ status: 'paid_out', created_at: gift.created_at }, now), null);
  assert.match(refundBlocker({ status: 'held', created_at: gift.created_at }, new Date('2026-11-01T09:00:01Z'))!, /7 days/);
  assert.match(refundBlocker({ status: 'church_confirmed', created_at: gift.created_at }, now)!, /confirmed/);
  assert.match(refundBlocker({ status: 'refunded', created_at: gift.created_at }, now)!, /already/);
  assert.match(refundBlocker({ status: 'initiated', created_at: gift.created_at }, now)!, /completed gift/);
});

function mockFetchSeq(...payloads: unknown[]) {
  const calls: { url: string; body: string }[] = [];
  let i = 0;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), body: String(init?.body ?? '') });
    return { ok: true, status: 200, json: async () => payloads[Math.min(i++, payloads.length - 1)] };
  }) as typeof fetch;
  return calls;
}
const row: GiftRow = {
  id: gift.id, provider: 'paystack', provider_ref: '987654', charge_currency: 'GHS', charge_amount_minor: 40174,
  donor_email: 'a@b.co', donor_name: 'A', church_name: 'C', campaign_title: 'T',
};
const s = { PAYSTACK_SECRET_KEY: 'sk_test_x', STRIPE_SECRET_KEY: 'sk_test_y', FLUTTERWAVE_SECRET_KEY: 'FLWSECK_TEST-z' };

test('refunds go to each provider the right way', async () => {
  let calls = mockFetchSeq({ status: true, data: { id: 55 } });
  assert.equal(await refundPayment(row, s), '55');
  assert.match(calls[0].url, /api\.paystack\.co\/refund$/);
  assert.equal(JSON.parse(calls[0].body).transaction, '987654');

  calls = mockFetchSeq({ id: 'cs_1', payment_intent: 'pi_1' }, { id: 're_1' });
  assert.equal(await refundPayment({ ...row, provider: 'stripe', provider_ref: 'cs_1' }, s), 're_1');
  assert.match(calls[1].url, /\/v1\/refunds$/);
  assert.equal(new URLSearchParams(calls[1].body).get('payment_intent'), 'pi_1');

  // A Stripe subscription month is refunded by hand.
  mockFetchSeq({ id: 'cs_2', payment_intent: null });
  await assert.rejects(refundPayment({ ...row, provider: 'stripe', provider_ref: 'cs_2' }, s), /BURDEN team/);

  calls = mockFetchSeq({ status: 'success', data: { id: 77 } });
  assert.equal(await refundPayment({ ...row, provider: 'flutterwave', provider_ref: '123' }, s), '77');
  assert.match(calls[0].url, /\/transactions\/123\/refund$/);
});

// ── Gift Aid ────────────────────────────────────────────────────────────

test('Gift Aid declarations need a name, address line and UK postcode', () => {
  const ok = parseGiftAid({ firstName: 'Ama', lastName: 'Mensah', house: '12', postcode: 'se154qf' });
  assert.ok(ok.ok);
  assert.equal(ok.value.postcode, 'SE15 4QF');
  assert.ok(!parseGiftAid({ firstName: 'Ama', lastName: 'Mensah', house: '12', postcode: '00233' }).ok);
  assert.ok(!parseGiftAid({ firstName: 'Ama', house: '12', postcode: 'SE15 4QF' }).ok);
  assert.ok(!parseGiftAid({ firstName: 'Ama', lastName: 'Mensah', postcode: 'SE15 4QF' }).ok);
  assert.match(GIFT_AID_WORDING, /UK taxpayer/);
});

test('HMRC schedule rows: GBP gifts only, dates as DD/MM/YY', () => {
  const d = { first_name: 'Ama', last_name: 'Mensah', house: '12', postcode: 'SE15 4QF', declared_at: '2026-10-24T09:00:00Z' };
  assert.deepEqual(hmrcRow(d, { charge_currency: 'GBP', amount_minor: 2500, fx_rate: 0.79 }),
    ['', 'Ama', 'Mensah', '12', 'SE15 4QF', '', '', '24/10/26', '19.75']);
  assert.equal(hmrcRow(d, { charge_currency: 'USD', amount_minor: 2500, fx_rate: 1 }), null);
  assert.equal(csv([['a,b', 'say "hi"']]), '"a,b","say ""hi"""');
});

// ── Exchange rates ──────────────────────────────────────────────────────

test('rates are read from the source and kept for 12 hours', () => {
  assert.equal(pickRate({ result: 'success', rates: { GHS: 15.2 } }, 'GHS'), 15.2);
  assert.equal(pickRate({ result: 'error' }, 'GHS'), null);
  assert.equal(pickRate({ result: 'success', rates: { GHS: 0 } }, 'GHS'), null);
  const now = new Date('2026-10-24T12:00:00Z');
  assert.ok(isFresh('2026-10-24T01:00:00Z', now));
  assert.ok(!isFresh('2026-10-23T23:00:00Z', now));
});

// ── Sanctions ───────────────────────────────────────────────────────────

test('names are normalised: accents, titles and order do not matter', () => {
  assert.deepEqual(nameTokens('Rev. Dr. Kofí  Mensah-Boateng'), ['kofi', 'mensahboateng']);
  assert.equal(jaroWinkler('martha', 'marhta') > 0.95, true);
  assert.equal(nameScore(nameTokens('Mensah Kofi'), nameTokens('Kofi Mensah')), 1);
});

test('screening decisions: exact blocks, close holds, different clears', () => {
  const list = nameTokens('Ivan Petrovich Sidorov');
  assert.equal(decisionFor(nameScore(nameTokens('Ivan Petrovich Sidorov'), list), 3), 'blocked');
  assert.equal(decisionFor(nameScore(nameTokens('Ivan Petrovic Sidorov'), list), 3), 'review');
  assert.equal(decisionFor(nameScore(nameTokens('Ama Mensah'), list), 2), 'clear');
  // A single shared first name is not enough to block a gift.
  assert.equal(decisionFor(nameScore(nameTokens('Ivan'), list), 1), 'clear');
});

test('OFAC and UK lists parse into names', () => {
  const ofac = parseOfacSdn('36,"AEROCARIBBEAN AIRLINES",-0- ,"CUBA",-0-\n2674,"SIDOROV, Ivan Petrovich","individual","RUSSIA-EO14024"\n');
  assert.deepEqual(ofac.map((e) => e.name), ['AEROCARIBBEAN AIRLINES', 'Ivan Petrovich SIDOROV']);
  const uk = parseUkList('Last Updated,01/10/2026\nName 6,Name 1,Name 2,Name 3,Name 4,Name 5,Title,Group ID\n' +
    'SIDOROV,Ivan,Petrovich,,,,Mr,1234\nSIDOROV,Ivan,Petrovich,,,,Mr,1234\n');
  assert.deepEqual(uk, [{ list: 'UK', list_ref: '1234', name: 'Ivan Petrovich SIDOROV' }]);
  assert.deepEqual(splitCsvLine('a,"b, c","d ""e"""'), ['a', 'b, c', 'd "e"']);
});

test('payouts wait while a giver is under sanctions review', () => {
  const account = { method: 'momo' as const, network: 'mtn', account_number: '0241234567', currency: 'GHS',
    paystack_recipient: 'RCP_1', verified_at: '2026-10-22T00:00:00Z' };
  const g = { provider: 'paystack', amount_minor: 2500, fx_rate: 15, charge_currency: 'GHS', test_mode: false };
  assert.equal(payoutBlocker({ ...g, screening: 'clear' }, account), null);
  assert.match(payoutBlocker({ ...g, screening: 'review' }, account)!, /sanctions review/);
});
