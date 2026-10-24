// Monthly gifts on the server: create a plan with the first gift, switch it
// on once that gift is paid, charge each following month, record Stripe's
// own monthly charges, and let the donor stop it with their private token.
// Rules live in plan-logic.ts.

import { randomToken, sha256Hex, timingSafeEqual } from './crypto.ts';
import type { GiftInput } from './gift-input.ts';
import { chargeMomo, type MomoNetwork } from './momo.ts';
import { MAX_FAILURES, nextMonth, planRouteFor } from './plan-logic.ts';
import {
  cancelStripeSubscription, chargePaystackAuthorization, type Verification,
} from './providers.ts';
import { applyVerification, db, type FullGift, loadGift, secrets, verifyAndApply } from './server.ts';

// Called by create-gift (and momo-charge) for a gift marked monthly.
export async function createPlan(input: GiftInput, giftId: string): Promise<{ planId: string; planToken: string }> {
  const planToken = randomToken();
  const { data, error } = await db.from('recurring_plans').insert({
    cancel_token_hash: await sha256Hex(planToken),
    campaign_id: input.campaign_id,
    campaign_title: input.campaign_title,
    church_id: input.church_id,
    church_name: input.church_name,
    amount_minor: input.amount_minor,
    cover_fee: input.fee_minor > 0,
    anonymous: input.anonymous,
    donor_name: input.donor_name,
    donor_email: input.donor_email,
    provider: input.provider,
    return_url: input.return_url,
  }).select('id').single();
  if (error) throw error;
  await db.from('gifts').update({ plan_id: data.id }).eq('id', giftId);
  return { planId: data.id as string, planToken };
}

// The first gift went through: work out how later months are paid.
export async function activatePlan(gift: FullGift, v: Extract<Verification, { outcome: 'paid' }>) {
  if (!gift.plan_id) return;
  const route = planRouteFor(gift.provider, v, {
    phone: (gift.momo_phone as string | null) ?? null,
    network: (gift.momo_network as MomoNetwork | null) ?? null,
  });
  const patch = route.ok
    ? {
      status: 'active',
      status_note: null,
      method: route.method,
      paystack_auth_code: route.method === 'card' ? route.paystack_auth_code : null,
      momo_phone: route.method === 'momo' ? route.momo_phone : null,
      momo_network: route.method === 'momo' ? route.momo_network : null,
      stripe_subscription: route.method === 'subscription' ? route.stripe_subscription : null,
      // Stripe schedules its own months; the others are charged by run-recurring.
      next_charge_at: route.method === 'subscription' ? null : nextMonth(new Date()).toISOString(),
    }
    : { status: 'stopped', status_note: route.note };
  await db.from('recurring_plans').update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', gift.plan_id).eq('status', 'pending');
}

type Plan = Record<string, any>;

// A new gift row for this month, copied from the plan and the first gift.
async function newMonthGift(plan: Plan, first: FullGift): Promise<FullGift> {
  const { data: id, error } = await db.rpc('create_gift', {
    p_gift: {
      access_token_hash: first.access_token_hash, // the donor's first-gift link still opens every month
      campaign_id: plan.campaign_id, campaign_title: plan.campaign_title,
      church_id: plan.church_id, church_name: plan.church_name,
      currency: 'USD', amount_minor: first.amount_minor, fee_minor: first.fee_minor, total_minor: first.total_minor,
      charge_currency: first.charge_currency, charge_amount_minor: first.charge_amount_minor, fx_rate: first.fx_rate,
      recurring: true, anonymous: plan.anonymous, donor_name: plan.donor_name, donor_email: plan.donor_email,
      provider: plan.provider, return_url: plan.return_url, test_mode: first.test_mode,
    },
  });
  if (error) throw error;
  await db.from('gifts').update({
    plan_id: plan.id, momo_phone: plan.momo_phone, momo_network: plan.momo_network,
  }).eq('id', id);
  return (await loadGift(id as string))!;
}

async function firstGiftOf(plan: Plan): Promise<FullGift | null> {
  const { data } = await db.from('gifts').select('*').eq('plan_id', plan.id)
    .order('created_at', { ascending: true }).limit(1).maybeSingle();
  return (data as FullGift | null) ?? null;
}

// Scheduled (run-recurring): charge every Paystack plan that is due.
export async function runDuePlans(now = new Date()): Promise<{ charged: number; failed: number }> {
  const { data: plans, error } = await db.from('recurring_plans').select('*')
    .eq('status', 'active').lte('next_charge_at', now.toISOString()).limit(200);
  if (error) throw error;
  let charged = 0, failed = 0;
  for (const plan of plans ?? []) {
    // Claim the month first, so a second run can't charge it twice.
    const { data: claimed } = await db.from('recurring_plans')
      .update({ next_charge_at: nextMonth(new Date(plan.next_charge_at)).toISOString(), updated_at: now.toISOString() })
      .eq('id', plan.id).eq('next_charge_at', plan.next_charge_at).select('id');
    if (!claimed?.length) continue;
    try {
      const first = await firstGiftOf(plan);
      if (!first) throw new Error('first gift missing');
      const gift = await newMonthGift(plan, first);
      if (plan.method === 'card') {
        await chargePaystackAuthorization(gift, plan.paystack_auth_code, secrets);
        await verifyAndApply(gift, 'recurring');
      } else if (plan.method === 'momo') {
        // The donor gets a prompt and approves it on their phone, as in month one.
        await chargeMomo(gift, plan.momo_phone, plan.momo_network, secrets);
      }
      await db.from('recurring_plans').update({ failures: 0 }).eq('id', plan.id);
      charged++;
    } catch (e) {
      console.error('recurring charge failed', plan.id, e);
      failed++;
      const failures = (plan.failures ?? 0) + 1;
      await db.from('recurring_plans').update(failures >= MAX_FAILURES
        ? { failures, status: 'stopped', status_note: 'Stopped after three months in a row could not be charged.' }
        : { failures }).eq('id', plan.id);
    }
  }
  return { charged, failed };
}

// Stripe charged a later month itself (invoice.paid): record it as a gift
// that is already paid and held.
export async function recordStripeCycle(c: { subscription: string; invoice: string; amountPaid: number; currency: string }) {
  const { data: plan } = await db.from('recurring_plans').select('*')
    .eq('stripe_subscription', c.subscription).maybeSingle();
  if (!plan || plan.status !== 'active') return;
  const { data: seen } = await db.from('gifts').select('id').eq('provider_ref', c.invoice).maybeSingle();
  if (seen) return; // webhook retried
  const first = await firstGiftOf(plan);
  if (!first) return;
  const gift = await newMonthGift(plan, first);
  await applyVerification(gift, c.amountPaid === gift.charge_amount_minor && c.currency === gift.charge_currency
    ? { outcome: 'paid', providerRef: c.invoice, method: 'card' }
    : { outcome: 'failed', reason: 'The amount charged did not match your monthly gift. No funds were released.' },
  'webhook');
}

// The donor stops their monthly gift with the private token from checkout.
export async function cancelPlan(planId: string, token: string): Promise<'stopped' | 'not_found'> {
  if (!/^[0-9a-f-]{36}$/i.test(planId)) return 'not_found';
  const { data: plan } = await db.from('recurring_plans').select('*').eq('id', planId).maybeSingle();
  if (!plan || !timingSafeEqual(plan.cancel_token_hash, await sha256Hex(token))) return 'not_found';
  if (plan.stripe_subscription && plan.status === 'active') {
    await cancelStripeSubscription(plan.stripe_subscription, secrets);
  }
  await db.from('recurring_plans').update({
    status: 'cancelled', status_note: 'You stopped this monthly gift.', next_charge_at: null,
    paystack_auth_code: null, updated_at: new Date().toISOString(),
  }).eq('id', planId);
  return 'stopped';
}
