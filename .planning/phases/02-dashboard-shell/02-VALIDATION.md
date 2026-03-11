---
phase: 2
slug: dashboard-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npx vitest run src/__tests__/dashboard/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/dashboard/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green + `next build` zero hydration warnings
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 0 | DASH-01 | unit | `npx vitest run src/__tests__/dashboard/agent-picker.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 0 | DASH-02 | unit | `npx vitest run src/__tests__/dashboard/profile-fetch.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 0 | DASH-03 | unit | `npx vitest run src/__tests__/dashboard/economy-context.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-04 | 01 | 0 | DASH-04 | unit | `npx vitest run src/__tests__/dashboard/daily-claim.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-05 | 01 | 0 | DASH-05 | unit | `npx vitest run src/__tests__/dashboard/start-quest.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-06 | 01 | 0 | DASH-06 | unit | `npx vitest run src/__tests__/dashboard/agent-persist.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | UI-01 | manual | N/A — visual inspection | N/A | ⬜ pending |
| 2-02-02 | 02 | 1 | UI-02 | manual | N/A — visual inspection | N/A | ⬜ pending |
| 2-03-01 | 03 | 1 | UI-06 | build | `npx next build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/dashboard/agent-picker.test.ts` — stubs for DASH-01
- [ ] `src/__tests__/dashboard/profile-fetch.test.ts` — stubs for DASH-02
- [ ] `src/__tests__/dashboard/economy-context.test.ts` — stubs for DASH-03
- [ ] `src/__tests__/dashboard/daily-claim.test.ts` — stubs for DASH-04
- [ ] `src/__tests__/dashboard/start-quest.test.ts` — stubs for DASH-05
- [ ] `src/__tests__/dashboard/agent-persist.test.ts` — stubs for DASH-06

Note: Reuse `src/__tests__/helpers/supabase-mock.ts` for all tests. Extend `mockSupabaseAdmin()` with `.rpc()` mock for economy actions (DASH-04, DASH-05).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Adventure Navy theme applied across all dashboard pages | UI-01 | CSS/visual — not testable in Node environment | Load /bridge, confirm #050B14 background, chunky borders, no SaaS defaults |
| Neon accent color switches when agent selected | UI-02 | CSS transition visual — not testable in Node | Select each agent (Cooper/Arlo/Minh/Maya), confirm matching neon glow switches across HUD, sidebar, cards |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
