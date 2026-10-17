// GET /gift-status?gift=<id>&t=<token> — the donor's view of one gift and
// its timeline. While a payment is still unconfirmed it asks the provider
// directly, so the timeline moves even if a webhook is slow or missing.

import { db, json, loadGiftWithToken, preflight, verifyAndApply } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  const url = new URL(req.url);
  let gift = await loadGiftWithToken(url.searchParams.get('gift'), url.searchParams.get('t'));
  if (!gift) return json({ error: 'Gift not found.' }, 404);

  await db.rpc('settle_due_test_gifts');
  if (gift.status === 'initiated') {
    try {
      await verifyAndApply(gift, 'status-check');
    } catch (e) {
      console.error('verify failed', e); // Show the current state; the webhook will catch up.
    }
  }
  gift = await loadGiftWithToken(url.searchParams.get('gift'), url.searchParams.get('t'));

  const { data: events, error } = await db
    .from('gift_events')
    .select('step, occurred_at, note')
    .eq('gift_id', gift!.id)
    .order('occurred_at')
    .order('id');
  if (error) return json({ error: 'Could not load the timeline.' }, 500);

  const g = gift!;
  return json({
    gift: {
      id: g.id,
      status: g.status,
      statusNote: g.status_note,
      holdUntil: g.hold_until,
      provider: g.provider,
      paymentMethod: g.payment_method,
      testMode: g.test_mode,
      campaignId: g.campaign_id,
      campaignTitle: g.campaign_title,
      churchName: g.church_name,
      amount: (g.amount_minor as number) / 100,
      coveredFee: (g.fee_minor as number) / 100,
      total: (g.total_minor as number) / 100,
      recurring: g.recurring,
      anonymous: g.anonymous,
      timestamp: g.created_at,
    },
    events,
  });
});
