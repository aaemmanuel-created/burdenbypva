// The BURDEN team's console: checking churches (KYB), burden edits, words of
// support the rules held, public reports, sanctions matches, payout accounts
// — and the audit log every decision here is written to.
//
// Sign in with a one-time code by email; the email must be in burden_admins.
// The first owner is added with CHURCH_ADMIN_KEY (x-burden-admin-key):
//   POST /admin { action: 'admin_add', email, name, role: 'owner' }
//
//   GET  /admin → { me, queues…, audit }
//   POST /admin { action, … } — see the switch below. Every action needs a
//        `note` where a person's judgement is involved; it goes in the log.

import { churchIdFor, KYB_CHECKS, missingFor, type Checks, type Tier, TIERS } from '../_shared/admin-logic.ts';
import { type Admin, adminOf, audit, hasAdminKey, signedInUser } from '../_shared/auth.ts';
import { BURDENS } from '../_shared/burdens.ts';
import { maskAccount } from '../_shared/church-logic.ts';
import { db, json, preflight } from '../_shared/server.ts';

const now = () => new Date().toISOString();

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  let me: Admin | null = null;
  if (hasAdminKey(req)) me = { email: 'admin-key', name: 'BURDEN admin key', role: 'owner' };
  else {
    const user = await signedInUser(req);
    if (!user) return json({ error: 'Please sign in.' }, 401);
    me = await adminOf(user.email);
    if (!me) return json({ error: 'This email is not on the BURDEN team.' }, 403);
  }
  const actor = `${me.name} <${me.email}>`;

  if (req.method === 'GET') {
    const [apps, tiers, edits, content, held, reports, screening, payouts, updates, log, admins] = await Promise.all([
      db.from('church_applications').select('*').in('status', ['submitted', 'in_review']).order('created_at'),
      db.from('church_tiers').select('*'),
      db.from('burden_edits').select('*').eq('status', 'pending').order('created_at'),
      db.from('burden_content').select('campaign_id, fields'),
      db.from('support_messages').select('id, created_at, campaign_id, display_name, message, reasons').eq('status', 'held').order('created_at').limit(100),
      db.from('content_reports').select('*').eq('status', 'open').order('created_at').limit(100),
      db.from('screening_results').select('*').neq('decision', 'clear').is('reviewed_at', null).order('created_at').limit(100),
      db.from('church_payout_accounts').select('church_id, method, network, account_name, account_number, submitted_by, updated_at').is('verified_at', null),
      db.from('burden_updates').select('id, created_at, campaign_id, church_id, author, title, body').is('hidden_at', null).order('created_at', { ascending: false }).limit(30),
      db.from('audit_log').select('*').order('at', { ascending: false }).limit(200),
      me.role === 'owner' ? db.from('burden_admins').select('email, name, role, added_at').is('removed_at', null) : Promise.resolve({ data: [] }),
    ]);

    // What each report points at, so the reviewer reads it in place.
    const items = await Promise.all((reports.data ?? []).map(async (r) => {
      let text = '';
      if (r.kind === 'update') {
        const { data } = await db.from('burden_updates').select('title, body, author').eq('id', Number(r.ref)).maybeSingle();
        text = data ? `${data.title} — ${data.body} (${data.author})` : '';
      } else if (r.kind === 'support') {
        const { data } = await db.from('support_messages').select('message, display_name').eq('id', Number(r.ref)).maybeSingle();
        text = data ? `“${data.message}” — ${data.display_name}` : '';
      } else if (r.kind === 'fundraiser') {
        const { data } = await db.from('fundraisers').select('name, note').eq('id', r.ref).maybeSingle();
        text = data ? `${data.name}: ${data.note}` : '';
      }
      return { ...r, reporter: r.reporter ? 'signed-in giver' : 'anonymous', text };
    }));

    const tierOf = new Map((tiers.data ?? []).map((t) => [t.church_id, t]));
    return json({
      me,
      checks: KYB_CHECKS,
      applications: apps.data ?? [],
      churches: [...new Map(BURDENS.map((b) => [b.churchId, b])).values()].map((b) => ({
        churchId: b.churchId, name: b.churchName, city: b.city, tier: tierOf.get(b.churchId)?.tier ?? null,
        checks: tierOf.get(b.churchId)?.checks ?? {},
      })),
      edits: (edits.data ?? []).map((e) => ({ ...e, current: content.data?.find((c) => c.campaign_id === e.campaign_id)?.fields ?? null })),
      held: held.data ?? [],
      reports: items,
      screening: screening.data ?? [],
      payouts: (payouts.data ?? []).map((p) => ({ ...p, account_number: maskAccount(String(p.account_number)) })),
      updates: updates.data ?? [],
      audit: log.data ?? [],
      admins: admins.data ?? [],
    });
  }

  if (req.method !== 'POST') return json({ error: 'Use GET or POST.' }, 405);
  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const note = typeof b.note === 'string' ? b.note.trim().slice(0, 500) : '';
  const id = String(b.id ?? '');

  switch (b.action) {
    // ── Churches ──
    case 'check': {
      // Tick (or untick) one KYB check on an application, with the evidence seen.
      const check = KYB_CHECKS.find((c) => c.id === b.check);
      if (!check) return json({ error: 'Unknown check.' }, 400);
      if (b.ok === true && !note) return json({ error: 'Write what you checked (e.g. the register entry you saw).' }, 400);
      const { data: app } = await db.from('church_applications').select('checks, status').eq('id', id).maybeSingle();
      if (!app || !['submitted', 'in_review'].includes(app.status)) return json({ error: 'Application not open.' }, 404);
      const checks: Checks = { ...(app.checks ?? {}), [check.id]: { ok: b.ok === true, note, by: me.email, at: now() } };
      await db.from('church_applications').update({ checks, status: 'in_review' }).eq('id', id);
      await audit(actor, b.ok === true ? 'kyb.check' : 'kyb.uncheck', 'application', id, { check: check.id, note });
      return json({ ok: true, checks });
    }

    case 'decide_application': {
      const { data: app } = await db.from('church_applications').select('*').eq('id', id).maybeSingle();
      if (!app || !['submitted', 'in_review'].includes(app.status)) return json({ error: 'Application not open.' }, 404);
      if (!note) return json({ error: 'Write the reason for the decision.' }, 400);
      if (b.decision === 'reject') {
        await db.from('church_applications').update({ status: 'rejected', reviewer: me.email, reviewed_at: now(), decision_note: note }).eq('id', id);
        await audit(actor, 'application.reject', 'application', id, { church: app.church_name, note });
        return json({ ok: true });
      }
      const tier = b.tier as Tier;
      if (!TIERS.includes(tier)) return json({ error: 'Choose a tier.' }, 400);
      const missing = missingFor(tier, app.checks ?? {});
      if (missing.length) return json({ error: `Not every ${tier} check is done: ${missing.join(', ')}.` }, 409);
      const churchId = churchIdFor(app.church_name, app.city);
      await db.from('church_applications').update({
        status: 'approved', tier, church_id: churchId, reviewer: me.email, reviewed_at: now(), decision_note: note,
      }).eq('id', id);
      await db.from('church_tiers').upsert({ church_id: churchId, tier, checks: app.checks, set_by: actor, note });
      await db.from('church_members').upsert({
        church_id: churchId, email: app.contact_email, display_name: app.leader_name, role_title: app.leader_role,
        role: 'admin', invited_by: actor, removed_at: null,
      }, { onConflict: 'church_id,email' });
      await audit(actor, 'application.approve', 'church', churchId, { application: id, tier, note });
      return json({ ok: true, churchId });
    }

    case 'set_tier': {
      // Re-check, upgrade, downgrade or suspend an existing church.
      const churchId = String(b.churchId ?? '');
      const tier = String(b.tier ?? '');
      if (![...TIERS, 'Suspended'].includes(tier)) return json({ error: 'Choose a tier.' }, 400);
      if (!note) return json({ error: 'Write the reason.' }, 400);
      await db.from('church_tiers').upsert({ church_id: churchId, tier, checks: b.checks ?? {}, set_by: actor, set_at: now(), note });
      await audit(actor, tier === 'Suspended' ? 'church.suspend' : 'church.tier', 'church', churchId, { tier, note });
      return json({ ok: true });
    }

    case 'verify_payout': {
      const churchId = String(b.churchId ?? '');
      const { data: open } = await db.from('screening_results').select('id').eq('subject_type', 'payout_account')
        .eq('subject_ref', churchId).neq('decision', 'clear').is('reviewed_at', null).limit(1);
      if (open?.length) return json({ error: 'The account name has a possible sanctions match — review it first.' }, 409);
      if (!note) return json({ error: 'Write how you verified it (e.g. Paystack name check matched).' }, 400);
      const { data } = await db.from('church_payout_accounts').update({ verified_at: now() }).eq('church_id', churchId).is('verified_at', null).select('church_id');
      if (!data?.length) return json({ error: 'No account waiting.' }, 404);
      await audit(actor, 'payout.verify', 'church', churchId, { note });
      return json({ ok: true });
    }

    // ── Burden wording ──
    case 'edit': {
      const { data: edit } = await db.from('burden_edits').select('*').eq('id', Number(id)).eq('status', 'pending').maybeSingle();
      if (!edit) return json({ error: 'Edit not found.' }, 404);
      const approve = b.decision === 'approve';
      if (!approve && !note) return json({ error: 'Tell the church why, so they can fix it.' }, 400);
      await db.from('burden_edits').update({ status: approve ? 'approved' : 'rejected', reviewer: me.email, reviewed_at: now(), review_note: note || null }).eq('id', edit.id);
      if (approve) {
        const { data: cur } = await db.from('burden_content').select('fields').eq('campaign_id', edit.campaign_id).maybeSingle();
        await db.from('burden_content').upsert({
          campaign_id: edit.campaign_id, fields: { ...(cur?.fields ?? {}), ...edit.fields }, edit_id: edit.id, approved_at: now(), approved_by: actor,
        });
      }
      await audit(actor, approve ? 'edit.approve' : 'edit.reject', 'burden', edit.campaign_id, { edit: edit.id, fields: Object.keys(edit.fields), note });
      return json({ ok: true });
    }

    // ── Words, reports, updates ──
    case 'message': {
      if (!['approve', 'reject'].includes(String(b.decision))) return json({ error: 'Approve or reject.' }, 400);
      const { data } = await db.from('support_messages').update({
        status: b.decision === 'approve' ? 'approved' : 'rejected', checked_by: 'reviewer', reviewer: me.email, checked_at: now(),
      }).eq('id', Number(id)).eq('status', 'held').select('id, campaign_id');
      if (!data?.length) return json({ error: 'Not in the queue.' }, 404);
      await audit(actor, `support.${b.decision}`, 'support', id, { campaign: data[0].campaign_id, note });
      return json({ ok: true });
    }

    case 'report': {
      const remove = b.decision === 'remove';
      if (!note) return json({ error: 'Write the reason.' }, 400);
      const { data: r } = await db.from('content_reports').select('*').eq('id', Number(id)).eq('status', 'open').maybeSingle();
      if (!r) return json({ error: 'Report not open.' }, 404);
      if (remove) {
        if (r.kind === 'update') await db.from('burden_updates').update({ hidden_at: now() }).eq('id', Number(r.ref));
        if (r.kind === 'support') await db.from('support_messages').update({ status: 'rejected', reviewer: me.email, checked_at: now() }).eq('id', Number(r.ref));
        if (r.kind === 'fundraiser') await db.from('fundraisers').update({ status: 'hidden', status_note: note }).eq('id', r.ref);
      }
      await db.from('content_reports').update({ status: remove ? 'removed' : 'kept', reviewer: me.email, reviewed_at: now() }).eq('id', r.id);
      await audit(actor, remove ? 'report.remove' : 'report.keep', r.kind, r.ref, { report: r.id, reason: r.reason, note });
      return json({ ok: true });
    }

    case 'hide_update': {
      if (!note) return json({ error: 'Write the reason.' }, 400);
      const { data } = await db.from('burden_updates').update({ hidden_at: now() }).eq('id', Number(id)).is('hidden_at', null).select('id, campaign_id');
      if (!data?.length) return json({ error: 'Update not found.' }, 404);
      await audit(actor, 'update.hide', 'update', id, { campaign: data[0].campaign_id, note });
      return json({ ok: true });
    }

    // ── Sanctions ──
    case 'screening': {
      if (!['clear', 'confirmed'].includes(String(b.outcome))) return json({ error: 'Clear or confirmed.' }, 400);
      if (!note) return json({ error: 'Write what you compared (dates of birth, places, etc.).' }, 400);
      const { data: row } = await db.from('screening_results').update({
        reviewed_by: me.email, reviewed_at: now(), review_note: note, decision: b.outcome === 'clear' ? 'clear' : 'blocked',
      }).eq('id', Number(id)).is('reviewed_at', null).select('subject_type, subject_ref').maybeSingle();
      if (!row) return json({ error: 'Not in the queue.' }, 404);
      if (row.subject_type === 'donor') {
        await db.from('gifts').update({ screening: b.outcome === 'clear' ? 'clear' : 'blocked' }).eq('donor_email', row.subject_ref).eq('screening', 'review');
      }
      // A donor's email never goes in the log — the screening row id does.
      await audit(actor, `screening.${b.outcome}`, 'screening', id, { subject: row.subject_type, note });
      return json({ ok: true });
    }

    // ── The team ──
    case 'admin_add':
    case 'admin_remove': {
      if (me.role !== 'owner') return json({ error: 'Only an owner can change the BURDEN team.' }, 403);
      const email = String(b.email ?? '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Enter their email.' }, 400);
      if (b.action === 'admin_remove') {
        if (email === me.email) return json({ error: 'You cannot remove yourself.' }, 400);
        await db.from('burden_admins').update({ removed_at: now() }).eq('email', email);
        await audit(actor, 'admin.remove', 'admin', email);
        return json({ ok: true });
      }
      const name = String(b.name ?? '').trim().slice(0, 80);
      if (!name) return json({ error: 'Enter their name.' }, 400);
      const role = b.role === 'owner' ? 'owner' : 'reviewer';
      await db.from('burden_admins').upsert({ email, name, role, added_by: actor, added_at: now(), removed_at: null });
      await audit(actor, 'admin.add', 'admin', email, { role });
      return json({ ok: true });
    }

    default:
      return json({ error: 'Unknown action.' }, 400);
  }
});
