---
phase: 02-dashboard-shell
plan: "04"
subsystem: ui
tags: [react, motion, framer-motion, animation, agent-picker, css-keyframes, tailwind]

# Dependency graph
requires:
  - phase: 02-dashboard-shell/02-02
    provides: AgentContext, AGENTS data, HolographicAvatar, useAgent hook
  - phase: 02-dashboard-shell/02-03
    provides: bridge/page.tsx shell with profile fetch
provides:
  - AgentPicker full-page RPG character select with portal-warp transition
  - AgentSwitchOverlay with glitch effect, holographic dissolve, and saveAgentSelection persistence
  - CSS agent-glitch keyframes and holo-grid-bg animated background
  - bridge/page.tsx wired to render AgentPicker for first-time users
affects: [02-dashboard-shell/02-05, 02-dashboard-shell/02-06, 03-reward-loop]

# Tech tracking
tech-stack:
  added: []
  patterns: [optimistic-ui-with-server-action-fallback, css-glitch-animation, portal-warp-transition]

key-files:
  created:
    - src/__tests__/dashboard/agent-switch-overlay.test.ts
  modified:
    - src/components/AgentPicker.tsx
    - src/components/AgentSwitchOverlay.tsx
    - src/app/globals.css
    - src/app/bridge/page.tsx
    - src/__tests__/dashboard/agent-picker.test.ts

key-decisions:
  - "AgentPicker was already built as Rule 3 dep in 02-05 execution; 02-04 validates and adds full test coverage"
  - "AgentSwitchOverlay upgraded from placeholder to full impl with glitch, dissolve, persistence, error handling"

patterns-established:
  - "Optimistic agent switch: setActiveAgent immediate, saveAgentSelection async, error shows inline toast"
  - "Portal-warp transition: card scale [1, 1.08, 40] with full-screen color burst overlay"
  - "Glitch effect: 800ms agent-glitch-active CSS class on document.documentElement"

requirements-completed: [DASH-01, DASH-06, UI-02, UI-06]

# Metrics
duration: 7min
completed: 2026-03-11
---

# Phase 2 Plan 4: Agent Picker & Switch Overlay Summary

**Full-page RPG agent picker with portal-warp transition, agent switch overlay with 800ms CSS glitch effect, and holographic dissolve animation**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-11T18:21:31Z
- **Completed:** 2026-03-11T18:28:45Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- AgentPicker renders 4 agent cards with HolographicAvatar, specialty, LV1 badge, and Ready status
- Portal-warp transition on selection: card scale-up to 40x with full-screen color burst overlay
- AgentSwitchOverlay with full-screen blurred backdrop, glitch CSS class trigger, holographic dissolve
- bridge/page.tsx wired to render AgentPicker for first-time users (no agent_id)
- 31 tests passing across agent-picker and agent-switch-overlay test suites

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CSS animations to globals.css + build AgentPicker** - `9a1b815` (feat - previously committed as Rule 3 dep in 02-05; test suite updated)
2. **Task 2: Build AgentSwitchOverlay + wire bridge/page.tsx** - `2c64971` (feat)

_Note: Task 1 artifacts were already committed as a Rule 3 blocking dependency in plan 02-05 execution (commit 9a1b815). This plan validates the implementation and adds comprehensive tests._

## Files Created/Modified
- `src/components/AgentPicker.tsx` - Full-page RPG agent picker with portal-warp and HolographicAvatar
- `src/components/AgentSwitchOverlay.tsx` - Full-screen glitch overlay with saveAgentSelection persistence
- `src/app/globals.css` - agent-glitch keyframes + holo-grid-bg animated background
- `src/app/bridge/page.tsx` - Wired AgentPicker for first-time users (no agent_id)
- `src/__tests__/dashboard/agent-picker.test.ts` - 14 tests: CSS verification + module structure
- `src/__tests__/dashboard/agent-switch-overlay.test.ts` - 17 tests: overlay module structure + bridge wiring

## Decisions Made
- AgentPicker.tsx was already fully implemented in 02-05 as a Rule 3 blocking dependency. This plan validates correctness and adds test coverage rather than reimplementing.
- AgentSwitchOverlay upgraded from minimal placeholder (no animations, no persistence) to full spec with glitch effect, AnimatePresence, saveAgentSelection, error handling, and quest stat placeholder.

## Deviations from Plan

### Auto-fixed Issues

None - plan executed as specified. Task 1 artifacts were pre-existing from a prior Rule 3 auto-fix in plan 02-05.

## Issues Encountered
- Task 1 files (AgentPicker.tsx, globals.css CSS, agent-picker.test.ts) were already committed in 02-05 execution as Rule 3 blocking dependencies. No code changes needed; test validation confirmed correctness.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- AgentPicker and AgentSwitchOverlay are ready for use in the BridgeHUD (Plan 02-05)
- CSS glitch and holo-grid animations are available globally
- bridge/page.tsx correctly branches between AgentPicker (first-time) and HUD (returning)

## Self-Check: PASSED

All files verified present. Commit `2c64971` confirmed in git log.

---
*Phase: 02-dashboard-shell*
*Completed: 2026-03-11*
