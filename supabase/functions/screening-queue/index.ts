// Sanctions screening — the human end. Guarded by CHURCH_ADMIN_KEY.
//   GET  /screening-queue → open possible matches, oldest first
//   POST /screening-queue { id, outcome: 'clear' | 'confirmed', reviewer, note }
// "clear" (a false match) releases the donor's gifts for payout; "confirmed"
// keeps them blocked — then refund through the provider and report as the
// law requires (take advice first).

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
    const { data } = await db.from('screening_results').select('*')
      .neq('decision', 'clear').is('reviewed_at', null).order('created_at').limit(100);
    return json({ open: data ?? [] });
  }
  if (req.method !== 'POST') return json({ error: 'Use GET or POST.' }, 405);
  const b = await req.json().catch(() => ({}));
  if (!['clear', 'confirmed'].includes(b.outcome)) return json({ error: "outcome must be 'clear' or 'confirmed'." }, 400);
  const { data: row } = await db.from('screening_results').update({
    reviewed_by: String(b.reviewer ?? 'reviewer').slice(0, 80), reviewed_at: new Date().toISOString(),
    review_note: String(b.note ?? '').slice(0, 500), decision: b.outcome === 'clear' ? 'clear' : 'blocked',
  }).eq('id', Number(b.id)).is('reviewed_at', null).select('subject_type, subject_ref').maybeSingle();
  if (!row) return json({ error: 'Not found in the queue.' }, 404);
  if (row.subject_type === 'donor') {
    await db.from('gifts').update({ screening: b.outcome === 'clear' ? 'clear' : 'blocked' })
      .eq('donor_email', row.subject_ref).eq('screening', 'review');
  }
  if (row.subject_type === 'payout_account' && b.outcome === 'clear') {
    await db.from('church_payout_accounts').update({ verified_at: new Date().toISOString() }).eq('church_id', row.subject_ref);
  }
  return json({ ok: true });
});
