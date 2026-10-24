// Pure rules for trust and safety (no database, no network) — unit-tested
// in Node. The Deno side: functions/admin, functions/church-apply,
// functions/report, and the `edit` action in functions/church.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// ── KYB: what a reviewer checks before a church can receive money ─────────

// Each tier needs every check of the tiers below it. The labels are what the
// reviewer sees; the note they write against each one is kept with it.
export const KYB_CHECKS = [
  { id: 'registration', tier: 'Basic', label: 'Registered with a recognised body — number checked on the register' },
  { id: 'leadership', tier: 'Basic', label: 'Named leader, and the oversight body they answer to, confirmed' },
  { id: 'creed', tier: 'Basic', label: 'Affirms the historic creeds; accountable Christian leadership' },
  { id: 'sanctions', tier: 'Basic', label: 'Church and leader names screened against sanctions lists — clear' },
  { id: 'references', tier: 'Verified', label: 'Two references outside the church contacted' },
  { id: 'address', tier: 'Verified', label: 'Place of worship confirmed (photo, map or visit)' },
  { id: 'bank', tier: 'Verified', label: "Payout account name matches the church's registered name" },
  { id: 'accounts', tier: 'Premium Trust', label: 'Last year’s financial statements seen (independently examined or audited)' },
  { id: 'visit', tier: 'Premium Trust', label: 'Video call or visit with the leader and the finance steward' },
] as const;

export const TIERS = ['Basic', 'Verified', 'Premium Trust'] as const;
export type Tier = (typeof TIERS)[number];
export type Checks = Record<string, { ok: boolean; note?: string; by?: string; at?: string }>;

export function checksFor(tier: Tier) {
  const upto = TIERS.indexOf(tier);
  return KYB_CHECKS.filter((c) => TIERS.indexOf(c.tier) <= upto);
}

// The highest tier every one of whose checks is done (null: not even Basic).
export function tierEarned(checks: Checks): Tier | null {
  let earned: Tier | null = null;
  for (const t of TIERS) {
    if (checksFor(t).every((c) => checks[c.id]?.ok)) earned = t; else break;
  }
  return earned;
}

export function missingFor(tier: Tier, checks: Checks): string[] {
  return checksFor(tier).filter((c) => !checks[c.id]?.ok).map((c) => c.id);
}

// "Grace Community Church", "Nairobi" → "ch_nairobi_grace_community_church"
export function churchIdFor(name: string, city: string): string {
  const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `ch_${slug(city)}_${slug(name)}`.slice(0, 60);
}

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export type Application = {
  church_name: string; tradition: string; city: string; country: string;
  leader_name: string; leader_role: string; contact_email: string;
  registration_body: string; registration_no: string; oversight: string;
  website: string | null; references_text: string; creed_affirmed: true;
};

export function parseApplication(b: Record<string, unknown>): Parsed<Application> {
  const v = {
    church_name: str(b.churchName, 120), tradition: str(b.tradition, 60), city: str(b.city, 80), country: str(b.country, 80),
    leader_name: str(b.leaderName, 80), leader_role: str(b.leaderRole, 60),
    contact_email: str(b.email, 254).toLowerCase(),
    registration_body: str(b.registrationBody, 120), registration_no: str(b.registrationNo, 60),
    oversight: str(b.oversight, 160), website: str(b.website, 200) || null, references_text: str(b.references, 1000),
  };
  if (!v.church_name || !v.city || !v.country) return { ok: false, error: 'Enter the church’s name, city and country.' };
  if (!v.tradition) return { ok: false, error: 'Choose the church’s tradition.' };
  if (!v.leader_name || !v.leader_role) return { ok: false, error: 'Enter the leader’s name and role.' };
  if (!EMAIL_RE.test(v.contact_email)) return { ok: false, error: 'Enter an email we can reach the church on.' };
  if (!v.registration_body || !v.registration_no) {
    return { ok: false, error: 'Enter where the church is registered and its registration number.' };
  }
  if (!v.oversight) return { ok: false, error: 'Say who the leadership answers to — a denomination, diocese or board.' };
  if (v.references_text.length < 20) return { ok: false, error: 'Give two references outside the church, with a way to reach them.' };
  if (b.creedAffirmed !== true) return { ok: false, error: 'BURDEN is open to churches that affirm the historic creeds.' };
  if (v.website && !/^https?:\/\//.test(v.website)) v.website = 'https://' + v.website;
  return { ok: true, value: { ...v, creed_affirmed: true } };
}

// ── Burden edits ───────────────────────────────────────────────────────

// What a church may reword. The goal and the church itself are not here:
// changing those goes through BURDEN, so givers' promises don't move.
export const EDITABLE = {
  summary: { label: 'One-line summary', max: 240 },
  objective: { label: 'What this burden is for', max: 1200 },
  currentState: { label: 'Where things stand now', max: 1200 },
  moneyWorkflow: { label: 'Where the money goes, step by step', max: 400, list: true, maxItems: 8 },
  prayerFocus: { label: 'What to pray for', max: 300 },
} as const;
export type EditField = keyof typeof EDITABLE;
export type EditFields = Partial<{ summary: string; objective: string; currentState: string; moneyWorkflow: string[]; prayerFocus: string }>;

// Notes for the reviewer when wording drifts from BURDEN's rules: no urgency
// pressure, no spiritual reward for giving. Flags, not blocks — a person decides.
const URGENCY = /\b(urgent(ly)?|hurry|act now|last chance|before it'?s too late|only \d+ (days|hours) left|don'?t miss|time is running out)\b/i;
const REWARD = /\b(sow (a|your) seed|seed (gift|offering)|hundred ?fold|god will (bless|reward|repay)|blessing in return|unlock (your )?(blessing|breakthrough)|breakthrough|harvest (will|is coming)|give to receive)\b/i;

export function flagsFor(text: string): string[] {
  const flags: string[] = [];
  if (URGENCY.test(text)) flags.push('urgency');
  if (REWARD.test(text)) flags.push('spiritual reward');
  return flags;
}

export function parseBurdenEdit(raw: unknown): Parsed<{ fields: EditFields; flags: string[] }> {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Nothing to change.' };
  const b = raw as Record<string, unknown>;
  const fields: EditFields = {};
  for (const [key, rule] of Object.entries(EDITABLE) as [EditField, (typeof EDITABLE)[EditField]][]) {
    if (!(key in b)) continue;
    if ('list' in rule) {
      const items = Array.isArray(b[key]) ? (b[key] as unknown[]).map((x) => str(x, 1000)).filter(Boolean) : [];
      if (!items.length) return { ok: false, error: 'Keep at least one step in “where the money goes”.' };
      if (items.length > rule.maxItems) return { ok: false, error: `Use at most ${rule.maxItems} steps.` };
      if (items.some((i) => i.length > rule.max)) return { ok: false, error: `Keep each step under ${rule.max} characters.` };
      fields.moneyWorkflow = items;
    } else {
      const v = typeof b[key] === 'string' ? (b[key] as string).trim() : '';
      if (v.length < 10) return { ok: false, error: `“${rule.label}” needs at least 10 characters.` };
      if (v.length > rule.max) return { ok: false, error: `Keep “${rule.label}” under ${rule.max} characters.` };
      (fields as Record<string, string>)[key] = v;
    }
  }
  if (!Object.keys(fields).length) return { ok: false, error: 'Nothing to change.' };
  const all = Object.values(fields).flat().join('\n');
  return { ok: true, value: { fields, flags: flagsFor(all) } };
}

// ── Reports ────────────────────────────────────────────────────────────

export const REPORT_REASONS = ['scam', 'abuse', 'false', 'private', 'other'] as const;
export const REPORT_KINDS = ['update', 'support', 'fundraiser', 'burden'] as const;

export function parseReport(b: Record<string, unknown>): Parsed<{
  kind: (typeof REPORT_KINDS)[number]; ref: string; campaign_id: string; reason: (typeof REPORT_REASONS)[number]; detail: string | null;
}> {
  const kind = b.kind as (typeof REPORT_KINDS)[number];
  const reason = b.reason as (typeof REPORT_REASONS)[number];
  if (!REPORT_KINDS.includes(kind)) return { ok: false, error: 'Unknown thing to report.' };
  if (!REPORT_REASONS.includes(reason)) return { ok: false, error: 'Choose a reason.' };
  const ref = str(b.ref, 80);
  const campaignId = str(b.campaignId, 80);
  if (!ref || !campaignId) return { ok: false, error: 'Missing what to report.' };
  return { ok: true, value: { kind, ref, campaign_id: campaignId, reason, detail: str(b.detail, 500) || null } };
}

// ── Audit log ──────────────────────────────────────────────────────────

// One line per human decision. Never the giver's email or an account number
// in `detail` — the log is read by every reviewer.
export function auditEntry(actor: string, action: string, subjectType: string, subjectId: string, detail: Record<string, unknown> = {}) {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(detail)) {
    if (/email|account_?number|phone|token/i.test(k)) continue;
    clean[k] = typeof v === 'string' ? v.slice(0, 500) : v;
  }
  return { actor: actor.slice(0, 160), action, subject_type: subjectType, subject_id: String(subjectId).slice(0, 120), detail: clean };
}

// An owner's correction to a log entry: a new note and/or removal, always
// with a reason (the database keeps the earlier version).
export function parseLogChange(b: Record<string, unknown>):
  { ok: true; value: { id: number; remove: boolean; note: string | null; reason: string } } | { ok: false; error: string } {
  const id = Number(b.id);
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: 'Which entry?' };
  const reason = str(b.reason, 500);
  if (reason.length < 5) return { ok: false, error: 'Say why you are changing it.' };
  const remove = b.remove === true;
  const note = typeof b.note === 'string' ? b.note.trim().slice(0, 500) : null;
  if (!remove && note === null) return { ok: false, error: 'Write the corrected note.' };
  return { ok: true, value: { id, remove, note: remove ? null : note, reason } };
}
