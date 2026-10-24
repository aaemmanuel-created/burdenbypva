// The church dashboard's server. Church staff sign in with Supabase Auth (a
// one-time code by email) and send their access token as Authorization:
// Bearer <token>. What they may do is decided by church_members, by email.
//
//   GET  /church                      → my churches: gifts, totals, updates, payout account, team
//   POST /church { action, churchId, … }
//        confirm  { gift, note }                       — "the money arrived"
//        update   { campaignId, title, body }          — post an update on a burden
//        payout   { method, network, accountName, accountNumber, bankCode? } — submit for verification
//        invite   { email, displayName, roleTitle, role }   (church admins)
//        remove   { email }                                  (church admins)
//
// A BURDEN reviewer adds a church's first admin with the CHURCH_ADMIN_KEY
// header (x-burden-admin-key) and action "invite".

import { timingSafeEqual } from '../_shared/crypto.ts';
import {
  burdensOf, churchView, type GiftForChurch, maskAccount, type Member, ownsBurden, parseInvite, parseUpdate, totals,
} from '../_shared/church-logic.ts';
import { screenName } from '../_shared/duties.ts';
import { momoCode, MOMO_NETWORKS, type MomoNetwork, normaliseGhanaPhone } from '../_shared/momo.ts';
import { payoutLabel } from '../_shared/payout-logic.ts';
import { createPaystackRecipient } from '../_shared/providers.ts';
import { db, json, loadGift, preflight, secrets } from '../_shared/server.ts';

async function signedInEmail(req: Request): Promise<string | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user?.email) return null;
  return String(data.user.email).toLowerCase();
}

async function membershipsOf(email: string): Promise<Member[]> {
  const { data } = await db.from('church_members').select('church_id, email, display_name, role_title, role')
    .eq('email', email).is('removed_at', null);
  return (data ?? []) as Member[];
}

const isAdminKey = (req: Request) => {
  const key = Deno.env.get('CHURCH_ADMIN_KEY');
  return !!key && timingSafeEqual(req.headers.get('x-burden-admin-key') ?? '', key);
};

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  const staffKey = isAdminKey(req);
  const email = staffKey ? null : await signedInEmail(req);
  if (!staffKey && !email) return json({ error: 'Please sign in.' }, 401);
  const members = email ? await membershipsOf(email) : [];
  if (!staffKey && !members.length) {
    return json({ error: 'This email is not linked to a church on BURDEN. Ask your church admin to add you.' }, 403);
  }

  // ── Read: everything the dashboard shows ──
  if (req.method === 'GET') {
    const churches = [];
    for (const m of members) {
      const { data: gifts } = await db.from('gifts')
        .select('id, created_at, campaign_id, status, amount_minor, charge_currency, charge_amount_minor, fx_rate, anonymous, donor_name, recurring, test_mode, payout_to')
        .eq('church_id', m.church_id).in('status', ['held', 'paid_out', 'church_confirmed', 'refunded'])
        .order('created_at', { ascending: false }).limit(500);
      const { data: updates } = await db.from('burden_updates').select('id, created_at, campaign_id, author, role_title, title, body')
        .eq('church_id', m.church_id).is('hidden_at', null).order('created_at', { ascending: false }).limit(50);
      const { data: account } = await db.from('church_payout_accounts').select('method, network, account_name, account_number, verified_at, submitted_by')
        .eq('church_id', m.church_id).maybeSingle();
      const { data: team } = await db.from('church_members').select('email, display_name, role_title, role')
        .eq('church_id', m.church_id).is('removed_at', null).order('invited_at');
      const list = (gifts ?? []) as GiftForChurch[];
      churches.push({
        churchId: m.church_id,
        me: { name: m.display_name, roleTitle: m.role_title, role: m.role },
        burdens: burdensOf(m.church_id).map((b) => ({ id: b.id, title: b.title })),
        totals: totals(list),
        gifts: list.map(churchView),
        updates: updates ?? [],
        payout: account ? {
          method: account.method, network: account.network, accountName: account.account_name,
          account: maskAccount(account.account_number), verified: !!account.verified_at, submittedBy: account.submitted_by,
        } : null,
        team: m.role === 'admin' ? team ?? [] : (team ?? []).map((t: { display_name: string; role_title: string }) => ({ display_name: t.display_name, role_title: t.role_title })),
      });
    }
    return json({ email, churches });
  }

  if (req.method !== 'POST') return json({ error: 'Use GET or POST.' }, 405);
  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const churchId = String(b.churchId ?? '');
  const me = members.find((m) => m.church_id === churchId);
  if (!staffKey && !me) return json({ error: 'You are not on this church’s team.' }, 403);
  const actor = me ? `${me.display_name} <${me.email}>` : 'BURDEN reviewer';

  switch (b.action) {
    case 'confirm': {
      const gift = await loadGift(String(b.gift ?? ''));
      if (!gift || gift.church_id !== churchId) return json({ error: 'Gift not found.' }, 404);
      const note = typeof b.note === 'string' && b.note.trim() ? b.note.trim().slice(0, 500)
        : `${gift.church_name} confirmed the funds arrived.`;
      const { data, error } = await db.rpc('transition_gift', {
        p_gift_id: gift.id, p_to: 'church_confirmed', p_note: note, p_source: `church:${me?.email ?? 'staff'}`,
      });
      if (error) return json({ error: 'Could not record the confirmation.' }, 500);
      if (!data) return json({ error: 'Only gifts that have been paid out can be confirmed.' }, 409);
      return json({ ok: true });
    }

    case 'update': {
      const campaignId = String(b.campaignId ?? '');
      if (!ownsBurden(churchId, campaignId)) return json({ error: 'That burden is not one of your church’s.' }, 403);
      const u = parseUpdate(b);
      if (!u.ok) return json({ error: u.error }, 400);
      const { error } = await db.from('burden_updates').insert({
        campaign_id: campaignId, church_id: churchId, title: u.title, body: u.body,
        author: me?.display_name ?? 'BURDEN', role_title: me?.role_title ?? '',
      });
      if (error) return json({ error: 'Could not post the update.' }, 500);
      return json({ ok: true }); // givers who asked are emailed by notify-sweep
    }

    case 'payout': {
      // The church submits; a BURDEN reviewer verifies (church-payout-account with verified: true).
      const method = b.method === 'bank' ? 'bank' : 'momo';
      const name = String(b.accountName ?? '').trim();
      if (!name) return json({ error: 'Enter the account name exactly as the bank or network has it.' }, 400);
      let accountNumber: string, bankCode: string, network: string;
      if (method === 'momo') {
        if (!MOMO_NETWORKS.includes(b.network as MomoNetwork)) return json({ error: 'Choose MTN, Telecel or AirtelTigo.' }, 400);
        const phone = normaliseGhanaPhone(b.accountNumber);
        if (!phone) return json({ error: 'Enter the church’s MoMo number, e.g. 024 123 4567.' }, 400);
        accountNumber = phone; network = String(b.network);
        bankCode = await momoCode(network as MomoNetwork, 'GHS', secrets);
      } else {
        accountNumber = String(b.accountNumber ?? '').replace(/\s/g, '');
        bankCode = String(b.bankCode ?? ''); network = String(b.network ?? 'bank');
        if (!accountNumber || !bankCode) return json({ error: 'Enter the account number and choose the bank.' }, 400);
      }
      const screening = await screenName(name, 'payout_account', churchId, true);
      if (screening === 'blocked') return json({ error: 'This account cannot be registered. The BURDEN team will be in touch.' }, 403);
      try {
        const recipient = await createPaystackRecipient(secrets, {
          type: method === 'momo' ? 'mobile_money' : 'ghipss', name, accountNumber, bankCode, currency: 'GHS',
        });
        await db.from('church_payout_accounts').upsert({
          church_id: churchId, method, network, account_name: name, account_number: accountNumber, currency: 'GHS',
          paystack_recipient: recipient, verified_at: null, submitted_by: actor, updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('church payout submit failed', e);
        return json({ error: 'Paystack could not check this account. Please check the details.' }, 502);
      }
      return json({ ok: true, payoutTo: payoutLabel({ method, network, account_number: accountNumber }), verified: false });
    }

    case 'invite':
    case 'remove': {
      if (!staffKey && me?.role !== 'admin') return json({ error: 'Only a church admin can change the team.' }, 403);
      if (b.action === 'remove') {
        const target = String(b.email ?? '').toLowerCase();
        if (target === me?.email) return json({ error: 'You cannot remove yourself.' }, 400);
        await db.from('church_members').update({ removed_at: new Date().toISOString() })
          .eq('church_id', churchId).eq('email', target);
        return json({ ok: true });
      }
      const inv = parseInvite(b);
      if (!inv.ok) return json({ error: inv.error }, 400);
      const { error } = await db.from('church_members').upsert({
        church_id: churchId, email: inv.email, display_name: inv.display_name, role_title: inv.role_title,
        role: inv.role, invited_by: actor, removed_at: null,
      }, { onConflict: 'church_id,email' });
      if (error) return json({ error: 'Could not add them.' }, 500);
      return json({ ok: true }); // they sign in with their own email; no password to share
    }

    default:
      return json({ error: 'Unknown action.' }, 400);
  }
});
