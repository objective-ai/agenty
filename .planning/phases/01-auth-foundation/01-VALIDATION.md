---
phase: 1
slug: auth-foundation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (installed in Wave 0 — Plan 01-00) |
| **Config file** | vitest.config.ts (created in Wave 0 — Plan 01-00) |
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
| 01-00-01 | 00 | 0 | ALL | setup | `npx vitest run` | Wave 0 creates | pending |
| 01-01-01 | 01 | 1 | AUTH-02, AUTH-06 | integration | `npx vitest run src/__tests__/auth/middleware.test.ts src/__tests__/auth/callback.test.ts` | Wave 0 stub | pending |
| 01-01-02 | 01 | 1 | AUTH-06 | config | `grep -q "timebox" supabase/config.toml` | N/A | pending |
| 01-02-01 | 02 | 2 | AUTH-01 | integration | `npx vitest run src/__tests__/auth/magic-link.test.ts` | Wave 0 stub | pending |
| 01-02-02 | 02 | 2 | AUTH-03, AUTH-04, AUTH-05 | unit | `npx vitest run src/__tests__/auth/setup.test.ts src/__tests__/auth/pin-login.test.ts src/__tests__/auth/rate-limit.test.ts` | Wave 0 stub | pending |
| 01-03-01 | 03 | 3 | AUTH-04 | build | `npx next build` | N/A | pending |
| 01-03-02 | 03 | 3 | AUTH-01 | build | `npx next build` | N/A | pending |
| 01-03-03 | 03 | 3 | AUTH-04, AUTH-05 | build | `npx next build` | N/A | pending |
| 01-03-04 | 03 | 3 | ALL | manual | Human e2e verification | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements (Plan 01-00)

- [x] Plan 01-00 created to handle Wave 0
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
| PIN pad UX on mobile/desktop | AUTH-04 | Visual/interaction quality | 1. Open / 2. Enter PIN digits 3. Verify chunky animated feel |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Plan 01-00)
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending execution
