-- supabase/migrations/20260314000000_add_role_to_profiles.sql
-- Adds role column to profiles.
-- DEFAULT 'student' backfills all existing rows as 'student'.
-- Parents are updated to 'parent' by the setupChildAccount server action.
-- NOTE: If this is not a fresh dev DB, add a backfill:
--   UPDATE profiles SET role = 'parent' WHERE <known parent ids>;

-- NOTE: No new SELECT policy added here.
-- The existing "Players can view own profile" policy in 20260310000000_create_core_tables.sql
-- uses auth.uid() = id (no role filter), which already covers all users including parents.
-- Adding a second SELECT policy would be redundant and misleading.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';
