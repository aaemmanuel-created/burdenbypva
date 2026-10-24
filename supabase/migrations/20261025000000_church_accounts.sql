-- BURDEN — church accounts, church-posted updates and notifications (2026-10-25).
--
-- Church staff sign in with Supabase Auth (a one-time code by email). Who may
-- act for which church is decided here, by email, in church_members — a
-- BURDEN reviewer adds a church's first admin; that admin can add the rest.
-- Everything is read and written through the `church` edge function, never
-- directly by the browser (RLS on, no policies).

create table public.church_members (
  id            bigint generated always as identity primary key,
  church_id     text not null,
  email         text not null check (email = lower(email)),
  display_name  text not null,             -- shown on updates: "Rev. Mary Wanjiku"
  role_title    text not null default '',  -- shown on updates: "Burden lead"
  role          text not null default 'editor' check (role in ('admin', 'editor')),
  invited_by    text not null,
  invited_at    timestamptz not null default now(),
  removed_at    timestamptz,
  unique (church_id, email)
);
alter table public.church_members enable row level security;

-- Updates a church posts on its burden. Shown publicly at once — they come
-- from verified church staff, and every one names its author.
create table public.burden_updates (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  campaign_id  text not null,
  church_id    text not null,
  author       text not null,
  role_title   text not null default '',
  title        text not null check (char_length(title) between 3 and 120),
  body         text not null check (char_length(body) between 10 and 2000),
  hidden_at    timestamptz,                -- a BURDEN reviewer can hide one
  notified_at  timestamptz                 -- set once the giver emails / pushes went out
);
create index burden_updates_public_idx on public.burden_updates (campaign_id, created_at desc) where hidden_at is null;
alter table public.burden_updates enable row level security;

-- Payout accounts: who at the church asked for this one (the reviewer still verifies).
alter table public.church_payout_accounts add column submitted_by text;

-- ── Notifications ───────────────────────────────────────────────────────

-- Opt in at the Give screen to emails when the church posts an update.
-- (Messages about your own gift — reached the church, church confirmed —
-- are part of the service and always sent.)
alter table public.gifts add column notify_updates boolean not null default false;

-- Phone push tokens (Expo), tied to the gifts they follow.
create table public.push_tokens (
  token       text not null,
  gift_id     uuid not null references public.gifts (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (token, gift_id)
);
alter table public.push_tokens enable row level security;

-- One row per gift event already announced, so the sweep never repeats one.
create table public.notifications_sent (
  gift_id   uuid not null references public.gifts (id) on delete cascade,
  step      text not null,
  sent_at   timestamptz not null default now(),
  primary key (gift_id, step)
);
alter table public.notifications_sent enable row level security;
