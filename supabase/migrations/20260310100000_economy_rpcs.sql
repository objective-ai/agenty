-- ============================================================
-- AGENTY: Economy RPC Functions — "The Loot Guard"
-- Transactional server-side functions for gold & energy ops.
-- Called via service_role from Next.js Server Actions.
-- ============================================================

-- Prevent double-claiming quest rewards at the DB level.
-- Only applies to rows where metadata has a quest_id.
create unique index idx_loot_ledger_quest_unique
  on public.loot_ledger ((metadata->>'quest_id'))
  where metadata->>'quest_id' is not null;

-- =========================
-- award_loot
-- =========================
-- Awards gold to a player and records the transaction.
-- Uses FOR UPDATE to lock the profile row for the duration,
-- preventing concurrent race conditions on gold balance.
create or replace function public.award_loot(
  p_profile_id  uuid,
  p_amount      bigint,
  p_source      text,
  p_quest_id    text default null,
  p_description text default null
)
returns table(new_gold bigint, ledger_id uuid) as $$
declare
  v_current_gold bigint;
  v_new_gold     bigint;
  v_ledger_id    uuid;
begin
  -- Lock the profile row to prevent concurrent modifications
  select gold into v_current_gold
    from public.profiles
    where id = p_profile_id
    for update;

  if not found then
    raise exception 'profile_not_found';
  end if;

  v_new_gold := v_current_gold + p_amount;

  -- Update gold balance (CHECK constraint enforces gold >= 0)
  update public.profiles
    set gold = v_new_gold
    where id = p_profile_id;

  -- Insert ledger record (unique index enforces quest_id uniqueness)
  insert into public.loot_ledger (profile_id, amount, balance_after, source, description, metadata)
    values (
      p_profile_id,
      p_amount,
      v_new_gold,
      p_source,
      p_description,
      case when p_quest_id is not null
           then jsonb_build_object('quest_id', p_quest_id)
           else '{}'::jsonb
      end
    )
    returning id into v_ledger_id;

  return query select v_new_gold, v_ledger_id;
end;
$$ language plpgsql security definer;

-- =========================
-- spend_energy
-- =========================
-- Deducts energy from a player and logs the activity.
-- Raises 'insufficient_energy' if the player can't afford it.
create or replace function public.spend_energy(
  p_profile_id  uuid,
  p_energy_cost int,
  p_activity    text,
  p_metadata    jsonb default '{}'
)
returns table(remaining_energy int, log_id uuid) as $$
declare
  v_current_energy int;
  v_new_energy     int;
  v_log_id         uuid;
begin
  select energy into v_current_energy
    from public.profiles
    where id = p_profile_id
    for update;

  if not found then
    raise exception 'profile_not_found';
  end if;

  v_new_energy := v_current_energy - p_energy_cost;

  if v_new_energy < 0 then
    raise exception 'insufficient_energy';
  end if;

  update public.profiles
    set energy = v_new_energy
    where id = p_profile_id;

  insert into public.energy_logs (profile_id, energy_cost, activity, metadata)
    values (p_profile_id, p_energy_cost, p_activity, p_metadata)
    returning id into v_log_id;

  return query select v_new_energy, v_log_id;
end;
$$ language plpgsql security definer;
