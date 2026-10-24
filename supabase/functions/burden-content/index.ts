// GET /burden-content → the wording churches have changed on their burdens,
// after a BURDEN reviewer approved it: { content: { <campaignId>: { summary?, objective?, … , approvedAt } } }.
// The apps lay it over the text they ship with. No sign-in.

import { db, json, preflight } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const { data, error } = await db.from('burden_content').select('campaign_id, fields, approved_at');
  if (error) return json({ error: 'Could not load.' }, 500);
  const content: Record<string, unknown> = {};
  for (const row of data ?? []) content[row.campaign_id] = { ...row.fields, approvedAt: row.approved_at };
  return new Response(JSON.stringify({ content }), {
    headers: {
      'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60',
    },
  });
});
