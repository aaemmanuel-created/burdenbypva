// The money duties on the server (2026-10-24): receipts by email (Postmark)
// or SMS (Africa's Talking, for USSD givers), live exchange rates, and
// sanctions screening. Pure rules: duties-logic.ts, sanctions-logic.ts.

import type { ChargeConfig } from './gift-input.ts';
import {
  buildReceipt, FX_MAX_AGE_HOURS, isFresh, isPlaceholderEmail, pickRate, type ReceiptGift, smsReceiptText,
} from './duties-logic.ts';
import { decisionFor, nameScore, nameTokens } from './sanctions-logic.ts';
import { charge, db, type FullGift, isTestKey } from './server.ts';

const env = (n: string) => Deno.env.get(n) ?? undefined;

// ── Receipts ────────────────────────────────────────────────────────────

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const token = env('POSTMARK_SERVER_TOKEN');
  const from = env('RECEIPT_FROM'); // e.g. "BURDEN <receipts@your-domain>"
  if (!token || !from) { console.warn('receipt not emailed: POSTMARK_SERVER_TOKEN / RECEIPT_FROM not set'); return false; }
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: { 'X-Postmark-Server-Token': token, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ From: from, To: to, Subject: subject, TextBody: text, MessageStream: 'outbound' }),
  });
  if (!res.ok) console.error('Postmark rejected the receipt', res.status);
  return res.ok;
}

export async function sendSms(phone0: string, text: string): Promise<boolean> {
  const user = env('AT_USERNAME'), key = env('AT_API_KEY');
  if (!user || !key) { console.warn('SMS not sent: AT_USERNAME / AT_API_KEY not set'); return false; }
  const host = user === 'sandbox' ? 'api.sandbox.africastalking.com' : 'api.africastalking.com';
  const form = new URLSearchParams({ username: user, to: '+233' + phone0.slice(1), message: text });
  if (env('SMS_SENDER_ID')) form.set('from', env('SMS_SENDER_ID')!);
  const res = await fetch(`https://${host}/version1/messaging`, {
    method: 'POST',
    headers: { apiKey: key, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  if (!res.ok) console.error("Africa's Talking rejected the SMS", res.status);
  return res.ok;
}

// Once a payment is confirmed: one receipt per gift, by email, or by SMS for
// USSD givers (who have no email). Never blocks the payment step.
export async function sendReceipt(gift: FullGift) {
  try {
    if (gift.receipt_sent_at || gift.sms_sent_at) return;
    const { data: number } = await db.rpc('assign_receipt_number', { p_gift_id: gift.id });
    const g = { ...(gift as unknown as ReceiptGift), receipt_number: number as number };
    if (isPlaceholderEmail(gift.donor_email)) {
      if (gift.momo_phone && await sendSms(gift.momo_phone, smsReceiptText(g))) {
        await db.from('gifts').update({ sms_sent_at: new Date().toISOString() }).eq('id', gift.id);
      }
      return;
    }
    const r = buildReceipt(g);
    if (await sendEmail(gift.donor_email, r.subject, r.text)) {
      await db.from('gifts').update({ receipt_sent_at: new Date().toISOString() }).eq('id', gift.id);
    }
  } catch (e) {
    console.error('receipt failed', gift.id, e);
  }
}

// ── Exchange rates ──────────────────────────────────────────────────────
// USD → local, from a public source (default open.er-api.com), cached for
// FX_MAX_AGE_HOURS and passed through with no margin. Live payments refuse
// to run on a stale rate; test mode falls back to the fixed test rate.

async function usdRate(currency: string, live: boolean, testRate: number): Promise<{ rate: number; source: string }> {
  if (currency === 'USD') return { rate: 1, source: 'USD' };
  const { data: cached } = await db.from('fx_rates').select('rate, source, fetched_at')
    .eq('currency', currency).order('fetched_at', { ascending: false }).limit(1).maybeSingle();
  if (cached && isFresh(cached.fetched_at)) return { rate: Number(cached.rate), source: cached.source };
  const url = env('FX_SOURCE_URL') ?? 'https://open.er-api.com/v6/latest/USD';
  try {
    const res = await fetch(url);
    const rate = res.ok ? pickRate(await res.json(), currency) : null;
    if (rate) {
      const source = new URL(url).host;
      await db.from('fx_rates').insert({ currency, rate, source });
      return { rate, source };
    }
  } catch (e) {
    console.error('fx fetch failed', e);
  }
  if (live) throw new Error(`No exchange rate for ${currency} newer than ${FX_MAX_AGE_HOURS} hours.`);
  return { rate: testRate, source: 'test rate' };
}

// The charge config for this request, with today's rates.
export async function chargeNow(): Promise<{ config: ChargeConfig; sources: Record<string, string> }> {
  const out: ChargeConfig = { currency: { ...charge.currency }, usdRate: { ...charge.usdRate } };
  const sources: Record<string, string> = { stripe: 'USD' };
  for (const p of ['paystack', 'flutterwave'] as const) {
    const r = await usdRate(out.currency[p], !isTestKey(p), charge.usdRate[p]);
    out.usdRate[p] = r.rate;
    sources[p] = r.source;
  }
  return { config: out, sources };
}

// ── Sanctions screening ─────────────────────────────────────────────────

export async function screenName(
  name: string | null, subjectType: 'donor' | 'church' | 'payout_account', subjectRef: string, live: boolean,
): Promise<'clear' | 'review' | 'blocked'> {
  const tokens = nameTokens(name ?? '');
  if (!tokens.length) return 'clear';
  const { count } = await db.from('sanctions_entries').select('id', { count: 'exact', head: true });
  if (!count) {
    // Lists never loaded: live gifts wait for a person; test gifts pass.
    if (!live) return 'clear';
    await db.from('screening_results').insert({
      subject_type: subjectType, subject_ref: subjectRef, name: name!, score: 0, decision: 'review',
      review_note: 'sanctions lists not loaded',
    });
    return 'review';
  }
  const { data } = await db.from('sanctions_entries').select('name, list, tokens').overlaps('tokens', tokens).limit(500);
  let best = { score: 0, name: '', list: '' };
  for (const e of data ?? []) {
    const s = nameScore(tokens, e.tokens as string[]);
    if (s > best.score) best = { score: s, name: e.name, list: e.list };
  }
  const decision = decisionFor(best.score, tokens.length);
  if (decision !== 'clear') {
    await db.from('screening_results').insert({
      subject_type: subjectType, subject_ref: subjectRef, name: name!, score: best.score,
      matched_name: best.name, matched_list: best.list, decision,
    });
  }
  return decision;
}
