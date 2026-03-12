---
phase: 03-expanded-reward-loop
plan: 05
subsystem: ui, api, database
tags: [gemini, google-genai, supabase-storage, image-generation, economy, banner]

# Dependency graph
requires:
  - phase: 03-03
    provides: "shields mechanic + completeMission Server Action (ECON-01)"
  - phase: 03-04
    provides: "expanded mission generation inputs + bannerUrl field in MissionInsertData"
provides:
  - "Gemini AI-generated mission banner images via @google/genai"
  - "Supabase Storage 'mission-banners' bucket (public read)"
  - "Banner display in MissionPreview, MissionList, MissionBriefingBoard"
  - "spendEnergy(10, mission_start) on mission load (ECON-02)"
affects: [command-deck, mission-mode, economy]

# Tech tracking
tech-stack:
  added: ["@google/genai ^1.44.0"]
  patterns: ["fire-and-forget banner generation (null on failure)", "graceful degradation when API key missing"]

key-files:
  created:
    - "supabase/migrations/20260313100000_phase3_storage_bucket.sql"
  modified:
    - "src/app/api/generate-mission/route.ts"
    - "src/components/MissionModeShell.tsx"
    - "src/components/MissionPreview.tsx"
    - "src/components/MissionList.tsx"
    - "src/components/MissionBriefingBoard.tsx"

key-decisions:
  - "Banner generation is fire-and-forget: failure returns null, mission saves without banner"
  - "spendEnergy called on mount via useRef guard (not on status change) since initialState is already active"
  - "MissionList uses accent-color placeholder square when no banner exists"

patterns-established:
  - "Graceful Gemini integration: API key missing logs warning, returns null, never blocks mission creation"
  - "useRef guard for one-time Server Action calls in useEffect (prevents double-fire in StrictMode)"

requirements-completed: [ECON-01, ECON-02]

# Metrics
duration: 9min
completed: 2026-03-12
---

# Phase 3 Plan 05: Gemini Banner Generation + Economy Loop Wiring Summary

**AI-generated mission banners via Gemini + Supabase Storage, banner display in 3 components, spendEnergy on mission start (ECON-02)**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-12T16:05:31Z
- **Completed:** 2026-03-12T16:14:39Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Gemini banner generation integrated into generate-mission route with graceful fallback
- Supabase Storage bucket migration for public mission banner images
- Banner display wired into MissionPreview (full 16:9), MissionList (48px thumbnail), MissionBriefingBoard (above shield bar)
- spendEnergy(10, "mission_start") fires on mission mount in MissionModeShell (ECON-02)
- Full economy loop verified: spendEnergy on start, completeMission awards gold on finish (ECON-01 from Plan 03)

## Task Commits

Each task was committed atomically:

1. **Task 1: Gemini banner generation + Supabase Storage + spendEnergy wiring** - `d114a04` (feat, from prior execution)
2. **Task 2: Banner display in MissionPreview, MissionList, MissionBriefingBoard** - `cba4113` (feat)

## Files Created/Modified
- `src/app/api/generate-mission/route.ts` - Added generateBanner() helper using @google/genai, integrated into validation-success path
- `supabase/migrations/20260313100000_phase3_storage_bucket.sql` - Storage bucket + RLS policies for mission-banners
- `src/components/MissionModeShell.tsx` - spendEnergy(10, "mission_start") on mount with useRef guard
- `src/components/MissionPreview.tsx` - Full-width 16:9 banner at top of preview card
- `src/components/MissionList.tsx` - 48x48 banner thumbnail with accent-color placeholder fallback
- `src/components/MissionBriefingBoard.tsx` - Banner image above shield bar, hidden during ghost state

## Decisions Made
- Banner generation is fire-and-forget: any failure (missing API key, Gemini error, storage upload failure) returns null and the mission saves without a banner. No error shown to user.
- Used useRef guard for spendEnergy to prevent double-fire in React StrictMode development.
- MissionList shows a colored placeholder square (using mission accent color) when no banner_url exists, rather than an empty space.
- MissionBriefingBoard hides banner during ghost state to avoid layout shift.

## Deviations from Plan

### Discovery: Task 1 already committed

Task 1 work (Gemini integration, storage migration, spendEnergy wiring, @google/genai install) was found already committed in `d114a04` from a prior agent execution. The code was verified correct and matching plan requirements. No re-work needed.

---

**Total deviations:** 0 auto-fixed
**Impact on plan:** None. Task 1 was pre-committed; Task 2 executed as planned.

## Issues Encountered
- Pre-existing test failures (8 tests in DASH-02, DASH-04, DASH-05) unrelated to this plan -- these are dashboard component tests expecting hardcoded data patterns.

## User Setup Required

**External services require manual configuration:**
- `GOOGLE_AI_API_KEY` environment variable needed for banner generation
- Source: Google AI Studio (https://aistudio.google.com/apikey) -> Create API Key
- Without the key, missions generate and save normally without banners (graceful degradation)

## Next Phase Readiness
- Full economy loop wired: energy spent on mission start, gold awarded on completion
- Banner images add visual richness to mission experience
- All Phase 3 plans (01-05) now complete

## Self-Check: PASSED

All files verified present on disk. Commit cba4113 verified in git log.

---
*Phase: 03-expanded-reward-loop*
*Completed: 2026-03-12*
