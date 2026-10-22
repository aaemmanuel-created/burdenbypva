// POST /church-payout-account — a BURDEN reviewer records where a church is
// paid: a MoMo wallet (MTN / Telecel / AirtelTigo) or a bank account. Guarded
// by CHURCH_ADMIN_KEY (x-burden-admin-key) until a church portal exists.
// Body: { church_id, method: 'momo'|'bank', network, account_name,
//         account_number, currency?, bank_code? (banks only), verified: true }
// The account is registered with Paystack as a transfer recipient; payouts
// only use accounts a reviewer has marked verified.

import { timingSafeEqual } from '../_shared/crypto.ts';
import { momoCode, MOMO_NETWORKS, type MomoNetwork, normaliseGhanaPhone } from '../_shared/momo.ts';
import { payoutLabel } from '../_shared/payout-logic.ts';
import { createPaystackRecipient } from '../_shared/providers.ts';
import { db, json, preflight, secrets } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  const adminKey = Deno.env.get('CHURCH_ADMIN_KEY');
  if (!adminKey || !timingSafeEqual(req.headers.get('x-burden-admin-key') ?? '', adminKey)) {
    return json({ error: 'Not allowed.' }, 401);
  }

  const b = await req.json().catch(() => ({}));
  const churchId = String(b.church_id ?? '').trim();
  const name = String(b.account_name ?? '').trim();
  const currency = String(b.currency ?? 'GHS').toUpperCase();
  if (!churchId || !name) return json({ error: 'church_id and account_name are required.' }, 400);

  let accountNumber: string, bankCode: string, network: string;
  if (b.method === 'momo') {
    if (!MOMO_NETWORKS.includes(b.network)) return json({ error: 'network must be mtn, telecel or airteltigo.' }, 400);
    const phone = normaliseGhanaPhone(b.account_number);
    if (!phone) return json({ error: 'account_number must be a Ghana mobile money number.' }, 400);
    accountNumber = phone;
    network = b.network;
    bankCode = await momoCode(b.network as MomoNetwork, currency, secrets);
  } else if (b.method === 'bank') {
    accountNumber = String(b.account_number ?? '').replace(/\s/g, '');
    bankCode = String(b.bank_code ?? '');
    network = String(b.network ?? 'bank');
    if (!accountNumber || !bankCode) return json({ error: 'Bank accounts need account_number and bank_code.' }, 400);
  } else {
    return json({ error: "method must be 'momo' or 'bank'." }, 400);
  }

  try {
    const recipient = await createPaystackRecipient(secrets, {
      type: b.method === 'momo' ? 'mobile_money' : 'ghipss', name, accountNumber, bankCode, currency,
    });
    const { error } = await db.from('church_payout_accounts').upsert({
      church_id: churchId, method: b.method, network, account_name: name, account_number: accountNumber,
      currency, paystack_recipient: recipient,
      verified_at: b.verified === true ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return json({ ok: true, payoutTo: payoutLabel({ method: b.method, network, account_number: accountNumber }) });
  } catch (e) {
    console.error('payout account failed', e);
    return json({ error: 'Could not register this account with Paystack. Check the details.' }, 502);
  }
});
