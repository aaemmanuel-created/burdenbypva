// The human end of the review queue. Guarded by CHURCH_ADMIN_KEY
// (x-burden-admin-key) until BURDEN has an admin portal.
//   GET  /moderation-queue                         → held messages, oldest first, with reasons
//   POST /moderation-queue { id, decision, reviewer } → approve or reject one

import { timingSafeEqual } from '../_shared/crypto.ts';
import { db, json, preflight } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const adminKey = Deno.env.get('CHURCH_ADMIN_KEY');
  if (!adminKey || !timingSafeEqual(req.headers.get('x-burden-admin-key') ?? '', adminKey)) {
    return json({ error: 'Not allowed.' }, 401);
  }

  if (req.method === 'GET') {
    const { data, error } = await db.from('support_messages')
      .select('id, created_at, campaign_id, display_name, message, reasons, checked_by')
      .eq('status', 'held').order('created_at').limit(100);
    if (error) return json({ error: 'Could not load the queue.' }, 500);
    return json({ held: data });
  }

  if (req.method !== 'POST') return json({ error: 'Use GET or POST.' }, 405);
  const b = await req.json().catch(() => ({}));
  if (!['approve', 'reject'].includes(b.decision)) return json({ error: "decision must be 'approve' or 'reject'." }, 400);
  const { data, error } = await db.from('support_messages').update({
    status: b.decision === 'approve' ? 'approved' : 'rejected',
    checked_by: 'reviewer', reviewer: String(b.reviewer ?? 'reviewer').slice(0, 80),
    checked_at: new Date().toISOString(),
  }).eq('id', Number(b.id)).eq('status', 'held').select('id');
  if (error) return json({ error: 'Could not record the decision.' }, 500);
  if (!data?.length) return json({ error: 'Message not found in the queue.' }, 404);
  return json({ ok: true });
});
