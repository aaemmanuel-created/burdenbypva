-- BURDEN — mobile money, monthly gifts and church payouts (2026-10-22).
-- Studied from MTN MoMo and expressPay with REA:
--   • approve-on-your-phone MoMo  → gifts.momo_phone / momo_network
--   • monthly gifts that repeat    → recurring_plans (Paystack card authorisation,
--                                     a fresh MoMo prompt each month, or a Stripe subscription)
--   • church payouts to MoMo/bank  → church_payout_accounts + gifts.payout_*
-- RLS stays on with no policies: only the edge functions can read or write.

-- ── Monthly gifts ───────────────────────────────────────────────────────

create table public.recurring_plans (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- The donor's private key to stop the plan, handed out once at checkout.
  cancel_token_hash    text not null,
  -- pending until the first gift is paid; then active until the donor stops it.
  status               text not null default 'pending'
                       check (status in ('pending', 'active', 'cancelled', 'stopped')),
  status_note          text,

  campaign_id          text not null,
  campaign_title       text not null,
  church_id            text not null,
  church_name          text not null,
  amount_minor         integer not null check (amount_minor between 100 and 1000000),
  cover_fee            boolean not null default true,
  anonymous            boolean not null default false,
  donor_name           text,
  donor_email          text not null,
  provider             text not null check (provider in ('stripe', 'paystack', 'flutterwave')),
  return_url           text not null,

  -- How the next month is paid. Exactly one route applies:
  method               text check (method in ('card', 'momo', 'subscription')),
  paystack_auth_code   text,      -- reusable Paystack card authorisation
  momo_phone           text,      -- a fresh approve-on-phone prompt each month
  momo_network         text,
  stripe_subscription  text,      -- Stripe charges monthly itself

  next_charge_at       timestamptz,
  failures             integer not null default 0
);

create index recurring_due_idx on public.recurring_plans (next_charge_at) where status = 'active';

alter table public.recurring_plans enable row level security;

alter table public.gifts
  add column momo_phone   text,
  add column momo_network text check (momo_network in ('mtn', 'telecel', 'airteltigo')),
  add column plan_id      uuid references public.recurring_plans (id),
  add column payout_ref   text,
  add column payout_to    text;

-- ── Church payout accounts ──────────────────────────────────────────────

create table public.church_payout_accounts (
  church_id          text primary key,
  method             text not null check (method in ('momo', 'bank')),
  network            text,          -- mtn / telecel / airteltigo, or the bank's name
  account_name       text not null,
  account_number     text not null, -- MoMo number or bank account number
  currency           text not null default 'GHS',
  paystack_recipient text,          -- Paystack transfer recipient code
  verified_at        timestamptz,   -- set by a BURDEN reviewer, never by the church
  updated_at         timestamptz not null default now()
);

alter table public.church_payout_accounts enable row level security;

-- "MTN MoMo wallet ending 4567" — how the timeline names where money went.
create or replace function public.payout_label(p_church_id text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case a.method
           when 'momo' then upper(coalesce(a.network, '')) || ' MoMo wallet ending ' || right(a.account_number, 4)
           else coalesce(a.network, 'bank') || ' account ending ' || right(a.account_number, 4)
         end
    from church_payout_accounts a
   where a.church_id = p_church_id and a.verified_at is not null;
$$;

-- Test-mode payouts now name the church's verified account when it has one.
create or replace function public.settle_due_test_gifts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n int := 0;
  v_to text;
begin
  for r in
    select id, church_id, church_name from gifts
     where status = 'held' and test_mode and hold_until <= now()
     for update skip locked
  loop
    v_to := payout_label(r.church_id);
    if transition_gift(
         r.id, 'paid_out',
         'Simulated payout to ' || r.church_name || coalesce('''s ' || v_to, '') || ' — test mode, no money moved.',
         'system') then
      update gifts set payout_to = v_to where id = r.id;
      n := n + 1;
    end if;
  end loop;
  return n;
end;
$$;

revoke execute on function public.payout_label(text) from public, anon, authenticated;
revoke execute on function public.settle_due_test_gifts() from public, anon, authenticated;
