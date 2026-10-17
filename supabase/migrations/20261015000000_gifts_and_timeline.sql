-- BURDEN by HOUSEPVA — gifts + the step-by-step tracking timeline.
--
-- A gift moves through:  initiated → held → paid_out → church_confirmed
-- with two dead ends:     initiated → failed | cancelled
--
-- Every move writes a row to gift_events, which is what the donor's
-- timeline renders. Moves only happen through transition_gift(), which is
-- idempotent: a webhook and a redirect-return racing to confirm the same
-- payment produce exactly one "payment confirmed" event.
--
-- RLS is on with no policies: only the edge functions (service role) can
-- read or write. Donors read their own gift through the gift-status
-- function, using the private token they were handed at checkout.

create table public.gifts (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  access_token_hash   text not null,

  campaign_id         text not null,
  campaign_title      text not null,
  church_id           text not null,
  church_name         text not null,

  -- What the donor gave, in USD minor units (cents). $1 minimum, $10k cap
  -- (above $10k the blueprint requires enhanced KYC — not built yet).
  currency            text not null default 'USD',
  amount_minor        integer not null check (amount_minor between 100 and 1000000),
  fee_minor           integer not null default 0 check (fee_minor >= 0),
  total_minor         integer not null check (total_minor >= amount_minor),

  -- What the provider actually charged. Differs from USD when Paystack /
  -- Flutterwave charge in a local currency (GHS, NGN, KES …).
  charge_currency     text not null,
  charge_amount_minor bigint not null check (charge_amount_minor > 0),
  fx_rate             numeric(18, 6) not null default 1,

  recurring           boolean not null default false,
  anonymous           boolean not null default false,
  donor_name          text,
  donor_email         text not null,

  provider            text not null check (provider in ('stripe', 'paystack', 'flutterwave')),
  provider_ref        text,
  payment_method      text,

  status              text not null default 'initiated'
                      check (status in ('initiated', 'held', 'paid_out', 'church_confirmed', 'failed', 'cancelled')),
  status_note         text,
  hold_until          timestamptz,
  return_url          text not null,
  test_mode           boolean not null default true
);

create table public.gift_events (
  id          bigint generated always as identity primary key,
  gift_id     uuid not null references public.gifts (id) on delete cascade,
  step        text not null
              check (step in ('gift_sent', 'payment_confirmed', 'held', 'paid_out', 'church_confirmed', 'failed', 'cancelled')),
  occurred_at timestamptz not null default now(),
  note        text,
  source      text not null default 'system'
);

create index gift_events_gift_idx on public.gift_events (gift_id, occurred_at, id);
create index gifts_held_idx on public.gifts (hold_until) where status = 'held';

alter table public.gifts enable row level security;
alter table public.gift_events enable row level security;

-- Insert a gift and its first timeline event in one go.
create or replace function public.create_gift(p_gift jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into gifts (
    access_token_hash, campaign_id, campaign_title, church_id, church_name,
    currency, amount_minor, fee_minor, total_minor,
    charge_currency, charge_amount_minor, fx_rate,
    recurring, anonymous, donor_name, donor_email,
    provider, return_url, test_mode
  ) values (
    p_gift->>'access_token_hash', p_gift->>'campaign_id', p_gift->>'campaign_title',
    p_gift->>'church_id', p_gift->>'church_name',
    p_gift->>'currency', (p_gift->>'amount_minor')::int, (p_gift->>'fee_minor')::int,
    (p_gift->>'total_minor')::int,
    p_gift->>'charge_currency', (p_gift->>'charge_amount_minor')::bigint,
    (p_gift->>'fx_rate')::numeric,
    (p_gift->>'recurring')::boolean, (p_gift->>'anonymous')::boolean,
    p_gift->>'donor_name', p_gift->>'donor_email',
    p_gift->>'provider', p_gift->>'return_url', (p_gift->>'test_mode')::boolean
  )
  returning id into v_id;

  insert into gift_events (gift_id, step, source) values (v_id, 'gift_sent', 'donor');
  return v_id;
end;
$$;

-- Move a gift to a new status if (and only if) it is in an allowed prior
-- status. Returns true when this call made the move, false when the gift
-- was already past it (so callers can safely retry).
create or replace function public.transition_gift(
  p_gift_id uuid,
  p_to      text,
  p_note    text  default null,
  p_source  text  default 'system',
  p_patch   jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from  text[];
  v_count int;
begin
  v_from := case p_to
    -- A late success after a failure/cancel is real money — accept it.
    when 'held'             then array['initiated', 'failed', 'cancelled']
    when 'failed'           then array['initiated']
    when 'cancelled'        then array['initiated']
    when 'paid_out'         then array['held']
    when 'church_confirmed' then array['paid_out']
  end;
  if v_from is null then
    raise exception 'transition_gift: unknown status %', p_to;
  end if;

  update gifts
     set status         = p_to,
         status_note    = p_note,
         updated_at     = now(),
         provider_ref   = coalesce(p_patch->>'provider_ref', provider_ref),
         payment_method = coalesce(p_patch->>'payment_method', payment_method),
         hold_until     = coalesce((p_patch->>'hold_until')::timestamptz, hold_until)
   where id = p_gift_id
     and status = any (v_from);
  get diagnostics v_count = row_count;
  if v_count = 0 then
    return false;
  end if;

  if p_to = 'held' then
    -- Confirmation and the start of the hold happen together.
    insert into gift_events (gift_id, step, note, source) values
      (p_gift_id, 'payment_confirmed', p_note, p_source),
      (p_gift_id, 'held', null, p_source);
  else
    insert into gift_events (gift_id, step, note, source) values
      (p_gift_id, p_to, p_note, p_source);
  end if;
  return true;
end;
$$;

-- Test mode only: once a gift's hold has ended, record a simulated payout.
-- Live gifts are never touched here — real payouts (Stripe Connect,
-- Paystack subaccounts, Flutterwave transfers) are a separate piece of work.
create or replace function public.settle_due_test_gifts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n int := 0;
begin
  for r in
    select id from gifts
     where status = 'held' and test_mode and hold_until <= now()
     for update skip locked
  loop
    if transition_gift(r.id, 'paid_out', 'Simulated payout — test mode, no money moved.', 'system') then
      n := n + 1;
    end if;
  end loop;
  return n;
end;
$$;

revoke execute on function public.create_gift(jsonb) from public, anon, authenticated;
revoke execute on function public.transition_gift(uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.settle_due_test_gifts() from public, anon, authenticated;
