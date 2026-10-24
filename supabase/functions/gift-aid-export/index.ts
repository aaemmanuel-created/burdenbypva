// GET /gift-aid-export[?mark=1] — Gift Aid declarations ready to claim, as a
// CSV in the column order of HMRC's Charities Online schedule. Guarded by
// CHURCH_ADMIN_KEY. Only gifts charged in GBP can be claimed (HMRC pays on
// the sterling amount); others are listed separately. ?mark=1 records the
// exported rows as claimed. Claiming needs BURDEN to be an HMRC-recognised
// charity first (go-live checklist).

import { timingSafeEqual } from '../_shared/crypto.ts';
import { csv, HMRC_HEADER, hmrcRow } from '../_shared/duties-logic.ts';
import { db, json, preflight } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const adminKey = Deno.env.get('CHURCH_ADMIN_KEY');
  if (!adminKey || !timingSafeEqual(req.headers.get('x-burden-admin-key') ?? '', adminKey)) {
    return json({ error: 'Not allowed.' }, 401);
  }
  const { data, error } = await db.from('gift_aid_declarations')
    .select('*, gifts!inner(status, charge_currency, amount_minor, fx_rate, test_mode)')
    .is('claimed_at', null)
    .in('gifts.status', ['held', 'paid_out', 'church_confirmed'])
    .eq('gifts.test_mode', false);
  if (error) return json({ error: 'Could not load declarations.' }, 500);
  const rows: string[][] = [];
  const notGbp: string[] = [];
  for (const d of data ?? []) {
    const row = hmrcRow(d, d.gifts);
    if (row) rows.push(row); else notGbp.push(d.gift_id);
  }
  if (new URL(req.url).searchParams.get('mark') === '1' && rows.length) {
    const ids = (data ?? []).filter((d: { gifts: { charge_currency: string } }) => d.gifts.charge_currency === 'GBP')
      .map((d: { gift_id: string }) => d.gift_id);
    await db.from('gift_aid_declarations').update({ claimed_at: new Date().toISOString() }).in('gift_id', ids);
  }
  return new Response(csv([HMRC_HEADER, ...rows]) + (notGbp.length
    ? `\n\n# ${notGbp.length} declaration(s) not exported: charged in a currency other than GBP`
    : ''), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
});
