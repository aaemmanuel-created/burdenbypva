// POST /church-confirm { gift, note } — the last timeline step: the church
// confirms the money arrived. There is no church admin portal yet, so this
// is guarded by a shared CHURCH_ADMIN_KEY sent as x-burden-admin-key.

import { timingSafeEqual } from '../_shared/crypto.ts';
import { db, json, loadGift, preflight } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const adminKey = Deno.env.get('CHURCH_ADMIN_KEY');
  if (!adminKey || !timingSafeEqual(req.headers.get('x-burden-admin-key') ?? '', adminKey)) {
    return json({ error: 'Not allowed.' }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const gift = await loadGift(String(body.gift ?? ''));
  if (!gift) return json({ error: 'Gift not found.' }, 404);

  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 500)
    : `${gift.church_name} confirmed the funds arrived.`;
  const { data, error } = await db.rpc('transition_gift', {
    p_gift_id: gift.id, p_to: 'church_confirmed', p_note: note, p_source: 'church',
  });
  if (error) return json({ error: 'Could not record the confirmation.' }, 500);
  if (!data) return json({ error: `Gift is "${gift.status}" — only paid-out gifts can be confirmed.` }, 409);
  return json({ ok: true });
});
