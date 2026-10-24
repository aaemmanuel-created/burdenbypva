// POST /report { kind, ref, campaignId, reason, detail? } — anyone can report
// an update, a word of support, a fundraiser or a burden. Nothing is taken
// down automatically: it goes to the BURDEN team's queue (admin console).
// Signed-in reporters are recorded so a reviewer can reply.

import { parseReport } from '../_shared/admin-logic.ts';
import { signedInUser } from '../_shared/auth.ts';
import { db, json, preflight } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  const r = parseReport(await req.json().catch(() => ({})));
  if (!r.ok) return json({ error: r.error }, 400);
  const user = await signedInUser(req);
  // The same thing reported again while open just adds weight to the first report.
  const { data: open } = await db.from('content_reports').select('id').eq('kind', r.value.kind).eq('ref', r.value.ref)
    .eq('status', 'open').limit(1);
  if (open?.length) return json({ ok: true });
  const { error } = await db.from('content_reports').insert({ ...r.value, reporter: user?.email ?? null });
  if (error) return json({ error: 'Could not send the report.' }, 500);
  return json({ ok: true });
});
