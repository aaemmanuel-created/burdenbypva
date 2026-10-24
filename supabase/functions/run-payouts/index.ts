// POST /run-payouts — after the hold, sends each live Paystack gift to its
// church's verified MoMo wallet or bank account (Paystack Transfers), and
// moves the timeline to "Paid to church". Called by a Supabase cron job with
// the CRON_SECRET header. Does nothing unless PAYOUTS_LIVE=true is set on
// purpose — test gifts keep their simulated payout (settle_due_test_gifts).

import { timingSafeEqual } from '../_shared/crypto.ts';
import { payoutAmountMinor, payoutBlocker, payoutLabel, type PayoutAccount } from '../_shared/payout-logic.ts';
import { paystackTransfer } from '../_shared/providers.ts';
import { db, json, secrets } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || !timingSafeEqual(req.headers.get('x-burden-cron') ?? '', secret)) {
    return json({ error: 'Not allowed.' }, 401);
  }
  if (Deno.env.get('PAYOUTS_LIVE') !== 'true') return json({ skipped: 'PAYOUTS_LIVE is not true' });

  const { data: gifts, error } = await db.from('gifts').select('*')
    .eq('status', 'held').eq('test_mode', false).is('payout_ref', null)
    .lte('hold_until', new Date().toISOString()).limit(100);
  if (error) return json({ error: 'Could not load gifts.' }, 500);

  const results: { gift: string; result: string }[] = [];
  for (const g of gifts ?? []) {
    const { data: account } = await db.from('church_payout_accounts').select('*')
      .eq('church_id', g.church_id).maybeSingle();
    // A church the BURDEN team suspended (admin console) is paid nothing until it is restored.
    const { data: tier } = await db.from('church_tiers').select('tier').eq('church_id', g.church_id).maybeSingle();
    if (tier?.tier === 'Suspended') { results.push({ gift: g.id, result: 'waiting: church suspended' }); continue; }
    const blocker = payoutBlocker(g, account as PayoutAccount | null);
    if (blocker) { results.push({ gift: g.id, result: `waiting: ${blocker}` }); continue; }
    const a = account as PayoutAccount;
    try {
      const t = await paystackTransfer(secrets, {
        amountMinor: payoutAmountMinor(g), currency: a.currency, recipient: a.paystack_recipient!,
        reference: g.id, reason: `BURDEN — ${g.campaign_title}`,
      });
      const to = payoutLabel(a);
      await db.from('gifts').update({ payout_ref: t.transferCode, payout_to: to }).eq('id', g.id);
      await db.rpc('transition_gift', {
        p_gift_id: g.id, p_to: 'paid_out',
        p_note: `Sent to ${g.church_name}'s ${to}.`, p_source: 'payout',
      });
      results.push({ gift: g.id, result: t.status });
    } catch (e) {
      console.error('payout failed', g.id, e);
      results.push({ gift: g.id, result: 'failed — will retry' });
    }
  }
  return json({ results });
});
