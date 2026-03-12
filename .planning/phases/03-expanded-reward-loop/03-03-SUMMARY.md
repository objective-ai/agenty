---
phase: 03-expanded-reward-loop
plan: 03
subsystem: missions, economy, ui
tags: [shields, damage-mode, loot-guard, mission-reducer, ai-tools]

requires:
  - phase: 02-dashboard-shell
    provides: MissionModeShell, CommsPanel, MissionBriefingBoard, missionReducer, chat/route
provides:
  - SHIELD_HIT and SET_SHIELDS actions in missionReducer
  - reportWrongAnswer static tool in /api/chat
  - completeMission() Server Action (Loot Guard compliant)
  - Shield bar UI on MissionBriefingBoard with color transitions and flicker
  - Damaged Mode visual effects (italic text, "[SIGNAL DEGRADED]" prefix)
  - MissionCompleteOverlay using completeMission() instead of direct awardLoot()
affects: [mission-mode, economy, dashboard-rewards]

tech-stack:
  added: []
  patterns: [shield-drain-mechanic, damaged-mode-visuals, loot-guard-server-action]

key-files:
  created:
    - src/__tests__/missions/shields.test.ts
  modified:
    - src/lib/missions/missionReducer.ts
    - src/app/api/chat/route.ts
    - src/lib/actions/missions.ts
    - src/components/CommsPanel.tsx
    - src/components/MissionModeShell.tsx
    - src/components/MissionBriefingBoard.tsx
    - src/components/MissionCompleteOverlay.tsx

key-decisions:
  - "completeMission() Server Action replaces direct awardLoot() in MissionCompleteOverlay — Loot Guard compliant"
  - "Shield drain is 10% per wrong answer, Damaged Mode at 0% halves all rewards"
  - "Shield flicker animation respects prefers-reduced-motion for accessibility"

patterns-established:
  - "Loot Guard pattern: client sends missionId + isDamaged boolean, server computes actual amounts"
  - "Tool interception pattern: CommsPanel handles tool-reportWrongAnswer same as tool-updateStat with dedup"

requirements-completed: [ECON-02, ECON-05, ECON-06]

duration: 8min
completed: 2026-03-12
---

# Phase 03 Plan 03: Shields Mechanic Summary

**Wrong-answer penalty system with shield drain, Damaged Mode visuals, and Loot Guard compliant reward halving via completeMission() Server Action**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-12T06:29:00Z
- **Completed:** 2026-03-12T09:05:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- MissionReducer: shields (0-100) + isDamaged state, SHIELD_HIT (-10 capped at 0), SET_SHIELDS
- reportWrongAnswer static tool in /api/chat alongside updateStat
- completeMission() Server Action: looks up mission rewards, halves when isDamaged, calls awardLoot internally
- CommsPanel intercepts tool-reportWrongAnswer with toolCallId dedup, dispatches SHIELD_HIT, calls spendEnergy(10)
- MissionModeShell threads shields/isDamaged to all child components
- Cooper text shows italic + "[SIGNAL DEGRADED]" prefix in Damaged Mode
- Shield bar on MissionBriefingBoard: blue->red gradient transition, flicker animation at 0%
- MissionCompleteOverlay: replaced direct awardLoot() with completeMission() (Loot Guard fix)
- Damaged rewards display: strikethrough original amounts + halved amounts + "50% SIGNAL PENALTY" label

## Task Commits

Each task was committed atomically:

1. **Task 1: Shields reducer + reportWrongAnswer tool + completeMission Server Action** - `a238159` (test, TDD), `a71af77` (feat)
2. **Task 2: CommsPanel interception + MissionModeShell prop threading** - `2025cba` (feat)
3. **Task 3: Shield bar UI + MissionCompleteOverlay reward halving** - `7d44321` (feat)

## Files Created/Modified
- `src/__tests__/missions/shields.test.ts` - 6 tests for shield reducer logic
- `src/lib/missions/missionReducer.ts` - shields/isDamaged state, SHIELD_HIT/SET_SHIELDS actions
- `src/app/api/chat/route.ts` - reportWrongAnswer static tool + system prompt update
- `src/lib/actions/missions.ts` - completeMission() Server Action
- `src/components/CommsPanel.tsx` - tool-reportWrongAnswer interception with dedup
- `src/components/MissionModeShell.tsx` - shields/isDamaged prop threading
- `src/components/MissionBriefingBoard.tsx` - Shield bar UI with color transitions and flicker
- `src/components/MissionCompleteOverlay.tsx` - completeMission() replaces awardLoot()

## Decisions Made
- completeMission() Server Action replaces direct awardLoot() — client never supplies gold amount
- Shield drain is exactly 10% per wrong answer, consistent and predictable for a 9-year-old
- Flicker animation respects prefers-reduced-motion for accessibility

## Deviations from Plan

### Agent ran out of usage during Task 3
- **Found during:** Task 3 execution
- **Issue:** Agent hit usage limit after completing Tasks 1-2
- **Fix:** Orchestrator completed Task 3 manually (shield bar UI + MissionCompleteOverlay update)
- **Impact:** None — all success criteria met

## Issues Encountered
- Agent usage limit hit after Task 2 commit — orchestrator completed remaining work

## User Setup Required
None.

## Next Phase Readiness
- Shields mechanic fully operational for mission gameplay
- completeMission() available for all mission completion flows
- Shield bar and Damaged Mode visuals ready for player feedback

---
*Phase: 03-expanded-reward-loop*
*Completed: 2026-03-12*
