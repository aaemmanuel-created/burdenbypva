// POST /momo-charge — "approve on your phone". Same body as create-gift plus
// { phone, network }. Records the gift, asks Paystack to send a mobile money
// prompt to the donor's phone, and returns what to show next:
//   approve — the prompt is on its way; the donor enters their PIN on the phone
//   otp     — the network sent a code first (POST it to /momo-otp)
//   paid    — already went through
// The gift's timeline then moves exactly like a hosted-checkout gift.

import { parseGiftInput } from '../_shared/gift-input.ts';
import { chargeMomo, MOMO_NETWORKS, type MomoNetwork, normaliseGhanaPhone } from '../_shared/momo.ts';
import { ProviderError } from '../_shared/providers.ts';
import {
  ALLOWED_RETURN_PREFIXES, charge, db, insertGift, isTestKey, json, LIVE_ALLOWED, preflight, secrets, verifyAndApply,
} from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const body = await req.json().catch(() => null);
  const parsed = parseGiftInput({ ...(body ?? {}), provider: 'paystack' }, charge, ALLOWED_RETURN_PREFIXES);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const phone = normaliseGhanaPhone(body?.phone);
  if (!phone) return json({ error: 'Enter your mobile money number, e.g. 024 123 4567.' }, 400);
  const network = body?.network as MomoNetwork;
  if (!MOMO_NETWORKS.includes(network)) return json({ error: 'Choose your mobile money network.' }, 400);

  const testMode = isTestKey('paystack');
  if (!testMode && !LIVE_ALLOWED) return json({ error: 'Live payments are not switched on yet.' }, 503);

  let created;
  try {
    created = await insertGift(parsed.value, testMode, {
      momo_phone: phone, momo_network: network, payment_method: 'mobile_money',
    });
  } catch (e) {
    console.error('momo gift not recorded', e);
    return json({ error: 'Could not record your gift. Please try again.' }, 500);
  }
  const { gift, token, plan } = created;

  try {
    const next = await chargeMomo(gift, phone, network, secrets);
    if (next.state === 'paid') await verifyAndApply(gift, 'momo');
    if (next.state === 'failed') {
      await db.rpc('transition_gift', { p_gift_id: gift.id, p_to: 'failed', p_note: next.message });
    }
    return json({ giftId: gift.id, token, testMode, planId: plan?.planId, planToken: plan?.planToken, ...next });
  } catch (e) {
    console.error('momo charge failed', e);
    await db.rpc('transition_gift', {
      p_gift_id: gift.id, p_to: 'failed', p_note: 'The prompt could not be sent. Nothing was charged.',
    });
    const message = e instanceof ProviderError ? 'Mobile money is unavailable right now. Please try another method.'
      : 'The prompt could not be sent. Please try again.';
    return json({ error: message }, 502);
  }
});
