---
phase: 3
slug: expanded-reward-loop
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run && npm run test:e2e` |
| **Estimated runtime** | ~15 seconds (unit) + ~30 seconds (e2e) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | ECON-03, QUEST-01 | unit | `npx vitest run src/__tests__/dashboard/daily-claim.test.ts -x` | Yes (needs update) | ⬜ pending |
| 03-01-02 | 01 | 1 | ECON-06 | unit | `npx vitest run src/__tests__/dashboard/daily-claim.test.ts -x` | Yes (needs update) | ⬜ pending |
| 03-01-03 | 01 | 1 | ECON-01, ECON-05 | unit | `npx vitest run src/__tests__/dashboard/mission-complete.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | ECON-02 | unit | `npx vitest run src/__tests__/dashboard/mission-start-energy.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | — | unit | `npx vitest run src/__tests__/missions/ranks.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | — | unit | `npx vitest run src/__tests__/missions/shields.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 3 | — | unit | `npx vitest run src/__tests__/missions/validator-relaxed.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-05-01 | 05 | 3 | QUEST-03 | e2e | `npm run test:e2e` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/dashboard/mission-complete.test.ts` — stubs for ECON-01, ECON-05
- [ ] `src/__tests__/dashboard/mission-start-energy.test.ts` — stubs for ECON-02
- [ ] Update `src/__tests__/dashboard/daily-claim.test.ts` — update for claimDaily() idempotency (ECON-03, QUEST-01, QUEST-02)
- [ ] `src/__tests__/missions/shields.test.ts` — stubs for shield mechanic (missionReducer SHIELD_HIT)
- [ ] `src/__tests__/missions/ranks.test.ts` — stubs for getRankTitle function
- [ ] `src/__tests__/missions/validator-relaxed.test.ts` — stubs for relaxed zone coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Gold count-up animation | ECON-04 | Visual animation timing | Load /bridge, claim daily reward, observe gold counter animates up over ~800ms |
| Shield bar color transition | — | CSS visual effect | Start mission, answer wrong 7+ times, verify bar transitions blue→red |
| Damaged Mode flicker | — | CSS animation | Answer wrong 10 times, verify subtle red-shift flicker on screen border |
| Cooper degraded text | — | Visual styling | In damaged mode, verify Cooper's text shows italic "[SIGNAL DEGRADED]" prefix |
| Mission banner display | — | Generated image quality | Generate mission, verify banner image renders in preview, list, and briefing screen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
