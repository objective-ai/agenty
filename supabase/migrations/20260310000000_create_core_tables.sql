-- ============================================================
-- AGENTY: Core Schema — "The Data Vault"
-- Tables: profiles, loot_ledger, energy_logs
-- Security: RLS enabled, kid can READ own rows only,
--           all WRITES go through service_role (Server Actions)
-- ============================================================

-- =========================
-- 1. PROFILES
-- =========================
-- One row per authenticated user (the kid).
-- Gold & XP are the twin currencies of the game.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Adventurer',
  avatar_url  text,
  xp          bigint  not null default 0  check (xp >= 0),
  level       int     not null default 1  check (level >= 1),
  gold        bigint  not null default 0  check (gold >= 0),
  energy      int     not null default 100 check (energy >= 0 and energy <= 200),
  streak_days int     not null default 0  check (streak_days >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Player profile — XP, level, gold, energy.';

-- Auto-update updated_at on every change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- =========================
-- 2. LOOT LEDGER
-- =========================
-- Immutable append-only log of every Gold transaction.
-- Positive amount = earned, negative = spent.
-- source examples: 'quest_complete', 'daily_bonus', 'shop_purchase'
create table public.loot_ledger (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  amount      bigint not null,
  balance_after bigint not null check (balance_after >= 0),
  source      text not null,
  description text,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

comment on table public.loot_ledger is 'Immutable audit log of all Gold transactions.';

-- Index for fast lookups by player
create index idx_loot_ledger_profile on public.loot_ledger(profile_id, created_at desc);

-- =========================
-- 3. ENERGY LOGS
-- =========================
-- Tracks screen-time energy spend per session.
-- energy_cost is always positive (amount deducted).
-- activity examples: 'reading_quest', 'video_lesson', 'practice_drill'
create table public.energy_logs (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  energy_cost int  not null check (energy_cost > 0),
  activity    text not null,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

comment on table public.energy_logs is 'Screen-time energy usage log per activity session.';

create index idx_energy_logs_profile on public.energy_logs(profile_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY — "The Loot Guard"
-- ============================================================
-- Design principle:
--   Kids can SEE their own data (SELECT).
--   Kids can NEVER directly INSERT/UPDATE/DELETE.
--   All writes happen via Server Actions using service_role key,
--   which bypasses RLS entirely.
-- ============================================================

-- PROFILES
alter table public.profiles enable row level security;

create policy "Players can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- No insert/update/delete policies for anon/authenticated.
-- service_role bypasses RLS, so Server Actions can write freely.

-- LOOT LEDGER
alter table public.loot_ledger enable row level security;

create policy "Players can view own loot history"
  on public.loot_ledger for select
  using (auth.uid() = profile_id);

-- ENERGY LOGS
alter table public.energy_logs enable row level security;

create policy "Players can view own energy logs"
  on public.energy_logs for select
  using (auth.uid() = profile_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
-- When a new user signs up via Supabase Auth, automatically
-- create their profile row so the Command Center is ready.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Adventurer'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
