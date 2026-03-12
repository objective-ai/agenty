---
phase: 03-expanded-reward-loop
plan: "06"
subsystem: ui-animations
tags: [confetti, framer-motion, accessibility, mission-complete, econ-05]

dependency_graph:
  requires: []
  provides: ["confetti-burst-on-mission-complete"]
  affects: ["src/components/MissionCompleteOverlay.tsx"]

tech_stack:
  added: []
  patterns: ["ConfettiBurst sub-component (self-contained, no new file)", "prefers-reduced-motion accessibility gate"]

key_files:
  created: []
  modified:
    - src/components/MissionCompleteOverlay.tsx

decisions:
  - key: confetti-as-sub-component
    summary: "ConfettiBurst defined inside MissionCompleteOverlay.tsx rather than a new file — keeps particle logic co-located with the overlay it supports"
  - key: upward-burst-trajectory
    summary: "Particles animate upward (y: -100 to -400) instead of downward — feels more celebratory; natural 'explosion' from the success badge at top of card"
  - key: prefers-reduced-motion-early-return
    summary: "window.matchMedia prefers-reduced-motion check inside useMemo; returns null to skip all particles entirely — accessibility-first"

metrics:
  duration: "3min"
  completed_date: "2026-03-12"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
  files_created: 0
---

# Phase 03 Plan 06: Confetti Particle Burst on Mission Complete Summary

**One-liner:** Framer Motion confetti burst (36 particles, 4 brand colors, randomized trajectories) fires on MissionCompleteOverlay mount, satisfying ECON-05.

## What Was Built

Added a `ConfettiBurst` sub-component inside `MissionCompleteOverlay.tsx` that renders 36 animated confetti particles using Framer Motion when the overlay mounts. Particles burst outward from the center-top area (near the success badge) with randomized trajectories, rotations, and durations using the project's brand color palette.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add confetti particle burst to MissionCompleteOverlay | d821598 | src/components/MissionCompleteOverlay.tsx |

## Implementation Details

**ConfettiBurst component:**
- 36 particles (`PARTICLE_COUNT = 36`) generated once via `useMemo`
- Each particle is a `motion.div` with `borderRadius: 2` (small rectangle)
- Width: 6-10px, Height: 4-8px (random per particle)
- X spread: -200 to +200px (random); Y spread: -100 to -400px (upward burst)
- Rotation: 0-720deg (random)
- Duration: 1.5-2.5s (random per particle)
- Delay stagger: 0-0.3s (random per particle)
- Easing: `[0.2, 0.8, 0.4, 1]` — fast initial burst, decelerating fade
- Colors: `#10B981` (Jade Green/Minh), `#3B82F6` (Strategic Cobalt/Cooper), `#F59E0B` (Gold), `#8B5CF6` (Storyteller Violet/Maya)

**Accessibility:**
- `prefers-reduced-motion` check via `window.matchMedia` in `useMemo`
- Returns `null` immediately if reduced motion is preferred — no particles rendered

**Layout / z-index:**
- Confetti container: `absolute inset-0`, no z-index (default z-0)
- Card: `relative z-10` (unchanged)
- `pointer-events-none` on confetti container — card interactions fully unblocked
- `overflow-hidden` on confetti container — particles don't bleed outside overlay bounds

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Out-of-Scope Failures (Deferred)

Pre-existing test failures in `src/__tests__/dashboard/start-quest.test.ts` were detected during verification. These failures exist because `src/components/StartQuestButton.tsx` (in the working tree) is a simplified version missing full implementation. This is unrelated to the confetti work and was not introduced by this plan. Logged to deferred items.

## Verification

- `npx vitest run` — no regressions introduced by this plan (pre-existing failures in unrelated files unchanged)
- `MissionCompleteOverlay.tsx` contains `ConfettiBurst` component with Framer Motion `motion.div` particles
- `pointer-events-none` present on confetti container
- `prefers-reduced-motion` check present via `window.matchMedia`

## Self-Check: PASSED

- [x] `src/components/MissionCompleteOverlay.tsx` — modified with ConfettiBurst
- [x] Commit `d821598` exists in git log
- [x] `ConfettiBurst` renders 36 particles (PARTICLE_COUNT = 36)
- [x] All 4 brand colors present in CONFETTI_COLORS array
- [x] pointer-events-none present
- [x] prefers-reduced-motion check present
- [x] Existing overlay animations (card spring, badge scale, reward counters) unchanged
