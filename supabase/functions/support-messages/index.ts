// GET /support-messages?campaign=<id> — the approved words of support for one
// burden, newest first. Public: names (or "Anonymous"), dates and words only;
// never amounts, emails or gift ids.

import { db, json, preflight } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const campaign = new URL(req.url).searchParams.get('campaign') ?? '';
  if (!/^[a-z0-9_]{1,80}$/i.test(campaign)) return json({ error: 'Unknown burden.' }, 400);
  const { data, error } = await db.from('support_messages')
    .select('display_name, message, created_at')
    .eq('campaign_id', campaign).eq('status', 'approved')
    .order('created_at', { ascending: false }).limit(100);
  if (error) return json({ error: 'Could not load words of support.' }, 500);
  return json({ words: (data ?? []).map((w: { display_name: string; message: string; created_at: string }) => ({ name: w.display_name, message: w.message, date: w.created_at })) });
});
