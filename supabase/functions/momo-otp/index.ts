// POST /momo-otp { gift, t, otp } — some networks (e.g. Telecel vouchers)
// send the donor a code before the prompt. The donor types it here; this is
// never their PIN, which only ever goes into their own phone.

import { submitMomoOtp } from '../_shared/momo.ts';
import { db, json, loadGiftWithToken, preflight, secrets, verifyAndApply } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const body = await req.json().catch(() => ({}));
  const gift = await loadGiftWithToken(String(body.gift ?? ''), String(body.t ?? ''));
  if (!gift) return json({ error: 'Gift not found.' }, 404);
  if (gift.status !== 'initiated') return json({ state: 'done' });
  const otp = String(body.otp ?? '').replace(/\s/g, '');
  if (!/^\d{4,8}$/.test(otp)) return json({ error: 'Enter the code exactly as your network sent it.' }, 400);

  try {
    const next = await submitMomoOtp(gift, otp, secrets);
    if (next.state === 'paid') await verifyAndApply(gift, 'momo');
    if (next.state === 'failed') {
      await db.rpc('transition_gift', { p_gift_id: gift.id, p_to: 'failed', p_note: next.message });
    }
    return json(next);
  } catch (e) {
    console.error('momo otp failed', e);
    return json({ error: 'That code did not work. Please check it and try again.' }, 400);
  }
});
