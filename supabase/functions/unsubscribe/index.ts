// GET /unsubscribe?e=<email>&s=<signature> — the link at the bottom of every
// update email. Turns off update emails for every gift from that address.
// (Messages about your own gift — reached the church, confirmed — continue.)

import { hmacHex, timingSafeEqual } from '../_shared/crypto.ts';
import { db } from '../_shared/server.ts';

const page = (text: string, status = 200) => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>BURDEN</title>` +
  `<body style="font-family:Helvetica,Arial,sans-serif;background:#f7f6f2;color:#0a0a0a;max-width:520px;margin:15vh auto;padding:0 24px">` +
  `<p style="letter-spacing:2px;font-size:12px;color:#676762">BURDEN</p><p style="font-size:18px;line-height:1.5">${text}</p></body>`,
  { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const email = (url.searchParams.get('e') ?? '').toLowerCase();
  const secret = Deno.env.get('UNSUBSCRIBE_SECRET') ?? Deno.env.get('CRON_SECRET');
  if (!secret || !email) return page('This link is not valid.', 400);
  if (!timingSafeEqual(url.searchParams.get('s') ?? '', await hmacHex('SHA-256', secret, email))) {
    return page('This link is not valid.', 400);
  }
  await db.from('gifts').update({ notify_updates: false }).eq('donor_email', email);
  return page('You will no longer get update emails. Messages about your own gifts will still arrive.');
});
