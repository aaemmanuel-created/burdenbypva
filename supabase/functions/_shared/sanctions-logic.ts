// Sanctions screening — pure matching rules (no database, no network),
// unit-tested in Node. Lists are loaded by sanctions-refresh; screening runs
// in sanctions.ts on every named donor and every church payout account.
//
// The blueprint recommends a paid service (ComplyAdvantage). Until BURDEN
// has one, this screens against the public lists it can download itself:
// the US OFAC SDN list and the UK sanctions list. A match never silently
// passes: "review" holds the payout for a person; "blocked" refuses the gift.

const HONORIFICS = new Set([
  'mr', 'mrs', 'ms', 'miss', 'dr', 'rev', 'revd', 'reverend', 'pastor', 'prof', 'sir', 'dame', 'engr', 'eng',
  'hon', 'chief', 'alhaji', 'alhaja', 'bishop', 'apostle', 'prophet', 'elder', 'deacon', 'auntie', 'uncle',
  'teacher', 'jr', 'sr', 'the',
]);

export function nameTokens(raw: string): string[] {
  return raw
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .replace(/['-]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !HONORIFICS.has(t));
}

// Jaro–Winkler similarity between two words (0..1).
export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const range = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const am = new Array(a.length).fill(false), bm = new Array(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = Math.max(0, i - range); j < Math.min(b.length, i + range + 1); j++) {
      if (!bm[j] && a[i] === b[j]) { am[i] = bm[j] = true; matches++; break; }
    }
  }
  if (!matches) return 0;
  let t = 0, k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!am[i]) continue;
    while (!bm[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const jaro = (matches / a.length + matches / b.length + (matches - t / 2) / matches) / 3;
  let prefix = 0;
  while (prefix < 4 && a[prefix] && a[prefix] === b[prefix]) prefix++;
  return jaro + prefix * 0.1 * (1 - jaro);
}

// Name similarity, order-free: every word of the shorter name must find a
// close word in the longer one ("Mensah Kofi" = "Kofi Mensah").
export function nameScore(q: string[], c: string[]): number {
  if (!q.length || !c.length) return 0;
  const [short, long] = q.length <= c.length ? [q, c] : [c, q];
  const best = short.map((t) => Math.max(...long.map((u) => jaroWinkler(t, u))));
  const coverage = short.length / long.length; // "Kofi" alone should not match "Kofi Annan Mensah"
  const avg = best.reduce((s, x) => s + x, 0) / best.length;
  return Math.round(avg * (0.85 + 0.15 * coverage) * 1000) / 1000;
}

// Only an exact name match is refused outright; anything close (spelling
// variants, transliterations) waits for a person rather than being blocked.
export const BLOCK_AT = 0.999;
export const REVIEW_AT = 0.88;

export function decisionFor(score: number, nameWords: number): 'clear' | 'review' | 'blocked' {
  if (nameWords < 2) return 'clear'; // one word alone (e.g. "Ivan") is too weak to act on
  if (score >= BLOCK_AT) return 'blocked';
  if (score >= REVIEW_AT) return 'review';
  return 'clear';
}

// ── List parsing ────────────────────────────────────────────────────────

// Minimal CSV line splitter (quoted fields, doubled quotes).
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out;
}

export type ListEntry = { list: string; list_ref: string; name: string };

// OFAC sdn.csv: ent_num, SDN_Name ("LAST, First"), SDN_Type, … (no header).
// Individuals and entities are both screened.
export function parseOfacSdn(csvText: string): ListEntry[] {
  return csvText.split(/\r?\n/).filter(Boolean).map(splitCsvLine)
    .filter((r) => r.length > 2 && r[1] && r[1] !== '-0-')
    .map((r) => {
      const [last, first] = r[1].split(',').map((s) => s.trim());
      return { list: 'OFAC-SDN', list_ref: r[0], name: first ? `${first} ${last}` : last };
    });
}

// UK consolidated list CSV: a "Last Updated" line, then a header row with
// "Name 6" (surname), "Name 1"…"Name 5" and "Group ID".
export function parseUkList(csvText: string): ListEntry[] {
  const rows = csvText.split(/\r?\n/).filter(Boolean).map(splitCsvLine);
  const h = rows.findIndex((r) => r.includes('Name 6'));
  if (h < 0) return [];
  const col = (n: string) => rows[h].indexOf(n);
  const parts = ['Name 1', 'Name 2', 'Name 3', 'Name 4', 'Name 5', 'Name 6'].map(col);
  const id = col('Group ID');
  const seen = new Set<string>();
  const out: ListEntry[] = [];
  for (const r of rows.slice(h + 1)) {
    const name = parts.map((i) => (i >= 0 ? r[i]?.trim() : '')).filter(Boolean).join(' ');
    const key = `${r[id] ?? ''}|${name}`;
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push({ list: 'UK', list_ref: r[id] ?? '', name });
  }
  return out;
}
