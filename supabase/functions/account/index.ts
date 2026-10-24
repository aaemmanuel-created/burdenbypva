// A giver's account. Givers sign in with a one-time code by email (Supabase
// Auth) and send their access token as Authorization: Bearer <token>.
//
//   GET  /account                        → my gifts (every device) and my fundraisers
//   POST /account { action, … }
//        claim      { gifts: [{ id, token }] }          — add gifts made on this device before signing in
//        fundraise  { campaignId, name, note, goal }    — start a fundraiser (returns it)
//        close      { fundraiser }                      — close my fundraiser (gifts already given stay)
//        delete                                          — delete my account (gifts stay on record, unlinked)
//
// Gifts made with the account's email are linked on every GET — the email
// was proved by the sign-in code.

import { fundraiserId, giverGift, type GiverGiftRow, parseFundraiser, publicFundraiser, raisedBy } from '../_shared/account-logic.ts';
import { audit, signedInUser } from '../_shared/auth.ts';
import { BURDENS } from '../_shared/burdens.ts';
import { db, json, loadGiftWithToken, preflight } from '../_shared/server.ts';

const GIFT_COLUMNS = 'id, status, status_note, hold_until, provider, payment_method, test_mode, campaign_id, campaign_title, ' +
  'church_name, amount_minor, fee_minor, total_minor, recurring, anonymous, created_at, payout_to, fundraiser_id, donor_name';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const user = await signedInUser(req);
  if (!user) return json({ error: 'Please sign in.' }, 401);

  if (req.method === 'GET') {
    await db.from('gifts').update({ donor_user_id: user.id }).ilike('donor_email', user.email).is('donor_user_id', null);
    const { data: rows } = await db.from('gifts').select(GIFT_COLUMNS)
      .eq('donor_user_id', user.id).neq('status', 'initiated').order('created_at').limit(1000);
    const gifts = (rows ?? []) as unknown as GiverGiftRow[];
    const { data: events } = gifts.length
      ? await db.from('gift_events').select('gift_id, step, occurred_at, note').in('gift_id', gifts.map((g) => g.id)).order('occurred_at').order('id')
      : { data: [] };
    const byGift = new Map<string, { step: string; occurred_at: string; note: string | null }[]>();
    for (const e of events ?? []) byGift.set(e.gift_id, [...(byGift.get(e.gift_id) ?? []), { step: e.step, occurred_at: e.occurred_at, note: e.note }]);

    const { data: mine } = await db.from('fundraisers').select('id, created_at, campaign_id, name, note, goal_minor, status')
      .eq('owner_user_id', user.id).neq('status', 'hidden').order('created_at', { ascending: false });
    const ids = (mine ?? []).map((f) => f.id);
    const { data: through } = ids.length
      ? await db.from('gifts').select('fundraiser_id, status, amount_minor').in('fundraiser_id', ids)
      : { data: [] };
    const raised = raisedBy(through ?? []);
    return json({
      email: user.email,
      gifts: gifts.map((g) => giverGift(g, byGift.get(g.id) ?? [])),
      fundraisers: (mine ?? []).map((f) => publicFundraiser(f, raised[f.id] ?? 0, true)),
    });
  }

  if (req.method !== 'POST') return json({ error: 'Use GET or POST.' }, 405);
  const b = await req.json().catch(() => ({})) as Record<string, unknown>;

  switch (b.action) {
    case 'claim': {
      // Proof is the per-gift token the device kept since checkout.
      const list = Array.isArray(b.gifts) ? (b.gifts as { id?: string; token?: string }[]).slice(0, 200) : [];
      let claimed = 0;
      for (const item of list) {
        const gift = await loadGiftWithToken(String(item.id ?? ''), String(item.token ?? ''));
        if (!gift || (gift.donor_user_id && gift.donor_user_id !== user.id)) continue;
        await db.from('gifts').update({ donor_user_id: user.id }).eq('id', gift.id);
        claimed++;
      }
      return json({ ok: true, claimed });
    }

    case 'fundraise': {
      const f = parseFundraiser(b);
      if (!f.ok) return json({ error: f.error }, 400);
      if (!BURDENS.some((x) => x.id === f.value.campaign_id)) return json({ error: 'That burden is not open.' }, 404);
      const { count } = await db.from('fundraisers').select('id', { count: 'exact', head: true })
        .eq('owner_user_id', user.id).eq('status', 'open');
      if ((count ?? 0) >= 10) return json({ error: 'You have 10 open fundraisers. Close one to start another.' }, 409);
      const row = { id: fundraiserId(crypto.getRandomValues(new Uint8Array(12))), owner_user_id: user.id, ...f.value };
      const { data, error } = await db.from('fundraisers').insert(row).select('id, created_at, campaign_id, name, note, goal_minor, status').single();
      if (error) return json({ error: 'Could not start the fundraiser.' }, 500);
      await audit(user.email, 'fundraiser.start', 'fundraiser', row.id, { campaign: row.campaign_id });
      return json({ ok: true, fundraiser: publicFundraiser(data, 0, true) });
    }

    case 'close': {
      const { data } = await db.from('fundraisers').update({ status: 'closed', status_note: 'Closed by its organiser.' })
        .eq('id', String(b.fundraiser ?? '')).eq('owner_user_id', user.id).eq('status', 'open').select('id');
      if (!data?.length) return json({ error: 'Fundraiser not found.' }, 404);
      await audit(user.email, 'fundraiser.close', 'fundraiser', data[0].id);
      return json({ ok: true });
    }

    case 'delete': {
      // Gifts are financial records (receipts, Gift Aid, refunds) and stay,
      // unlinked from the account; open fundraisers close.
      await db.from('fundraisers').update({ status: 'closed', status_note: 'The organiser deleted their account.' })
        .eq('owner_user_id', user.id).eq('status', 'open');
      await db.from('gifts').update({ donor_user_id: null }).eq('donor_user_id', user.id);
      await audit('giver', 'account.delete', 'user', user.id);
      const { error } = await db.auth.admin.deleteUser(user.id);
      if (error) return json({ error: 'Could not delete the account. Please write to the BURDEN team.' }, 500);
      return json({ ok: true });
    }

    default:
      return json({ error: 'Unknown action.' }, 400);
  }
});
