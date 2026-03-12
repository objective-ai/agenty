-- Phase 3: Expanded Command Deck columns for mission generation
-- Adds customization fields for problem count, difficulty, theme, time estimate, and banner.

ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS problem_count int NOT NULL DEFAULT 3 CHECK (problem_count IN (3, 5, 10)),
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  ADD COLUMN IF NOT EXISTS narrative_theme text NOT NULL DEFAULT 'space' CHECK (narrative_theme IN ('space', 'nature', 'history', 'fantasy')),
  ADD COLUMN IF NOT EXISTS time_estimate text NOT NULL DEFAULT 'medium' CHECK (time_estimate IN ('short', 'medium', 'long')),
  ADD COLUMN IF NOT EXISTS banner_url text;
