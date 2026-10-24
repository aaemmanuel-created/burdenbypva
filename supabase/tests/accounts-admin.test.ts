// Unit tests for giver accounts, fundraisers and the admin console's rules.
// Run from the repo root:  node --test 'supabase/tests/*.test.ts'

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  fundraiserId, giverGift, parseFundraiser, publicFundraiser, raisedBy,
} from '../functions/_shared/account-logic.ts';
import {
  auditEntry, checksFor, churchIdFor, flagsFor, missingFor, parseApplication, parseBurdenEdit, parseReport, tierEarned,
} from '../functions/_shared/admin-logic.ts';
import { parseGiftInput, type ChargeConfig } from '../functions/_shared/gift-input.ts';

test('a fundraiser needs a name, a reason and a goal of at least $1', () => {
  const ok = parseFundraiser({ campaignId: 'cmp_grace_school', name: ' Ama ', note: 'For my old school.', goal: '250' });
  assert.deepEqual(ok, { ok: true, value: { campaign_id: 'cmp_grace_school', name: 'Ama', note: 'For my old school.', goal_minor: 25000 } });
  assert.equal(parseFundraiser({ campaignId: 'x', name: 'Ama', note: 'n', goal: 0 }).ok, false);
  assert.equal(parseFundraiser({ campaignId: 'x', name: '', note: 'n', goal: 5 }).ok, false);
  assert.equal(parseFundraiser({ campaignId: 'x', name: 'A', note: 'n'.repeat(281), goal: 5 }).ok, false);
});

test('fundraiser ids are fr_ plus 12 lower-case characters', () => {
  const id = fundraiserId(new Uint8Array([0, 1, 35, 36, 200, 7, 8, 9, 10, 11, 12, 13]));
  assert.match(id, /^fr_[a-z0-9]{12}$/);
});

test('a fundraiser counts only gifts that went through', () => {
  const raised = raisedBy([
    { fundraiser_id: 'fr_a', status: 'held', amount_minor: 1000 },
    { fundraiser_id: 'fr_a', status: 'church_confirmed', amount_minor: 500 },
    { fundraiser_id: 'fr_a', status: 'failed', amount_minor: 9999 },
    { fundraiser_id: 'fr_a', status: 'refunded', amount_minor: 700 },
    { fundraiser_id: null, status: 'held', amount_minor: 300 },
  ]);
  assert.deepEqual(raised, { fr_a: 1500 });
  const f = publicFundraiser({ id: 'fr_a', created_at: '2026-10-26T10:00:00Z', campaign_id: 'c', name: 'Ama', note: 'n', goal_minor: 25000, status: 'closed' }, 1500);
  assert.deepEqual(f, { id: 'fr_a', campaignId: 'c', name: 'Ama', note: 'n', goal: 250, raised: 15, started: '2026-10-26', closed: true });
});

test("a giver's gift on another device carries its timeline but no token", () => {
  const g = giverGift({
    id: 'g1', status: 'held', status_note: null, hold_until: null, provider: 'stripe', payment_method: 'card', test_mode: true,
    campaign_id: 'c', campaign_title: 'T', church_name: 'Ch', amount_minor: 2500, fee_minor: 143, total_minor: 2643,
    recurring: false, anonymous: false, created_at: '2026-10-26T10:00:00Z', payout_to: null, fundraiser_id: null, donor_name: 'Ama',
  }, [{ step: 'gift_sent', occurred_at: '2026-10-26T10:00:00Z', note: null }]);
  assert.equal(g.amount, 25);
  assert.equal(g.account, true);
  assert.equal('token' in g, false);
  assert.equal(g.events.length, 1);
});

test('gifts carry a fundraiser id only in the right shape', () => {
  const charge: ChargeConfig = { currency: { stripe: 'USD', paystack: 'GHS', flutterwave: 'USD' }, usdRate: { stripe: 1, paystack: 15, flutterwave: 1 } };
  const base = {
    provider: 'stripe', amount: 10, campaignId: 'c', campaignTitle: 'T', churchId: 'ch', churchName: 'Ch',
    email: 'a@b.co', name: 'Ama', returnUrl: 'http://localhost:5174/',
  };
  const ok = parseGiftInput({ ...base, fundraiserId: 'fr_abc123def456' }, charge, ['http://localhost:']);
  assert.ok(ok.ok && ok.value.fundraiser_id === 'fr_abc123def456');
  const bad = parseGiftInput({ ...base, fundraiserId: "fr_x'; drop" }, charge, ['http://localhost:']);
  assert.ok(bad.ok && bad.value.fundraiser_id === null);
});

// ── KYB ──

test('each tier needs every check of the tiers below it', () => {
  assert.deepEqual(checksFor('Basic').map((c) => c.id), ['registration', 'leadership', 'creed', 'sanctions']);
  assert.equal(checksFor('Verified').length, 7);
  assert.equal(checksFor('Premium Trust').length, 9);
});

test('the tier a church has earned is the highest with nothing missing', () => {
  const done = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { ok: true }]));
  assert.equal(tierEarned({}), null);
  assert.equal(tierEarned(done(['registration', 'leadership', 'creed', 'sanctions'])), 'Basic');
  assert.equal(tierEarned(done(['registration', 'leadership', 'creed', 'sanctions', 'references', 'address', 'bank'])), 'Verified');
  // Premium checks without the Verified ones do not skip a tier.
  assert.equal(tierEarned(done(['registration', 'leadership', 'creed', 'sanctions', 'accounts', 'visit'])), 'Basic');
  assert.deepEqual(missingFor('Verified', done(['registration', 'leadership', 'creed', 'sanctions', 'bank'])), ['references', 'address']);
  // An unticked check does not count.
  assert.equal(tierEarned({ ...done(['registration', 'leadership', 'creed']), sanctions: { ok: false } }), null);
});

test('church ids are readable slugs', () => {
  assert.equal(churchIdFor("St. Andrew's Presbyterian", 'Accra'), 'ch_accra_st_andrew_s_presbyterian');
  assert.equal(churchIdFor('Église Évangélique', 'Abidjan'), 'ch_abidjan_eglise_evangelique');
});

test('an application needs registration, oversight, references and the creeds', () => {
  const full = {
    churchName: 'Hope Chapel', tradition: 'Evangelical', city: 'Kumasi', country: 'Ghana', leaderName: 'Rev. Ama Owusu',
    leaderRole: 'Senior Pastor', email: 'Office@HopeChapel.org', registrationBody: 'Registrar-General’s Department',
    registrationNo: 'G-12345', oversight: 'Ghana Pentecostal and Charismatic Council', website: 'hopechapel.org',
    references: 'Rev. K. Boateng, 024 000 0000; Dr. E. Mensah, e.mensah@example.org', creedAffirmed: true,
  };
  const ok = parseApplication(full);
  assert.ok(ok.ok);
  assert.equal(ok.ok && ok.value.contact_email, 'office@hopechapel.org');
  assert.equal(ok.ok && ok.value.website, 'https://hopechapel.org');
  assert.equal(parseApplication({ ...full, creedAffirmed: false }).ok, false);
  assert.equal(parseApplication({ ...full, registrationNo: '' }).ok, false);
  assert.equal(parseApplication({ ...full, references: 'ask us' }).ok, false);
  assert.equal(parseApplication({ ...full, oversight: '' }).ok, false);
});

// ── Burden edits ──

test('churches may reword the story and the money steps, not the goal', () => {
  const e = parseBurdenEdit({
    objective: 'Cover term-one books and lunch for 84 children.',
    moneyWorkflow: ['Givers give through BURDEN.', ' ', 'Held 3 days, then paid to the church.'],
    goal: 1_000_000,
  });
  assert.ok(e.ok);
  assert.deepEqual(e.ok && Object.keys(e.value.fields), ['objective', 'moneyWorkflow']);
  assert.deepEqual(e.ok && e.value.fields.moneyWorkflow, ['Givers give through BURDEN.', 'Held 3 days, then paid to the church.']);
  assert.equal(parseBurdenEdit({ goal: 5 }).ok, false);
  assert.equal(parseBurdenEdit({ moneyWorkflow: [] }).ok, false);
  assert.equal(parseBurdenEdit({ summary: 'short' }).ok, false);
});

test('urgency and spiritual-reward wording is flagged for the reviewer, not blocked', () => {
  assert.deepEqual(flagsFor('Plain words about books and lunch.'), []);
  assert.deepEqual(flagsFor('URGENT: only 3 days left!'), ['urgency']);
  assert.deepEqual(flagsFor('Sow a seed and God will bless you.'), ['spiritual reward']);
  const e = parseBurdenEdit({ currentState: 'Act now — sow your seed for a hundredfold return.' });
  assert.ok(e.ok);
  assert.deepEqual(e.ok && e.value.flags, ['urgency', 'spiritual reward']);
});

// ── Reports and the audit log ──

test('reports need a known kind, a reason and what they point at', () => {
  assert.ok(parseReport({ kind: 'fundraiser', ref: 'fr_abc', campaignId: 'c', reason: 'scam' }).ok);
  assert.equal(parseReport({ kind: 'church', ref: 'x', campaignId: 'c', reason: 'scam' }).ok, false);
  assert.equal(parseReport({ kind: 'update', ref: '1', campaignId: 'c', reason: 'dislike' }).ok, false);
  assert.equal(parseReport({ kind: 'update', ref: '', campaignId: 'c', reason: 'abuse' }).ok, false);
});

test('the audit log never stores emails, phone numbers or account numbers in its detail', () => {
  const e = auditEntry('Ruth <ruth@burden.org>', 'payout.verify', 'church', 'ch_x', {
    note: 'Paystack name matched', donor_email: 'a@b.co', account_number: '0241234567', phone: '024', tier: 'Verified',
  });
  assert.deepEqual(e.detail, { note: 'Paystack name matched', tier: 'Verified' });
  assert.equal(e.actor, 'Ruth <ruth@burden.org>');
});
