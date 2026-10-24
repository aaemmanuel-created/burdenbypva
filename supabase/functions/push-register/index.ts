// POST /push-register { token, gifts: [{ id, t }] } — a phone that allowed
// notifications links its Expo push token to the gifts it follows (each
// proven with that gift's private token). Pushes then arrive for those gifts
// and for updates on their burdens.

import { json, loadGiftWithToken, preflight, db } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  const b = await req.json().catch(() => ({}));
  const token = String(b.token ?? '');
  if (!/^ExponentPushToken\[[^\]]{10,}\]$/.test(token)) return json({ error: 'Not an Expo push token.' }, 400);
  const gifts: { id: string; t: string }[] = Array.isArray(b.gifts) ? b.gifts.slice(0, 200) : [];
  let linked = 0;
  for (const g of gifts) {
    const gift = await loadGiftWithToken(String(g.id ?? ''), String(g.t ?? ''));
    if (!gift) continue;
    await db.from('push_tokens').upsert({ token, gift_id: gift.id });
    linked++;
  }
  return json({ linked });
});
