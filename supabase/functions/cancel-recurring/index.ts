// POST /cancel-recurring { plan, t } — the donor stops their monthly gift,
// using the private plan token they were given with the first gift.
// Gifts already paid are unaffected.

import { cancelPlan } from '../_shared/plans.ts';
import { json, preflight } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const body = await req.json().catch(() => ({}));
  try {
    const result = await cancelPlan(String(body.plan ?? ''), String(body.t ?? ''));
    if (result === 'not_found') return json({ error: 'Monthly gift not found.' }, 404);
    return json({ ok: true });
  } catch (e) {
    console.error('cancel recurring failed', e);
    return json({ error: 'Could not stop the monthly gift. Please try again.' }, 500);
  }
});
