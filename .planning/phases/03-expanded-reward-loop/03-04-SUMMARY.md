---
phase: 03-expanded-reward-loop
plan: 04
subsystem: api, ui, database
tags: [supabase, zod, mission-generation, validator, command-deck]

# Dependency graph
requires:
  - phase: 02-dashboard-shell (2.6)
    provides: Command Deck shell, MissionGeneratorForm, validator, generate-mission route
provides:
  - DB migration adding problem_count, difficulty, narrative_theme, time_estimate, banner_url to missions
  - Relaxed validator supporting variable problemCount with zone reuse/partial coverage
  - 4 new mission generation inputs (Problem Count, Difficulty, Narrative Theme, Time Estimate)
  - Enhanced AI prompt adjusting difficulty, theme, and stat count
affects: [03-expanded-reward-loop, mission-mode, command-deck]

# Tech tracking
tech-stack:
  added: []
  patterns: [relaxed-zone-coverage, difficulty-based-prompt-tuning, button-group-inputs]

key-files:
  created:
    - supabase/migrations/20260313000000_phase3_command_deck.sql
    - src/__tests__/missions/validator-relaxed.test.ts
  modified:
    - src/lib/missions/validator.ts
    - src/lib/actions/missions.ts
    - src/components/MissionGeneratorForm.tsx
    - src/components/CommandDeckShell.tsx
    - src/app/api/generate-mission/route.ts

key-decisions:
  - "Relaxed zone coverage: zone reuse allowed when problemCount > zones, partial coverage when problemCount < zones"
  - "Difficulty adjusts both goalValue hints and XP/gold reward ranges in AI prompt"
  - "problemCount parameter is optional in validateMission for backward compatibility"

patterns-established:
  - "Button group input pattern: Adventure Navy styled chunky border-2 buttons with accent glow on selection"
  - "Difficulty-tiered prompt engineering: easy/medium/hard maps to different number complexity and reward ranges"

requirements-completed: [QUEST-03]

# Metrics
duration: 6min
completed: 2026-03-12
---

# Phase 03 Plan 04: Command Deck Expansion Summary

**4 new mission generation inputs (problem count, difficulty, theme, time) with relaxed zone validator and difficulty-tuned AI prompt**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-12T06:28:45Z
- **Completed:** 2026-03-12T06:34:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- DB migration adds 5 new columns to missions table with CHECK constraints
- Validator relaxed to support variable problemCount: zone reuse and partial coverage
- MissionGeneratorForm has 4 new Adventure Navy button group inputs
- Generation route adjusts AI prompt based on difficulty/theme/problemCount
- Full backward compatibility: existing missions with default values still validate

## Task Commits

Each task was committed atomically:

1. **Task 1: DB Migration + Validator Relaxation** - `5955651` (feat, TDD)
2. **Task 2: MissionGeneratorForm 4 new inputs + generation route** - `8eea04f` (feat)

## Files Created/Modified
- `supabase/migrations/20260313000000_phase3_command_deck.sql` - Migration adding problem_count, difficulty, narrative_theme, time_estimate, banner_url
- `src/lib/missions/validator.ts` - Relaxed zone coverage with optional problemCount param
- `src/lib/actions/missions.ts` - New fields in MissionInsertData/MissionRow and saveMission insert
- `src/__tests__/missions/validator-relaxed.test.ts` - 6 tests for relaxed validation scenarios
- `src/components/MissionGeneratorForm.tsx` - 4 new button group inputs (problem count, difficulty, theme, time)
- `src/components/CommandDeckShell.tsx` - Pass new fields through generate/save flow
- `src/app/api/generate-mission/route.ts` - New schema fields, difficulty-tuned prompt, relaxed validation call

## Decisions Made
- Relaxed zone coverage: zone reuse allowed when problemCount > zones, partial coverage when problemCount < zones
- Difficulty adjusts both goalValue hints and XP/gold reward ranges in AI prompt
- problemCount parameter is optional in validateMission for backward compatibility (defaults to template.zones.length)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Command Deck now supports customizable mission generation parameters
- Missions table schema ready for varied problem counts and difficulties
- Pre-existing test failures in start-quest.test.ts and profile-fetch.test.ts are unrelated (Phase 2 stubs)

---
*Phase: 03-expanded-reward-loop*
*Completed: 2026-03-12*
