-- Phase 2: Add agent_id column to profiles for agent selection persistence
alter table public.profiles
  add column if not exists agent_id text
    check (agent_id in ('cooper', 'arlo', 'minh', 'maya'))
    default null;
