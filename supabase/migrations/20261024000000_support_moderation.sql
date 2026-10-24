-- BURDEN — words of support with an automated review queue (2026-10-24).
-- A giver's message is stored with their gift, checked once the payment is
-- confirmed (rules, then Claude — supabase/functions/_shared/moderation.ts),
-- and only "approved" messages are ever shown publicly. "held" messages wait
-- for a BURDEN reviewer (moderation-queue). Amounts are never stored here.

create table public.support_messages (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  gift_id      uuid not null unique references public.gifts (id) on delete cascade,
  campaign_id  text not null,
  display_name text not null,          -- the giver's name, or "Anonymous"
  message      text not null check (char_length(message) between 1 and 280),
  -- awaiting_payment → (approved | held | rejected); held → approved | rejected by a reviewer
  status       text not null default 'awaiting_payment'
               check (status in ('awaiting_payment', 'approved', 'held', 'rejected')),
  reasons      text[] not null default '{}',
  checked_by   text,                   -- rules / ai / rules+ai / fallback / reviewer
  checked_at   timestamptz,
  reviewer     text
);

create index support_public_idx on public.support_messages (campaign_id, created_at desc) where status = 'approved';
create index support_queue_idx on public.support_messages (created_at) where status = 'held';

alter table public.support_messages enable row level security;
