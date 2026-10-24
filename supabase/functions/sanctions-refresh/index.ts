// POST /sanctions-refresh — reloads the public sanctions lists that donor and
// church screening checks against. Daily, from a Supabase cron job with the
// CRON_SECRET header (PAYMENTS-SETUP.md). Sources can be changed by env:
//   OFAC_SDN_URL  (default: US Treasury sdn.csv)
//   UK_SANCTIONS_URL (default: OFSI consolidated list CSV — check it is still
//                     published there; the UK has been moving to the FCDO's
//                     UK Sanctions List)
// A list that fails to download keeps its previous entries.

import { timingSafeEqual } from '../_shared/crypto.ts';
import { type ListEntry, nameTokens, parseOfacSdn, parseUkList } from '../_shared/sanctions-logic.ts';
import { db, json } from '../_shared/server.ts';

const SOURCES: { list: string; url: string; parse: (t: string) => ListEntry[] }[] = [
  { list: 'OFAC-SDN', url: Deno.env.get('OFAC_SDN_URL') ?? 'https://www.treasury.gov/ofac/downloads/sdn.csv', parse: parseOfacSdn },
  {
    list: 'UK',
    url: Deno.env.get('UK_SANCTIONS_URL') ?? 'https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv',
    parse: parseUkList,
  },
];

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || !timingSafeEqual(req.headers.get('x-burden-cron') ?? '', secret)) {
    return json({ error: 'Not allowed.' }, 401);
  }
  const report: Record<string, string> = {};
  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const entries = src.parse(await res.text()).filter((e) => nameTokens(e.name).length);
      if (entries.length < 100) throw new Error(`only ${entries.length} entries — format may have changed`);
      await db.from('sanctions_entries').delete().eq('list', src.list);
      for (let i = 0; i < entries.length; i += 1000) {
        const { error } = await db.from('sanctions_entries').insert(
          entries.slice(i, i + 1000).map((e) => ({ ...e, tokens: nameTokens(e.name) })),
        );
        if (error) throw error;
      }
      report[src.list] = `${entries.length} names`;
    } catch (e) {
      console.error(`sanctions list ${src.list} not refreshed`, e);
      report[src.list] = `kept previous list (${(e as Error).message})`;
    }
  }
  return json(report);
});
