// POST /ussd — the USSD gateway's callback (Africa's Talking style: form
// fields sessionId, phoneNumber, networkCode, serviceCode, text). Replies in
// plain text, "CON …" or "END …". Menu rules: _shared/ussd-logic.ts.
//
// Needs a USSD short code rented from a gateway (expressPay, Africa's Talking,
// Hubtel, Arkesel …) pointed at this URL with ?key=<USSD_SHARED_SECRET>.
// The final step starts the same approve-on-your-phone MoMo charge as the app.

import { timingSafeEqual } from '../_shared/crypto.ts';
import { BURDENS } from '../_shared/burdens.ts';
import { chargeNow } from '../_shared/duties.ts';
import { intake } from '../_shared/intake.ts';
import { chargeMomo, normaliseGhanaPhone } from '../_shared/momo.ts';
import { networkFromCode, ussdStep } from '../_shared/ussd-logic.ts';
import { ALLOWED_RETURN_PREFIXES, db, insertGift, secrets } from '../_shared/server.ts';

const reply = (text: string) => new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

Deno.serve(async (req) => {
  const secret = Deno.env.get('USSD_SHARED_SECRET');
  const key = new URL(req.url).searchParams.get('key') ?? '';
  if (!secret || !timingSafeEqual(key, secret)) return new Response('Not allowed.', { status: 401 });

  const form = await req.formData().catch(() => null);
  const path = String(form?.get('text') ?? '');
  let rate: number;
  try {
    rate = (await chargeNow()).config.usdRate.paystack;
  } catch {
    return reply('END Giving is paused for a moment. Please try again shortly.');
  }
  const step = ussdStep(path, BURDENS, rate);
  if (step.kind !== 'charge') return reply(`${step.kind.toUpperCase()} ${step.text}`);

  const phone = normaliseGhanaPhone(String(form?.get('phoneNumber') ?? ''));
  const network = networkFromCode(String(form?.get('networkCode') ?? ''));
  if (!phone || !network) return reply('END Mobile money giving works on MTN, Telecel and AirtelTigo numbers in Ghana.');
  const b = step.burden;
  const prepared = await intake({
    amount: step.ghs / rate, coverFee: true, anonymous: true,
    // USSD donors have no email; Paystack needs one for the charge. Receipts go by SMS.
    email: `${phone.slice(1)}@ussd.burden.invalid`,
    campaignId: b.id, campaignTitle: b.title, churchId: b.churchId, churchName: b.churchName,
    returnUrl: ALLOWED_RETURN_PREFIXES.find((p) => p.startsWith('https://')) ?? ALLOWED_RETURN_PREFIXES[0],
  }, 'paystack');
  if (!prepared.ok) return reply(`END ${prepared.error}`);

  try {
    const { gift } = await insertGift(prepared.input, prepared.testMode, {
      ...prepared.extra, momo_phone: phone, momo_network: network, payment_method: 'mobile_money',
    });
    const next = await chargeMomo(gift, phone, network, secrets);
    if (next.state === 'failed') {
      await db.rpc('transition_gift', { p_gift_id: gift.id, p_to: 'failed', p_note: next.message });
      return reply(`END ${next.message}`);
    }
    return reply(`END ${step.text}`);
  } catch (e) {
    console.error('ussd gift failed', e);
    return reply('END Sorry, the prompt could not be sent. Nothing was charged. Please try again later.');
  }
});
