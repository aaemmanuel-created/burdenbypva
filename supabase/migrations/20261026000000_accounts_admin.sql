-- BURDEN — giver accounts, server-side fundraisers, church burden edits,
-- church applications (KYB), content reports, BURDEN admins and the audit
-- log (2026-10-26).
--
-- Givers sign in the same way church staff do: Supabase Auth, a one-time
-- code by email, no password. Everything is read and written through edge
-- functions (`account`, `fundraisers`, `church`, `church-apply`, `report`,
-- `admin`), never directly by the browser (RLS on, no policies).

-- ── Giver accounts ──────────────────────────────────────────────────────

-- A gift belongs to an account once the giver signs in with the email the
-- gift was made with, or claims it from the device that made it (gift token).
alter table public.gifts add column donor_user_id uuid references auth.users (id) on delete set null;
create index gifts_donor_user_idx on public.gifts (donor_user_id) where donor_user_id is not null;

-- ── Fundraisers ─────────────────────────────────────────────────────────

-- Someone carrying a burden with their own circle. Starting one needs an
-- account, so the page has an owner who can close it. Gifts through it still
-- go to the church's verified account; the fundraiser only counts them.
create table public.fundraisers (
  id             text primary key check (id ~ '^fr_[a-z0-9]{10,}$'),
  created_at     timestamptz not null default now(),
  campaign_id    text not null,
  owner_user_id  uuid references auth.users (id) on delete set null,  -- null once the organiser deletes their account
  name           text not null check (char_length(name) between 1 and 80),
  note           text not null check (char_length(note) between 1 and 280),
  goal_minor     integer not null check (goal_minor >= 100),
  status         text not null default 'open' check (status in ('open', 'closed', 'hidden')),
  status_note    text
);
create index fundraisers_campaign_idx on public.fundraisers (campaign_id, created_at desc) where status = 'open';
alter table public.fundraisers enable row level security;

alter table public.gifts add column fundraiser_id text references public.fundraisers (id) on delete set null;

-- ── Burden edits by the church ──────────────────────────────────────────

-- A church proposes new wording for its burden; a BURDEN reviewer approves
-- it before it is public, because "where the money goes" is a promise to
-- givers. Approved wording lives in burden_content and overrides the text
-- the apps ship with.
create table public.burden_edits (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  campaign_id   text not null,
  church_id     text not null,
  submitted_by  text not null,
  fields        jsonb not null,
  flags         text[] not null default '{}',   -- brand-rule notes for the reviewer
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  reviewer      text,
  reviewed_at   timestamptz,
  review_note   text
);
create index burden_edits_pending_idx on public.burden_edits (created_at) where status = 'pending';
alter table public.burden_edits enable row level security;

create table public.burden_content (
  campaign_id  text primary key,
  fields       jsonb not null,
  edit_id      bigint references public.burden_edits (id),
  approved_at  timestamptz not null default now(),
  approved_by  text not null
);
alter table public.burden_content enable row level security;

-- ── Church applications (KYB) ───────────────────────────────────────────

-- A church asks to join. A BURDEN reviewer works through the checks for the
-- tier (admin-logic.ts KYB_CHECKS) and records each one with a note.
create table public.church_applications (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  church_name        text not null,
  tradition          text not null,
  city               text not null,
  country            text not null,
  leader_name        text not null,
  leader_role        text not null,
  contact_email      text not null check (contact_email = lower(contact_email)),
  registration_body  text not null,
  registration_no    text not null,
  oversight          text not null,     -- denomination, diocese or board the leadership answers to
  website            text,
  references_text    text not null,     -- two people outside the church who know its work
  creed_affirmed     boolean not null check (creed_affirmed),
  status             text not null default 'submitted' check (status in ('submitted', 'in_review', 'approved', 'rejected')),
  checks             jsonb not null default '{}',   -- { registration: { ok, note, by, at }, … }
  tier               text check (tier in ('Basic', 'Verified', 'Premium Trust')),
  church_id          text unique,                   -- set when approved
  reviewer           text,
  reviewed_at        timestamptz,
  decision_note      text
);
create index church_applications_open_idx on public.church_applications (created_at) where status in ('submitted', 'in_review');
alter table public.church_applications enable row level security;

-- Tier changes for existing churches (re-checks, downgrades) are recorded here.
create table public.church_tiers (
  church_id   text primary key,
  tier        text not null check (tier in ('Basic', 'Verified', 'Premium Trust', 'Suspended')),
  checks      jsonb not null default '{}',
  set_by      text not null,
  set_at      timestamptz not null default now(),
  note        text
);
alter table public.church_tiers enable row level security;

-- ── Reports from the public ─────────────────────────────────────────────

-- "Report" on an update, a word of support or a fundraiser. Nothing is taken
-- down automatically; a reviewer decides, and the decision is logged.
create table public.content_reports (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  kind         text not null check (kind in ('update', 'support', 'fundraiser', 'burden')),
  ref          text not null,
  campaign_id  text not null,
  reason       text not null check (reason in ('scam', 'abuse', 'false', 'private', 'other')),
  detail       text check (char_length(detail) <= 500),
  reporter     text,                    -- email if signed in, else null
  status       text not null default 'open' check (status in ('open', 'kept', 'removed')),
  reviewer     text,
  reviewed_at  timestamptz
);
create index content_reports_open_idx on public.content_reports (created_at) where status = 'open';
alter table public.content_reports enable row level security;

-- ── BURDEN admins and the audit log ─────────────────────────────────────

-- People on the BURDEN team. Reviewers work the queues; owners can also add
-- and remove admins. The first owner is added with CHURCH_ADMIN_KEY.
create table public.burden_admins (
  email       text primary key check (email = lower(email)),
  name        text not null,
  role        text not null default 'reviewer' check (role in ('reviewer', 'owner')),
  added_by    text not null,
  added_at    timestamptz not null default now(),
  removed_at  timestamptz
);
alter table public.burden_admins enable row level security;

-- Every decision a person makes about money, churches or content: who, what,
-- on what, and why. Append-only — the database refuses edits and deletes.
create table public.audit_log (
  id            bigint generated always as identity primary key,
  at            timestamptz not null default now(),
  actor         text not null,
  action        text not null,
  subject_type  text not null,
  subject_id    text not null,
  detail        jsonb not null default '{}'
);
create index audit_log_at_idx on public.audit_log (at desc);
create index audit_log_subject_idx on public.audit_log (subject_type, subject_id);
alter table public.audit_log enable row level security;

create function public.audit_log_append_only() returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end $$;
create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function public.audit_log_append_only();
