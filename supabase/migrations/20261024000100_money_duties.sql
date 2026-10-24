-- BURDEN — the money duties the blueprint requires (2026-10-24):
--   refunds within 7 days · email receipts · Gift Aid declarations ·
--   sanctions screening · live exchange rates · SMS receipts for USSD.

-- ── Refunds ─────────────────────────────────────────────────────────────

alter table public.gifts drop constraint gifts_status_check;
alter table public.gifts add constraint gifts_status_check
  check (status in ('initiated', 'held', 'paid_out', 'church_confirmed', 'failed', 'cancelled', 'refunded'));
alter table public.gift_events drop constraint gift_events_step_check;
alter table public.gift_events add constraint gift_events_step_check
  check (step in ('gift_sent', 'payment_confirmed', 'held', 'paid_out', 'church_confirmed', 'failed', 'cancelled', 'refunded'));

alter table public.gifts
  add column refund_ref        text,
  add column receipt_number    bigint,
  add column receipt_sent_at   timestamptz,
  add column sms_sent_at       timestamptz,
  add column gift_aid          boolean not null default false,
  add column fx_source         text,
  add column screening         text not null default 'clear' check (screening in ('clear', 'review', 'blocked'));

create sequence public.receipt_numbers start 1000;

-- transition_gift learns "refunded": from held (before payout) or paid_out
-- (BURDEN refunds from its own balance and recovers it from the church's
-- next payout). The 7-day window is checked by request-refund.
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
    when 'held'             then array['initiated', 'failed', 'cancelled']
    when 'failed'           then array['initiated']
    when 'cancelled'        then array['initiated']
    when 'paid_out'         then array['held']
    when 'church_confirmed' then array['paid_out']
    when 'refunded'         then array['held', 'paid_out']
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
         hold_until     = coalesce((p_patch->>'hold_until')::timestamptz, hold_until),
         refund_ref     = coalesce(p_patch->>'refund_ref', refund_ref)
   where id = p_gift_id
     and status = any (v_from);
  get diagnostics v_count = row_count;
  if v_count = 0 then
    return false;
  end if;

  if p_to = 'held' then
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

-- Hand out receipt numbers in order, once per gift.
create or replace function public.assign_receipt_number(p_gift_id uuid)
returns bigint
language sql
security definer
set search_path = public
as $$
  update gifts set receipt_number = coalesce(receipt_number, nextval('receipt_numbers'))
   where id = p_gift_id
  returning receipt_number;
$$;

revoke execute on function public.transition_gift(uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.assign_receipt_number(uuid) from public, anon, authenticated;

-- ── Gift Aid (UK) ───────────────────────────────────────────────────────
-- HMRC needs: full name, home address (first line), postcode, and the
-- declaration wording the donor agreed to. Exported for Charities Online.

create table public.gift_aid_declarations (
  gift_id      uuid primary key references public.gifts (id) on delete cascade,
  declared_at  timestamptz not null default now(),
  title        text,
  first_name   text not null,
  last_name    text not null,
  house        text not null,
  postcode     text not null,
  wording      text not null,
  claimed_at   timestamptz            -- set when included in an HMRC claim
);
alter table public.gift_aid_declarations enable row level security;

-- ── Sanctions screening ─────────────────────────────────────────────────

create table public.sanctions_entries (
  id          bigint generated always as identity primary key,
  list        text not null,            -- 'OFAC-SDN', 'UK', …
  list_ref    text,
  name        text not null,
  tokens      text[] not null,          -- normalised name words (sanctions-logic.ts)
  loaded_at   timestamptz not null default now()
);
create index sanctions_tokens_idx on public.sanctions_entries using gin (tokens);
alter table public.sanctions_entries enable row level security;

create table public.screening_results (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  subject_type  text not null check (subject_type in ('donor', 'church', 'payout_account')),
  subject_ref   text not null,           -- gift id or church id
  name          text not null,
  score         numeric(4, 3) not null,
  matched_name  text,
  matched_list  text,
  decision      text not null check (decision in ('clear', 'review', 'blocked')),
  reviewed_by   text,
  reviewed_at   timestamptz,
  review_note   text
);
create index screening_open_idx on public.screening_results (created_at) where decision <> 'clear' and reviewed_at is null;
alter table public.screening_results enable row level security;

-- ── Exchange rates ──────────────────────────────────────────────────────
-- USD → local currency, fetched from a public source and passed through
-- with no BURDEN margin (blueprint §8: "we do not earn FX margin").

create table public.fx_rates (
  currency    text not null,
  rate        numeric(18, 6) not null check (rate > 0),
  source      text not null,
  fetched_at  timestamptz not null default now(),
  primary key (currency, fetched_at)
);
alter table public.fx_rates enable row level security;
