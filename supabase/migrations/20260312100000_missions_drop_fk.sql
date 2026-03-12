-- ============================================================
-- Drop FK on missions.created_by so dev mode works with "dev-user".
-- The column becomes text — RLS policies enforce ownership in prod.
-- ============================================================

-- Drop RLS policies that depend on created_by type
drop policy if exists "Parents can view own missions" on public.missions;
drop policy if exists "Parents can insert own missions" on public.missions;
drop policy if exists "Parents can update own missions" on public.missions;
drop policy if exists "Parents can delete own missions" on public.missions;

-- Drop FK and change column type to text
alter table public.missions drop constraint if exists missions_created_by_fkey;
alter table public.missions alter column created_by type text using created_by::text;

-- Recreate RLS policies with text comparison (auth.uid()::text)
create policy "Parents can view own missions"
  on public.missions for select
  using (auth.uid()::text = created_by);

create policy "Parents can insert own missions"
  on public.missions for insert
  with check (auth.uid()::text = created_by);

create policy "Parents can update own missions"
  on public.missions for update
  using (auth.uid()::text = created_by)
  with check (auth.uid()::text = created_by);

create policy "Parents can delete own missions"
  on public.missions for delete
  using (auth.uid()::text = created_by);
