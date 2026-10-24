// POST /church-apply — a church asks to join BURDEN. No sign-in: the
// contact email gets the reviewer's reply, and becomes the church's first
// admin if the application is approved. A BURDEN reviewer works through the
// KYB checks in the admin console before any money can reach the church.

import { parseApplication } from '../_shared/admin-logic.ts';
import { audit } from '../_shared/auth.ts';
import { db, json, preflight } from '../_shared/server.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  if (typeof b.website2 === 'string' && b.website2) return json({ ok: true }); // a form-filling bot

  const app = parseApplication(b);
  if (!app.ok) return json({ error: app.error }, 400);
  // One open application per email at a time.
  const { count } = await db.from('church_applications').select('id', { count: 'exact', head: true })
    .eq('contact_email', app.value.contact_email).in('status', ['submitted', 'in_review']);
  if ((count ?? 0) > 0) return json({ error: 'An application from this email is already with the BURDEN team.' }, 409);

  const { data, error } = await db.from('church_applications').insert(app.value).select('id').single();
  if (error) return json({ error: 'Could not send the application. Please try again.' }, 500);
  await audit('applicant', 'application.submit', 'application', data.id, { church: app.value.church_name, city: app.value.city });
  return json({ ok: true, id: data.id });
});
