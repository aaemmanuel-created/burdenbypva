// GET /burden-updates?campaign=<id> — the updates a church has posted on one
// burden, newest first (hidden ones excluded). Public.

import { db, json, preflight } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const campaign = new URL(req.url).searchParams.get('campaign') ?? '';
  if (!/^[a-z0-9_]{1,80}$/i.test(campaign)) return json({ error: 'Unknown burden.' }, 400);
  const { data, error } = await db.from('burden_updates').select('created_at, author, role_title, title, body')
    .eq('campaign_id', campaign).is('hidden_at', null).order('created_at', { ascending: false }).limit(50);
  if (error) return json({ error: 'Could not load updates.' }, 500);
  return json({
    updates: (data ?? []).map((u: { created_at: string; author: string; role_title: string; title: string; body: string }) => ({
      date: u.created_at, author: u.author, role: u.role_title, title: u.title, body: u.body,
    })),
  });
});
