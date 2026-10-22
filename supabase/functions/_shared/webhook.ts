// One handler for all three providers' webhooks.
//  - Stripe sends the whole checkout session, so we read the outcome off it.
//  - Paystack and Flutterwave events are only a hint: we re-ask their API
//    before believing a payment happened (Flutterwave's docs require this).

import { parseWebhook, stripeWebhookVerification } from './providers.ts';
import type { Provider } from './gift-input.ts';
import { applyVerification, loadGift, secrets, verifyAndApply } from './server.ts';
import { recordStripeCycle } from './plans.ts';

export async function handleWebhook(provider: Provider, req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Use POST.', { status: 405 });
  const raw = await req.text();

  let event;
  try {
    event = await parseWebhook(provider, raw, req.headers, secrets, Math.floor(Date.now() / 1000));
  } catch (e) {
    console.error(`${provider} webhook rejected`, e);
    return new Response('Not configured.', { status: 500 });
  }
  if (!event.valid) return new Response('Bad signature.', { status: 401 });

  // A later month of a Stripe monthly gift: Stripe charged it itself.
  if (event.stripeCycle) {
    try {
      await recordStripeCycle(event.stripeCycle);
    } catch (e) {
      console.error('stripe monthly gift not recorded', e);
      return new Response('Retry later.', { status: 500 });
    }
    return new Response('ok', { status: 200 });
  }

  // Events for things that aren't BURDEN gifts: acknowledge and ignore.
  const gift = event.giftId ? await loadGift(event.giftId) : null;
  if (!gift || gift.provider !== provider) return new Response('ignored', { status: 200 });

  try {
    if (provider === 'stripe') {
      await applyVerification(gift, stripeWebhookVerification(gift, event.stripeType!, event.stripeSession!), 'webhook');
    } else {
      await verifyAndApply(gift, 'webhook');
    }
  } catch (e) {
    console.error(`${provider} webhook processing failed`, e);
    return new Response('Retry later.', { status: 500 }); // Provider will retry.
  }
  return new Response('ok', { status: 200 });
}
