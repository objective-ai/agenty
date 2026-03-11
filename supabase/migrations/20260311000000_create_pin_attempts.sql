-- ============================================================
-- AGENTY: PIN Attempts Rate Limiting Table
-- Tracks failed PIN verification attempts per profile.
-- Used by rate limiting logic to enforce cooldown windows.
-- Security: RLS enabled, NO public policies — service_role only.
-- ============================================================

create table public.pin_attempts (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  attempted_at timestamptz not null default now()
);

comment on table public.pin_attempts is 'Rate-limiting ledger for PIN verification attempts.';

-- Index for fast window queries: "how many attempts in the last 15 minutes?"
create index idx_pin_attempts_profile_window
  on public.pin_attempts(profile_id, attempted_at desc);

-- RLS: no public access — only service_role can read/write.
-- This ensures rate limiting is purely server-side.
alter table public.pin_attempts enable row level security;
-- No policies = anon and authenticated roles have zero access.
