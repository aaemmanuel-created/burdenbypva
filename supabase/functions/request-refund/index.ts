// POST /request-refund { gift, t } — the 7-day refund promised on every
// gift's timeline. The donor asks from the gift page with their private
// token; the provider refunds the full amount charged (fee included).
// After payout, BURDEN refunds from its own balance and recovers it from the
// church's next payout.

import { refundBlocker } from '../_shared/duties-logic.ts';
import { ProviderError, refundPayment } from '../_shared/providers.ts';
import { db, json, loadGiftWithToken, preflight, secrets } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const body = await req.json().catch(() => ({}));
  const gift = await loadGiftWithToken(String(body.gift ?? ''), String(body.t ?? ''));
  if (!gift) return json({ error: 'Gift not found.' }, 404);
  const blocker = refundBlocker({ status: gift.status, created_at: gift.created_at as string });
  if (blocker) return json({ error: blocker }, 409);

  try {
    const ref = await refundPayment(gift, secrets);
    const afterPayout = gift.status === 'paid_out';
    await db.rpc('transition_gift', {
      p_gift_id: gift.id, p_to: 'refunded', p_source: 'donor', p_patch: { refund_ref: ref },
      p_note: 'Refunded in full to the way you paid. It can take 5–10 working days to arrive' +
        (gift.test_mode ? ' · Test refund, no real money.' : '.') +
        (afterPayout ? ' BURDEN covered it, as the church had already been paid.' : ''),
    });
    return json({ ok: true });
  } catch (e) {
    console.error('refund failed', gift.id, e);
    const message = e instanceof ProviderError && /BURDEN/.test(e.message) ? e.message
      : 'The refund could not be started. Please try again, or contact BURDEN.';
    return json({ error: message }, 502);
  }
});
