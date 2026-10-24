// POST /run-recurring — charges every monthly gift that is due (Paystack
// cards and mobile money; Stripe charges its own). Called once a day by a
// Supabase cron job with the CRON_SECRET header (see PAYMENTS-SETUP.md).

import { timingSafeEqual } from '../_shared/crypto.ts';
import { runDuePlans } from '../_shared/plans.ts';
import { json } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || !timingSafeEqual(req.headers.get('x-burden-cron') ?? '', secret)) {
    return json({ error: 'Not allowed.' }, 401);
  }
  try {
    return json(await runDuePlans());
  } catch (e) {
    console.error('run-recurring failed', e);
    return json({ error: 'Run failed.' }, 500);
  }
});
