// GET /checkout-return?gift=<id>&t=<token>[&cancelled=1] — where every
// provider sends the donor after checkout. Records the outcome, then
// redirects back to the app that started the gift (web page or burden://).
// The destination comes from the gift row, never the query string, so
// this can't be used as an open redirect.

import { applyVerification, loadGiftWithToken, verifyAndApply } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('gift');
  const token = url.searchParams.get('t');
  const gift = await loadGiftWithToken(id, token);
  if (!gift) return new Response('Gift not found.', { status: 404 });

  // Flutterwave reports a cancel as ?status=cancelled.
  const cancelled = url.searchParams.get('cancelled') === '1' || url.searchParams.get('status') === 'cancelled';
  try {
    if (cancelled && gift.status === 'initiated') {
      await applyVerification(gift, { outcome: 'cancelled' }, 'redirect');
    } else {
      await verifyAndApply(gift, 'redirect');
    }
  } catch (e) {
    console.error('verify on return failed', e); // The app polls gift-status, so still send the donor back.
  }

  const back = new URL(gift.return_url);
  back.searchParams.set('gift', gift.id);
  back.searchParams.set('t', token!);
  return new Response(null, { status: 302, headers: { Location: back.toString() } });
});
