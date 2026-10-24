// Unit tests for the words-of-support rules (the first, free part of the
// review queue). Run from the repo root: node --test 'supabase/tests/*.test.ts'

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { giverNote, ruleCheck, stricter } from '../functions/_shared/moderation-logic.ts';
import { parseGiftInput, type ChargeConfig } from '../functions/_shared/gift-input.ts';

const ok = (t: string) => assert.equal(ruleCheck(t).decision, 'approve', t);
const held = (t: string) => assert.equal(ruleCheck(t).decision, 'hold', t);
const rejected = (t: string) => assert.equal(ruleCheck(t).decision, 'reject', t);

test('kind, prayerful and everyday messages pass the rules', () => {
  ok('Praying for every child in that Saturday class. May they learn with joy.');
  ok('May the Lord send me to help one day. Blessings from Kumasi.');
  ok('Psalm 23:1 — The Lord is my shepherd.');
  ok('Nyame nhyira mo! God bless the kitchen team.');
  ok('From our family to yours in Eastleigh.');
});

test('money requests and scams are rejected outright', () => {
  rejected('Please send money to my MoMo 0241234567');
  rejected('Transfer GHS 50 to this wallet and I will pray for you');
  rejected('Pay $20 to my account number and get double');
  rejected('My momo number: 0551234567');
  rejected('Invest in bitcoin with me');
  rejected('');
  rejected('x'.repeat(281));
});

test('links, contact details and pressure language wait for a person', () => {
  held('See more at www.example.com');
  held('Email me at someone@example.com');
  held('WhatsApp me on 024 123 4567'); // contact details: held (reject needs a money ask)
  held('Give now before it is too late!');
  held('God will surely bless and multiply everything you give');
  held('Sow a seed and receive a hundredfold');
  held('THIS CHURCH IS AMAZING PRAISE GOD');
  held('This is a scam');
});

test('the stricter decision always wins', () => {
  assert.equal(stricter('approve', 'hold'), 'hold');
  assert.equal(stricter('reject', 'approve'), 'reject');
  assert.equal(stricter('hold', 'reject'), 'reject');
  assert.match(giverNote('hold'), /reviewer/);
});

test('the gift form carries the message to the server, trimmed and capped', () => {
  const charge: ChargeConfig = {
    currency: { stripe: 'USD', paystack: 'GHS', flutterwave: 'USD' },
    usdRate: { stripe: 1, paystack: 15, flutterwave: 1 },
  };
  const base = {
    provider: 'stripe', amount: 25, name: 'Ama', email: 'ama@example.com', campaignId: 'cp_1',
    campaignTitle: 'Roof', churchId: 'ch_1', churchName: 'Grace', returnUrl: 'http://localhost:5174/',
  };
  const r = parseGiftInput({ ...base, message: '  Praying for you  ' }, charge, ['http://localhost:']);
  assert.ok(r.ok);
  assert.equal(r.value.message, 'Praying for you');
  const none = parseGiftInput(base, charge, ['http://localhost:']);
  assert.ok(none.ok);
  assert.equal(none.value.message, null);
});
