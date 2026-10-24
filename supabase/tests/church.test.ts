// Unit tests for church accounts and notifications. Run from the repo root:
//   node --test 'supabase/tests/*.test.ts'

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  burdensOf, churchView, giftEventMessage, maskAccount, ownsBurden, parseInvite, parseUpdate, totals, updateMessage,
  type GiftForChurch,
} from '../functions/_shared/church-logic.ts';
import { parseGiftInput, type ChargeConfig } from '../functions/_shared/gift-input.ts';

const gift = (over: Partial<GiftForChurch> = {}): GiftForChurch => ({
  id: 'abcdef12-0000-0000-0000-000000000000', created_at: '2026-10-25T09:00:00Z', campaign_id: 'cmp_andrew_bursary',
  status: 'paid_out', amount_minor: 2500, charge_currency: 'GHS', charge_amount_minor: 40174, fx_rate: 15.2,
  anonymous: false, donor_name: 'Ama Mensah', recurring: false, test_mode: false, payout_to: 'MTN MoMo wallet ending 4567',
  ...over,
});

test('a church only acts on its own burdens', () => {
  assert.deepEqual(burdensOf('ch_accra_st_andrew').map((b) => b.id), ['cmp_andrew_bursary']);
  assert.ok(ownsBurden('ch_accra_st_andrew', 'cmp_andrew_bursary'));
  assert.ok(!ownsBurden('ch_accra_st_andrew', 'cmp_grace_school'));
});

test('churches see the gift and the giver, but never an email, and not anonymous names', () => {
  const v = churchView(gift());
  assert.equal(v.giver, 'Ama Mensah');
  assert.equal(v.ref, 'ABCDEF12');
  assert.deepEqual(v.local, { currency: 'GHS', amount: 380 });
  assert.equal(v.canConfirm, true);
  assert.ok(!('donor_email' in v));
  assert.equal(churchView(gift({ anonymous: true })).giver, 'Anonymous');
  assert.equal(churchView(gift({ status: 'held' })).canConfirm, false);
  assert.equal(churchView(gift({ charge_currency: 'USD', fx_rate: 1 })).local, null);
});

test('totals per burden: given, held, paid out and awaiting confirmation', () => {
  const t = totals([
    gift(), gift({ status: 'held', amount_minor: 1000 }), gift({ status: 'church_confirmed', amount_minor: 500 }),
    gift({ status: 'refunded', amount_minor: 9900 }),
  ]);
  assert.deepEqual(t, [{ campaignId: 'cmp_andrew_bursary', given: 40, gifts: 3, held: 10, paidOut: 30, awaiting: 1 }]);
  assert.equal(maskAccount('0241234567'), '•••• 4567');
});

test('updates and invites are checked', () => {
  assert.ok(parseUpdate({ title: 'Nine students selected', body: 'The committee met on 6 October.' }).ok);
  assert.ok(!parseUpdate({ title: 'Hi', body: 'The committee met on 6 October.' }).ok);
  assert.ok(!parseUpdate({ title: 'Nine students', body: 'Too short' }).ok);
  const inv = parseInvite({ email: ' Adwoa@Church.org ', displayName: 'Mrs. Adwoa Boateng', roleTitle: 'Bursary chair' });
  assert.ok(inv.ok);
  assert.equal(inv.email, 'adwoa@church.org');
  assert.equal(inv.role, 'editor');
  assert.ok(!parseInvite({ email: 'nope', displayName: 'X' }).ok);
});

test('givers hear when their gift reaches the church and when it is confirmed', () => {
  const g = { church_name: "St. Andrew's", campaign_title: 'Osu Bursary Fund', amount_minor: 2500, test_mode: false };
  assert.match(giftEventMessage('paid_out', g, null)!.title, /reached St\. Andrew's/);
  assert.match(giftEventMessage('church_confirmed', g, 'Fees paid to the school.')!.body, /Fees paid to the school/);
  assert.equal(giftEventMessage('held', g, null), null);
  assert.match(giftEventMessage('paid_out', { ...g, test_mode: true }, null)!.title, /^\[TEST\]/);
  const long = updateMessage({ title: 'T', body: 'x'.repeat(400), author: 'Rev. Mensah' }, 'Osu Bursary Fund');
  assert.ok(long.body.length < 230);
  assert.match(long.title, /New update: Osu Bursary Fund/);
});

test('update emails are opt-in at the Give screen', () => {
  const charge: ChargeConfig = {
    currency: { stripe: 'USD', paystack: 'GHS', flutterwave: 'USD' },
    usdRate: { stripe: 1, paystack: 15, flutterwave: 1 },
  };
  const base = {
    provider: 'stripe', amount: 25, name: 'Ama', email: 'ama@example.com', campaignId: 'cp_1',
    campaignTitle: 'Roof', churchId: 'ch_1', churchName: 'Grace', returnUrl: 'http://localhost:5174/',
  };
  const off = parseGiftInput(base, charge, ['http://localhost:']);
  const on = parseGiftInput({ ...base, notifyUpdates: true }, charge, ['http://localhost:']);
  assert.ok(off.ok && on.ok);
  assert.equal(off.value.notify_updates, false);
  assert.equal(on.value.notify_updates, true);
});
