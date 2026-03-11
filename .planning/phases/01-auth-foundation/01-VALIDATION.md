---
phase: 1
slug: auth-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (needs install — Wave 0) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | ALL | setup | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | AUTH-01 | integration | `npx vitest run src/__tests__/auth/magic-link.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | AUTH-02 | integration | `npx vitest run src/__tests__/auth/callback.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | AUTH-03 | unit | `npx vitest run src/__tests__/auth/setup.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | AUTH-04 | integration | `npx vitest run src/__tests__/auth/pin-login.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 1 | AUTH-05 | unit | `npx vitest run src/__tests__/auth/rate-limit.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 2 | AUTH-06 | unit | `npx vitest run src/__tests__/auth/middleware.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D vitest @vitejs/plugin-react` — install test framework
- [ ] `vitest.config.ts` — framework config with path aliases
- [ ] `src/__tests__/auth/` — test directory structure
- [ ] `src/__tests__/helpers/supabase-mock.ts` — shared Supabase client mocks
- [ ] `src/__tests__/auth/magic-link.test.ts` — stubs for AUTH-01
- [ ] `src/__tests__/auth/callback.test.ts` — stubs for AUTH-02
- [ ] `src/__tests__/auth/setup.test.ts` — stubs for AUTH-03
- [ ] `src/__tests__/auth/pin-login.test.ts` — stubs for AUTH-04
- [ ] `src/__tests__/auth/rate-limit.test.ts` — stubs for AUTH-05
- [ ] `src/__tests__/auth/middleware.test.ts` — stubs for AUTH-06

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Magic link email received in inbox | AUTH-01 | Requires real email delivery | 1. Sign up with real email 2. Check inbox for magic link 3. Click link, verify redirect |
| PIN pad UX on mobile/desktop | AUTH-04 | Visual/interaction quality | 1. Open /login 2. Enter PIN digits 3. Verify chunky animated feel |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
