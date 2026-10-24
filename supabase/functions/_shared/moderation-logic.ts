// Words of support — the automated review queue: fast, free rules. Pure
// (no network), unit-tested in Node; run by support.ts once a gift is paid.
//
// Every message ends in one of three places:
//   approve — published on the burden page
//   hold    — waits for a BURDEN reviewer (moderation-queue)
//   reject  — never published; the giver is told kindly
// When in doubt the rules hold a message for a person rather than publish it.

export type Decision = 'approve' | 'hold' | 'reject';

export type RuleResult = { decision: Decision; reasons: string[] };

export const MAX_MESSAGE = 280;

const order: Record<Decision, number> = { approve: 0, hold: 1, reject: 2 };
export const stricter = (a: Decision, b: Decision): Decision => (order[a] >= order[b] ? a : b);

// Scams are the real risk on a giving page: "send money to my MoMo",
// wallet numbers, crypto and "investments". These never publish.
const SCAM = [
  /\b(send|transfer|pay)\b.{0,30}(\b(money|cash|cedis?|ghs|naira|ngn|ksh|momo|wallet|account number)\b|[$£€₵₦]\s?\d)/i,
  /\b(momo|mobile money|wallet|account)\s*(no\.?|number|#)?\s*[:\-]?\s*\d{6,}/i,
  /\b(bitcoin|btc|usdt|crypto|gift\s?cards?)\b/i,
  /\b(loan|investment|double your|guaranteed returns?)\b/i,
];

// Contact details, "WhatsApp me" and links: held for a person, since some are innocent
// ("see the church site") and some are not.
const CONTACT = [
  /\b(whats\s?app|telegram|dm|inbox|text|call)\s+me\b/i,
  /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|org|net|io|co|gh|ng|ke|uk|ph)\b/i,
  /[^\s@]+@[^\s@]+\.[^\s@]+/,
  /(\+?\d[\s\-().]?){9,}/, // phone-number-like runs of digits
];

// BURDEN's brand rules forbid urgency and spiritual-reward-for-giving
// language (CLAUDE.md "Brand guardrails"). Held so a person can judge tone.
const GUARDRAIL = [
  /\b(give|donate)\b.{0,20}\b(now|today|immediately|before it'?s too late)\b/i,
  /\b(hurry|last chance|act fast|urgent(ly)?)\b/i,
  /\b(god|heaven|the lord)\b.{0,30}\b(will|shall)\b.{0,20}\b(bless|repay|reward|multiply)\b.{0,30}\b(give|gave|giving|gift|seed)\b/i,
  /\b(sow a seed|seed faith|hundredfold)\b/i,
];

// A short, deliberately conservative list. Extend it from what reviewers
// actually see in the queue, never from guesses.
const ABUSE = [/\b(f+u+c+k+|sh[i1]t|bastard|idiot|stupid|scam(mer)?s?|fraud(ster)?s?|thie(f|ves))\b/i];

export function ruleCheck(raw: string): RuleResult {
  const text = raw.trim();
  const reasons: string[] = [];
  let decision: Decision = 'approve';
  const flag = (d: Decision, why: string) => { decision = stricter(decision, d); reasons.push(why); };

  if (!text) flag('reject', 'empty');
  if (text.length > MAX_MESSAGE) flag('reject', 'too long');
  if (SCAM.some((r) => r.test(text))) flag('reject', 'asks for money or contact outside BURDEN');
  if (CONTACT.some((r) => r.test(text))) flag('hold', 'contains a link, email or phone number');
  if (GUARDRAIL.some((r) => r.test(text))) flag('hold', 'urgency or reward-for-giving language');
  if (ABUSE.some((r) => r.test(text))) flag('hold', 'possible abuse or accusation');
  const letters = text.replace(/[^a-z]/gi, '');
  if (letters.length >= 12 && letters === letters.toUpperCase()) flag('hold', 'all capitals');
  if (/(.)\1{7,}/.test(text)) flag('hold', 'repeated characters');
  return { decision, reasons };
}

// What the giver sees about their own message.
export function giverNote(d: Decision): string {
  if (d === 'approve') return 'Your words of support are on the burden page.';
  if (d === 'hold') return 'Your words of support will appear once a BURDEN reviewer has read them.';
  return 'Your gift went through, but your words of support could not be published. ' +
    'Links, contact details and requests for money are not allowed.';
}
