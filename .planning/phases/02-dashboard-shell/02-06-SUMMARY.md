---
phase: 02-dashboard-shell
plan: "06"
subsystem: ui
tags: [next.js, server-actions, supabase, framer-motion, css-animations, gamification]

# Dependency graph
requires:
  - phase: 02-dashboard-shell/02-04
    provides: "AgentPicker, BridgeSidebar, AgentContext"
  - phase: 02-dashboard-shell/02-05
    provides: "HudStatusRail, DailyClaim, StartQuestButton, economy Server Actions"
provides:
  - "Mission Control page with full user-specified briefing copy"
  - "ScanProgress animated ticker component (0% to 99.9% loop)"
  - "Ghost Board with 3 placeholder Quest Card silhouettes"
  - "Training Room with 3 interactive calibration stations (Energy Lab, Loot Vault, XP Core)"
  - "completeTraining() Server Action awarding 50 Gold via awardLoot()"
  - "Training Certified badge in BridgeSidebar (persisted via profiles.training_certified column)"
  - "Digital Scanline overlay CSS animation"
  - "Station-specific CSS animations: pulse-glow, spin-coin"
affects: [03-demo-quest, ui-polish, reward-loop]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Server Action for idempotent reward via quest_id", "Profile column flag for persistent badge state"]

key-files:
  created:
    - src/app/bridge/missions/page.tsx
    - src/components/ScanProgress.tsx
    - src/app/bridge/missions/training/page.tsx
    - src/lib/actions/training.ts
    - supabase/migrations/20260311300000_add_training_certified.sql
  modified:
    - src/app/globals.css
    - src/components/BridgeSidebar.tsx
    - src/app/bridge/layout.tsx
    - src/app/bridge/page.tsx

key-decisions:
  - "Training Certified badge persisted via profiles.training_certified DB column (not cookie) -- fetched in bridge layout/page select query"
  - "completeTraining() uses quest_id training_v1 for idempotent loot award via awardLoot()"
  - "Unicode escapes for emoji characters in station data to avoid encoding issues"

patterns-established:
  - "Profile flag pattern: add boolean column to profiles, update via supabaseAdmin in Server Action, read in layout/page select"
  - "Station accordion pattern: button toggles AnimatePresence expand/collapse with height auto animation"

requirements-completed: [DASH-04, DASH-05, UI-01, UI-02, UI-06]

# Metrics
duration: 6min
completed: 2026-03-11
---

# Phase 2 Plan 6: Mission Control + Training Room Summary

**Mission Control full briefing page with scanline overlay, animated ScanProgress ticker, Ghost Board placeholders, and Training Room with 3 interactive calibration stations awarding 50 Gold on completion**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-11T18:31:08Z
- **Completed:** 2026-03-11T18:37:04Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Mission Control page with exact user-specified copy: OFFLINE briefing, Cooper hologram with CommsRipple, animated scan ticker, Ghost Board silhouettes, 64px START TRAINING + RETURN TO BASE buttons
- Training Room with 3 themed calibration stations (Energy Lab with pulse-glow, Loot Vault with spin-coin, XP Core with filling bar) featuring AnimatedNumber Scale-Bounce demos
- completeTraining() Server Action awarding 50 Gold via awardLoot() with idempotent quest_id, plus training_certified DB flag for permanent sidebar badge
- Digital Scanline overlay and station-specific CSS animations added to globals.css

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Mission Control page + Training Room Server Action + migration** - `6701518` (feat)
2. **Task 2: Build Training Room with 3 calibration stations** - `bca7e18` (feat)

## Files Created/Modified
- `src/app/bridge/missions/page.tsx` - Mission Control: Offline full briefing with Ghost Board + Return to Base
- `src/components/ScanProgress.tsx` - Animated scan progress ticker (0% to 99.9% loop)
- `src/app/bridge/missions/training/page.tsx` - Training Room with 3 themed calibration stations
- `src/lib/actions/training.ts` - completeTraining() Server Action awarding 50 Gold
- `supabase/migrations/20260311300000_add_training_certified.sql` - Add training_certified column to profiles
- `src/app/globals.css` - Scanline overlay + pulse-glow + spin-coin CSS animations
- `src/components/BridgeSidebar.tsx` - Added trainingCertified prop with emerald badge display
- `src/app/bridge/layout.tsx` - Added training_certified to profile select query
- `src/app/bridge/page.tsx` - Pass training_certified to BridgeSidebar

## Decisions Made
- Training Certified badge persisted via `profiles.training_certified` DB column (recommended approach from plan) -- more reliable than cookie, fetched alongside existing profile queries
- `completeTraining()` uses quest_id `"training_v1"` for idempotent loot award via `awardLoot()` -- prevents double-claiming
- Used Unicode escape sequences for emoji characters in station data constants to avoid string-match issues

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Migration file needs to be applied to Supabase (`supabase db push` or migration apply).

## Next Phase Readiness
- Mission Control and Training Room complete, proving the full reward loop (spend Energy -> complete task -> earn Gold -> see badge)
- Ready for Plan 02-07 (final dashboard shell plan) or Phase 3 demo quest
- `cooper-hologram.png` must exist in `/public/` for the hologram image to render

## Self-Check: PASSED

- All 9 files verified present on disk
- Commit `6701518` verified in git log (Task 1)
- Commit `bca7e18` verified in git log (Task 2)
- TypeScript check: no errors in plan files
- All 7 plan verification grep checks pass

---
*Phase: 02-dashboard-shell*
*Completed: 2026-03-11*
