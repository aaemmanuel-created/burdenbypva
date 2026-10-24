// Public fundraisers, so a shared link (?burden=…&f=fr_…) shows the same
// page to everyone. No sign-in.
//   GET /fundraisers?campaign=<id>  → open fundraisers on that burden, with what each has raised
//   GET /fundraisers?id=<fr_…>      → one fundraiser (also when closed, so old links still explain)

import { type FundraiserRow, publicFundraiser, raisedBy } from '../_shared/account-logic.ts';
import { db, json, preflight } from '../_shared/server.ts';

const COLUMNS = 'id, created_at, campaign_id, name, note, goal_minor, status';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const campaign = url.searchParams.get('campaign');

  let rows: FundraiserRow[] = [];
  if (id) {
    const { data } = await db.from('fundraisers').select(COLUMNS).eq('id', id).neq('status', 'hidden').maybeSingle();
    rows = data ? [data as FundraiserRow] : [];
  } else if (campaign) {
    const { data } = await db.from('fundraisers').select(COLUMNS).eq('campaign_id', campaign).eq('status', 'open')
      .order('created_at', { ascending: false }).limit(50);
    rows = (data ?? []) as FundraiserRow[];
  } else {
    return json({ error: 'Give ?campaign= or ?id=.' }, 400);
  }

  const { data: gifts } = rows.length
    ? await db.from('gifts').select('fundraiser_id, status, amount_minor').in('fundraiser_id', rows.map((r) => r.id))
    : { data: [] };
  const raised = raisedBy(gifts ?? []);
  return json({ fundraisers: rows.map((r) => publicFundraiser(r, raised[r.id] ?? 0)) });
});
