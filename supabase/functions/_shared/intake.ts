// Every new gift goes through here first (create-gift, momo-charge, ussd):
// today's exchange rate, the request checks, an optional Gift Aid
// declaration, and sanctions screening — all before anything is charged.

import { GIFT_AID_WORDING, parseGiftAid } from './duties-logic.ts';
import { chargeNow, screenName } from './duties.ts';
import { type GiftInput, parseGiftInput, type Provider } from './gift-input.ts';
import { ALLOWED_RETURN_PREFIXES, isTestKey, LIVE_ALLOWED } from './server.ts';

export type Intake =
  | { ok: false; status: number; error: string }
  | {
    ok: true; input: GiftInput; testMode: boolean;
    extra: Record<string, unknown>; giftAid: Record<string, unknown> | null;
  };

export async function intake(body: Record<string, unknown> | null, forceProvider?: Provider): Promise<Intake> {
  let charge;
  try {
    charge = await chargeNow();
  } catch (e) {
    console.error('no exchange rate', e);
    return { ok: false, status: 503, error: 'Giving in local currency is paused for a moment. Please try again shortly.' };
  }
  const b: Record<string, unknown> = { ...(body ?? {}), ...(forceProvider ? { provider: forceProvider } : {}) };
  const parsed = parseGiftInput(b, charge.config, ALLOWED_RETURN_PREFIXES);
  if (!parsed.ok) return { ok: false, status: 400, error: parsed.error };
  const input = parsed.value;

  const testMode = isTestKey(input.provider);
  if (!testMode && !LIVE_ALLOWED) return { ok: false, status: 503, error: 'Live payments are not switched on yet.' };

  let giftAid: Record<string, unknown> | null = null;
  if (b.giftAid) {
    const ga = parseGiftAid(b.giftAid);
    if (!ga.ok) return { ok: false, status: 400, error: ga.error };
    giftAid = { ...ga.value, wording: GIFT_AID_WORDING };
  }

  // Screen the giver's name against the sanctions lists. A strong match is
  // refused without detail; a possible match goes ahead but its payout waits
  // for a reviewer (screening-queue).
  const screening = await screenName(input.donor_name, 'donor', input.donor_email, !testMode);
  if (screening === 'blocked') {
    return { ok: false, status: 403, error: 'We cannot accept this gift online. Please contact the BURDEN team.' };
  }

  return { ok: true, input, testMode, giftAid, extra: { fx_source: charge.sources[input.provider], screening } };
}
