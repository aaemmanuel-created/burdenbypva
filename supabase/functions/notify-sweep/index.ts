// POST /notify-sweep — every few minutes from a Supabase cron job (CRON_SECRET).
// Tells givers what happened, by email and by phone push:
//   • "Your gift reached <church>" when a gift is paid out
//   • "<church> confirmed your gift" when the church confirms
//   • "New update" when a church posts on a burden — email only to givers who
//     opted in at the Give screen; push to phones following that burden
// Each event is sent once (notifications_sent / burden_updates.notified_at).
// Web: no browser push yet — the gift page shows the same steps.

import { BURDENS } from '../_shared/burdens.ts';
import { giftEventMessage, updateMessage } from '../_shared/church-logic.ts';
import { hmacHex, timingSafeEqual } from '../_shared/crypto.ts';
import { isPlaceholderEmail } from '../_shared/duties-logic.ts';
import { sendEmail } from '../_shared/duties.ts';
import { db, functionUrl, json } from '../_shared/server.ts';

type Push = { to: string; title: string; body: string; data: Record<string, string> };

async function sendPushes(msgs: Push[]) {
  for (let i = 0; i < msgs.length; i += 100) {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(msgs.slice(i, i + 100).map((m) => ({ ...m, sound: 'default' }))),
    });
    if (!res.ok) console.error('Expo push rejected', res.status);
  }
}

async function tokensFor(giftIds: string[]): Promise<{ token: string; gift_id: string }[]> {
  if (!giftIds.length) return [];
  const { data } = await db.from('push_tokens').select('token, gift_id').in('gift_id', giftIds);
  return data ?? [];
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || !timingSafeEqual(req.headers.get('x-burden-cron') ?? '', secret)) {
    return json({ error: 'Not allowed.' }, 401);
  }
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  let giftNotices = 0, updateNotices = 0;

  // ── Gift events ──
  const { data: events } = await db.from('gift_events').select('gift_id, step, note, occurred_at')
    .in('step', ['paid_out', 'church_confirmed']).gte('occurred_at', since).limit(500);
  const ids = [...new Set((events ?? []).map((e: { gift_id: string }) => e.gift_id))];
  const { data: sent } = ids.length
    ? await db.from('notifications_sent').select('gift_id, step').in('gift_id', ids) : { data: [] };
  const done = new Set((sent ?? []).map((s: { gift_id: string; step: string }) => `${s.gift_id}:${s.step}`));
  const pushes: Push[] = [];
  for (const e of events ?? []) {
    if (done.has(`${e.gift_id}:${e.step}`)) continue;
    const { data: g } = await db.from('gifts').select('id, donor_email, church_name, campaign_title, amount_minor, test_mode')
      .eq('id', e.gift_id).maybeSingle();
    if (!g) continue;
    const msg = giftEventMessage(e.step, g, e.note);
    if (!msg) continue;
    if (!isPlaceholderEmail(g.donor_email)) await sendEmail(g.donor_email, msg.title, `${msg.body}\n\nBURDEN by HOUSEPVA`);
    for (const t of await tokensFor([g.id])) pushes.push({ to: t.token, ...msg, data: { giftId: g.id } });
    await db.from('notifications_sent').insert({ gift_id: g.id, step: e.step });
    giftNotices++;
  }

  // ── New updates ──
  const { data: updates } = await db.from('burden_updates').select('id, campaign_id, author, title, body')
    .is('notified_at', null).is('hidden_at', null).limit(20);
  for (const u of updates ?? []) {
    const title = BURDENS.find((b) => b.id === u.campaign_id)?.title ?? 'a burden you gave to';
    const msg = updateMessage(u, title);
    const { data: givers } = await db.from('gifts').select('id, donor_email, notify_updates')
      .eq('campaign_id', u.campaign_id).in('status', ['held', 'paid_out', 'church_confirmed']);
    const emails = new Set<string>();
    for (const g of givers ?? []) {
      if (g.notify_updates && !isPlaceholderEmail(g.donor_email)) emails.add(String(g.donor_email).toLowerCase());
    }
    const unsubSecret = Deno.env.get('UNSUBSCRIBE_SECRET') ?? secret;
    for (const email of emails) {
      const link = `${functionUrl('unsubscribe')}?e=${encodeURIComponent(email)}&s=${await hmacHex('SHA-256', unsubSecret, email)}`;
      await sendEmail(email, msg.title, `${u.title}\n\n${u.body}\n\n— ${u.author}\n\nStop update emails: ${link}`);
    }
    const seen = new Set<string>();
    for (const t of await tokensFor((givers ?? []).map((g: { id: string }) => g.id))) {
      if (seen.has(t.token)) continue;
      seen.add(t.token);
      pushes.push({ to: t.token, ...msg, data: { campaignId: u.campaign_id } });
    }
    await db.from('burden_updates').update({ notified_at: new Date().toISOString() }).eq('id', u.id);
    updateNotices++;
  }

  await sendPushes(pushes);
  return json({ giftNotices, updateNotices, pushes: pushes.length });
});
