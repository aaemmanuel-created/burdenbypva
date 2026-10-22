// POST /create-gift — records the gift ("Burden shared" on the timeline) and
// returns the provider's hosted checkout URL for the donor to pay on.

import { parseGiftInput } from '../_shared/gift-input.ts';
import { createCheckout, ProviderError } from '../_shared/providers.ts';
import {
  ALLOWED_RETURN_PREFIXES, charge, db, functionUrl, insertGift, isTestKey, json, LIVE_ALLOWED, preflight, secrets,
} from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const parsed = parseGiftInput(await req.json().catch(() => null), charge, ALLOWED_RETURN_PREFIXES);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const input = parsed.value;

  const testMode = isTestKey(input.provider);
  if (!testMode && !LIVE_ALLOWED) {
    return json({ error: 'Live payments are not switched on yet.' }, 503);
  }

  let created;
  try {
    created = await insertGift(input, testMode);
  } catch (e) {
    console.error('create_gift failed', e);
    return json({ error: 'Could not record your gift. Please try again.' }, 500);
  }
  const { gift, token, plan } = created;
  const returnUrl = `${functionUrl('checkout-return')}?gift=${gift.id}&t=${token}`;
  try {
    const { checkoutUrl, providerRef } = await createCheckout(gift, returnUrl, secrets);
    await db.from('gifts').update({ provider_ref: providerRef }).eq('id', gift.id);
    // planId + planToken let the donor stop a monthly gift later.
    return json({ giftId: gift.id, token, checkoutUrl, testMode, planId: plan?.planId, planToken: plan?.planToken });
  } catch (e) {
    console.error('createCheckout failed', e);
    await db.rpc('transition_gift', {
      p_gift_id: gift.id, p_to: 'failed', p_note: 'Checkout could not be opened. Nothing was charged.',
    });
    const message = e instanceof ProviderError ? 'This payment method is unavailable right now. Please try another.'
      : 'Checkout could not be opened. Please try again.';
    return json({ error: message }, 502);
  }
});
