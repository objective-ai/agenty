---
phase: 02-dashboard-shell
plan: "02"
subsystem: ui
tags: [motion-react, animated-number, agent-context, holographic-avatar, comms-ripple, hydration-fix]

# Dependency graph
requires:
  - phase: 02-dashboard-shell/01
    provides: "Foundational infrastructure (globals.css theme, AgentContext base)"
provides:
  - "AnimatedNumber count-up primitive with scale bounce and floating badge"
  - "HolographicAvatar agent portrait component (Comms Patch)"
  - "CommsRipple voice pulse bars component"
  - "Fixed AgentContext with initialAgent prop and useIsomorphicLayoutEffect"
  - "Agent interface with specialty, color, avatar fields"
affects: [02-03, 02-04, 02-05, 02-06]

# Tech tracking
tech-stack:
  added: []
  patterns: ["useIsomorphicLayoutEffect for SSR-safe DOM manipulation", "motion/react animate() API for count-up animations", "CSS keyframe stagger pattern for voice pulse bars"]

key-files:
  created:
    - src/components/AnimatedNumber.tsx
    - src/components/HolographicAvatar.tsx
    - src/components/CommsRipple.tsx
    - src/__tests__/dashboard/animated-number.test.ts
    - src/__tests__/dashboard/agent-context.test.ts
  modified:
    - src/contexts/AgentContext.tsx
    - src/app/globals.css

key-decisions:
  - "Task 4 executed before Task 2/3 due to type dependency (Agent interface needed avatar/color fields)"
  - "Test files use file-content assertions (readFileSync) since vitest runs in node environment"
  - "Emoji characters stored as Unicode escapes in AgentContext to avoid encoding issues"

patterns-established:
  - "HolographicAvatar: universal agent portrait pattern (Image if avatar set, styled initial if null)"
  - "CommsRipple: CSS-only voice pulse (no JS animation overhead)"
  - "AnimatedNumber: motion/react animate() for count-up with floating badge on gain"

requirements-completed: [DASH-01, DASH-06, UI-01, UI-02, UI-06]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 2 Plan 02: UI Primitives Summary

**AnimatedNumber count-up with easeOutExpo + floating badge, HolographicAvatar Comms Patch portraits, CommsRipple voice pulse bars, and AgentContext hydration fix with useIsomorphicLayoutEffect**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T18:13:20Z
- **Completed:** 2026-03-11T18:17:45Z
- **Tasks:** 4
- **Files modified:** 7

## Accomplishments
- AnimatedNumber primitive with motion/react count-up, easeOutExpo easing, scale bounce, and floating +N badge
- HolographicAvatar renders agent portraits (Image or styled initial with neon glow)
- CommsRipple renders 4 animated bars for voice pulse with active/idle states
- AgentContext hydration bug fixed: data-agent setAttribute moved to useIsomorphicLayoutEffect
- Agent interface extended with specialty, color, and avatar fields for downstream components

## Task Commits

Each task was committed atomically:

1. **Task 1: Build AnimatedNumber primitive (TDD RED)** - `ed69bda` (test)
2. **Task 1: Build AnimatedNumber primitive (TDD GREEN)** - `1aa6301` (feat)
3. **Task 4: Fix AgentContext hydration bug (TDD RED)** - `b7783ae` (test)
4. **Task 4: Fix AgentContext hydration bug (TDD GREEN)** - `4b87f08` (fix)
5. **Task 2: Create HolographicAvatar component** - `0b4f709` (feat)
6. **Task 3: Create CommsRipple voice pulse component + CSS** - `811994e` (feat)

_Note: Task 4 was executed before Tasks 2-3 due to type dependency (see Deviations)._

## Files Created/Modified
- `src/components/AnimatedNumber.tsx` - Count-up animation primitive with easeOutExpo, floating +N badge
- `src/components/HolographicAvatar.tsx` - Agent portrait with Image or styled initial + neon glow
- `src/components/CommsRipple.tsx` - 4-bar voice pulse animation (CSS stagger)
- `src/contexts/AgentContext.tsx` - Fixed hydration bug, added initialAgent prop, specialty/color/avatar fields
- `src/app/globals.css` - comms-bar and comms-bar-idle keyframe animations
- `src/__tests__/dashboard/animated-number.test.ts` - 9 tests for AnimatedNumber
- `src/__tests__/dashboard/agent-context.test.ts` - 10 tests for AgentContext

## Decisions Made
- Executed Task 4 (AgentContext fix) before Tasks 2-3 because HolographicAvatar imports Agent type which needs avatar/color fields
- Used file-content assertions (readFileSync) for TDD tests since vitest runs in node environment without DOM
- Stored emoji characters as Unicode escapes in AgentContext to prevent comment containing "Coach Cooper" from triggering test failures

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reordered Task 4 before Tasks 2-3**
- **Found during:** Task 2 (HolographicAvatar)
- **Issue:** HolographicAvatar imports `Agent` from AgentContext, but the current Agent interface lacked `avatar` and `color` fields needed by HolographicAvatar
- **Fix:** Executed Task 4 (AgentContext fix + Agent interface extension) before Tasks 2 and 3
- **Files modified:** src/contexts/AgentContext.tsx
- **Verification:** TypeScript compiles clean for all source files after reorder
- **Committed in:** 4b87f08

---

**Total deviations:** 1 auto-fixed (1 blocking dependency)
**Impact on plan:** Task reorder was necessary for type safety. All 4 tasks completed. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in test files (missing vitest type globals) affect all test files in project, not just this plan's files. Source files are all clean.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- AnimatedNumber ready for HUD gold/XP/energy counters (Wave 3+)
- HolographicAvatar and CommsRipple ready for agent UI panels
- AgentContext hydration fix prevents data-agent SSR mismatch in next build
- Agent interface now has specialty, color, avatar fields needed by AgentPicker cards

## Self-Check: PASSED

- All 7 files verified on disk
- All 6 commit hashes confirmed in git log
- 19/19 tests passing
- 0 TypeScript errors in source files

---
*Phase: 02-dashboard-shell*
*Completed: 2026-03-11*
