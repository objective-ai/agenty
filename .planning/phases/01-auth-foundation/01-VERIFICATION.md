---
phase: 01-auth-foundation
verified: 2026-03-11T09:00:00Z
status: human_needed
score: 4/4 must-haves verified
re_verification: false
human_verification:
  - test: "End-to-end magic link + account creation"
    expected: "Parent enters email, receives magic link, clicks it, lands on /setup, creates kid account with display name and PIN, sees success screen with synthetic email, saves to localStorage, navigates to / and sees PIN pad"
    why_human: "Requires live Supabase project with email enabled; cannot verify email delivery or full PKCE redirect chain without running the app"
  - test: "Kid PIN login lands on /bridge"
    expected: "On /, entering the correct 6-digit PIN auto-submits after the 6th digit, triggers loginWithPin server action, and redirects to /bridge where the display name appears"
    why_human: "Requires a real Supabase session and cookie flow; cannot simulate signInWithPassword cookie-setting in a static code check"
  - test: "Tactical Lockdown after 5 wrong PINs"
    expected: "After 5 wrong PIN attempts within 15 minutes, the PIN pad is replaced by the Tactical Lockdown screen with an MM:SS countdown; the countdown clears when time expires and the pad reappears"
    why_human: "Requires repeated server action invocations against a live Supabase database with the pin_attempts table applied; countdown timer must be observed in-browser"
  - test: "Unauthenticated /bridge redirect"
    expected: "Visiting http://localhost:3000/bridge with no session cookie redirects to / (login page) with no flash"
    why_human: "Middleware redirect behavior must be observed in a running Next.js dev or production server"
  - test: "Adventure Navy UI fidelity on PIN pad"
    expected: "Buttons are chunky (64px minimum), Cooper blue accent glow visible on hover, background is Adventure Navy (#050B14), PIN dot fills with neon blue on tap — must feel like a game interface"
    why_human: "Visual aesthetics and touch target quality require human inspection in a browser"
---

# Phase 01: Auth Foundation Verification Report

**Phase Goal:** A parent can set up their child's account via magic link, and the kid can log in daily with a 6-digit PIN — with rate limiting, PKCE session handling, and a guaranteed profiles row.
**Verified:** 2026-03-11
**Status:** human_needed — all automated checks pass; 5 items require human verification in a running environment
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Parent receives a magic link, clicks it, child account is created with a profiles row | ? NEEDS HUMAN | `sendMagicLink` calls `signInWithOtp` with `emailRedirectTo=/auth/confirm?next=/setup`; `/auth/confirm` exchanges code via `exchangeCodeForSession`; `setupChildAccount` does explicit `supabaseAdmin.from("profiles").upsert()` — all code is correct; email delivery and live DB require human test |
| 2 | Kid enters 6-digit PIN on login screen and lands on The Bridge dashboard | ? NEEDS HUMAN | `page.tsx` implements full PIN pad, auto-submits at 6 digits via `loginWithPin`, on `result.success` calls `router.push("/bridge")`; code path verified correct; end-to-end session flow needs human |
| 3 | After 5 wrong PINs in 15 min, input locks and shows lockout message | ? NEEDS HUMAN | `auth.ts` `loginWithPin` queries `pin_attempts`, returns `tactical_lockdown` error with `unlockAt`/`remainingSeconds` after `>= MAX_ATTEMPTS`; `page.tsx` renders `<LockoutDisplay>` with MM:SS countdown; logic verified; live DB test needed |
| 4 | `/bridge` without session redirects to login; with valid session passes through | ? NEEDS HUMAN | `src/lib/supabase/middleware.ts` redirects `!user && pathname.startsWith("/bridge")` to `/`; `bridge/layout.tsx` adds server-side defense-in-depth check; code is correct; must observe redirect behavior in running app |

**Score:** 4/4 truths have verified code implementations. All 4 require human runtime verification.

---

## Required Artifacts

### Plan 00 — Test Infrastructure

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vitest.config.ts` | Vitest config with React plugin and `@` path alias | VERIFIED | 18 lines; `@vitejs/plugin-react`, `globals: true`, `environment: "node"`, `@` alias to `./src` |
| `src/__tests__/helpers/supabase-mock.ts` | Exports `mockSupabaseClient` and `mockSupabaseAdmin` | VERIFIED | 63 lines; both functions exported with full `vi.fn()` chain mocks |
| `src/__tests__/auth/magic-link.test.ts` | AUTH-01 stubs | VERIFIED | 2 `it.todo` entries; imports from `../helpers/supabase-mock` |
| `src/__tests__/auth/callback.test.ts` | AUTH-02 stubs | VERIFIED | Confirmed present; imports helper |
| `src/__tests__/auth/setup.test.ts` | AUTH-03 stubs | VERIFIED | Confirmed present; imports helper |
| `src/__tests__/auth/pin-login.test.ts` | AUTH-04 stubs | VERIFIED | Confirmed present; imports helper |
| `src/__tests__/auth/rate-limit.test.ts` | AUTH-05 stubs | VERIFIED | Confirmed present; imports helper |
| `src/__tests__/auth/middleware.test.ts` | AUTH-06 stubs | VERIFIED | Confirmed present; imports helper |

### Plan 01 — Auth Infrastructure

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/supabase/middleware.ts` | `updateSession` with route protection | VERIFIED | 73 lines; exports `updateSession`; uses `getUser()` (correct deviation from `getClaims()` which doesn't exist in v2.99); `/bridge` redirect and `/` redirect both implemented |
| `src/middleware.ts` | Root middleware wiring `updateSession` + matcher | VERIFIED | 19 lines; imports `updateSession` from `@/lib/supabase/middleware`; correct static-asset-excluding matcher |
| `src/app/auth/confirm/route.ts` | PKCE callback using `exchangeCodeForSession` | VERIFIED | 32 lines; exports `GET`; reads `code` param; calls `exchangeCodeForSession(code)`; redirects on success/error — note: Summary confirms fix from `verifyOtp` to `exchangeCodeForSession` (commit `5bcc6a8`) |
| `src/app/auth/error/page.tsx` | Auth error page with Adventure Navy styling | VERIFIED | 55 lines; Adventure Navy (`bg-bg-deep`, `bg-bg-surface`), Cooper blue `#3B82F6` accents, `data-agent="cooper"`, displays `error` from searchParams, back link to `/` |
| `supabase/migrations/20260311000000_create_pin_attempts.sql` | `pin_attempts` table with RLS | VERIFIED | `create table public.pin_attempts`, index on `(profile_id, attempted_at desc)`, `enable row level security`, no public policies |
| `supabase/config.toml` | 24-hour session timebox | VERIFIED | `[auth.sessions]` section present; `timebox = "24h"` at line 257 |

### Plan 02 — Auth Server Actions

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/actions/auth.ts` | All 4 server actions, min 100 lines | VERIFIED | 193 lines; `"use server"` directive; exports `sendMagicLink`, `setupChildAccount`, `loginWithPin`, `logOut` |
| `supabase/migrations/20260311100000_get_uid_by_email.sql` | Service-role RPC for email-to-UUID lookup | VERIFIED | `create or replace function public.get_uid_by_email`; `security definer`; execute revoked from `public`, `anon`, `authenticated` |

### Plan 03 — Auth UI Pages

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/page.tsx` | PIN login screen, min 60 lines | VERIFIED | 465 lines; dual-mode (PIN pad / parent form); `localStorage` read on mount; 6-dot `PinDisplay`; 3×4 `KeyButton` grid (`min-h-[64px] min-w-[64px]`); `LockoutDisplay` with countdown; `loginWithPin` and `sendMagicLink` wired |
| `src/app/setup/page.tsx` | Parent setup page, min 40 lines | VERIFIED | 270 lines; 2-step flow; display name + PIN + confirm; calls `setupChildAccount`; saves `kidEmail` to `localStorage("agenty_kid_email")`; success screen shows synthetic email with copy button |
| `src/app/bridge/layout.tsx` | Protected layout shell | VERIFIED | 24 lines; server-side `getUser()` check; redirects to `/` if no session |
| `src/app/bridge/page.tsx` | Placeholder dashboard with logout | VERIFIED | 77 lines; fetches `display_name` from profiles; renders welcome message; `logOut` wired via `<form action={logOut}>` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/middleware.ts` | `src/lib/supabase/middleware.ts` | `import updateSession` | WIRED | Line 1: `import { updateSession } from "@/lib/supabase/middleware"` |
| `src/app/auth/confirm/route.ts` | `src/lib/supabase/server.ts` | `createClient` for `exchangeCodeForSession` | WIRED | Line 1: `import { createClient }`, line 25: `supabase.auth.exchangeCodeForSession(code)` |
| `src/lib/actions/auth.ts` | `src/lib/supabase/server.ts` | `createClient` for session checks | WIRED | Line 3: `import { createClient } from "@/lib/supabase/server"` |
| `src/lib/actions/auth.ts` | `src/lib/supabase/admin.ts` | `supabaseAdmin` for createUser and pin_attempts | WIRED | Line 4: `import { supabaseAdmin } from "@/lib/supabase/admin"` |
| `src/app/page.tsx` | `src/lib/actions/auth.ts` | calls `loginWithPin` | WIRED | Line 5 (import), line 263 (call inside `submitPin`) |
| `src/app/page.tsx` | `src/lib/actions/auth.ts` | calls `sendMagicLink` | WIRED | Line 5 (import), line 119 (call inside `handleSubmit`) |
| `src/app/page.tsx` | `localStorage` | reads/writes `agenty_kid_email` | WIRED | Line 234: reads on mount; `/setup/page.tsx` line 57: writes on success |
| `src/app/setup/page.tsx` | `src/lib/actions/auth.ts` | calls `setupChildAccount` | WIRED | Line 5 (import), line 46 (call) |
| `src/app/bridge/page.tsx` | `src/lib/actions/auth.ts` | calls `logOut` | WIRED | Line 2 (import), line 64 (`<form action={logOut}>`) |
| `src/__tests__/auth/*.test.ts` | `src/__tests__/helpers/supabase-mock.ts` | import mock factories | WIRED | All 6 test files import from `../helpers/supabase-mock` (confirmed via grep) |

---

## Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|----------|
| AUTH-01 | 00, 02, 03 | Parent account setup via magic link to parent email | SATISFIED | `sendMagicLink` calls `signInWithOtp` with `emailRedirectTo=/auth/confirm?next=/setup`; parent form on `/` page; test stub exists |
| AUTH-02 | 00, 01 | PKCE callback route handler for session/cookie management | SATISFIED | `/auth/confirm/route.ts` uses `exchangeCodeForSession`; note: initial implementation used `verifyOtp` (wrong) — fixed in commit `5bcc6a8` before phase completion |
| AUTH-03 | 00, 02 | Profile row auto-upsert on first login | SATISFIED | `setupChildAccount` explicitly calls `supabaseAdmin.from("profiles").upsert(...)` with `onConflict: "id"` — not reliant on DB trigger alone |
| AUTH-04 | 00, 02, 03 | Kid-friendly daily 6-digit PIN login | SATISFIED | `loginWithPin` uses `signInWithPassword`; PIN pad in `page.tsx` with 64px+ buttons, Adventure Navy styling, Cooper greeting |
| AUTH-05 | 00, 02 | PIN rate limiting (5 attempts per 15min) | SATISFIED | `loginWithPin` queries `pin_attempts` with 15-minute window; returns `tactical_lockdown` with `unlockAt`/`remainingSeconds` after 5 attempts; clears on success |
| AUTH-06 | 00, 01 | Auth middleware protecting `/bridge` routes | SATISFIED | `src/lib/supabase/middleware.ts` redirects unauthenticated `/bridge` requests to `/`; `bridge/layout.tsx` adds defense-in-depth |

All 6 AUTH requirements are satisfied in code. No orphaned requirements detected.

---

## Anti-Patterns Found

No blockers or warnings detected.

Scans performed on: `src/lib/actions/auth.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`, `src/app/auth/confirm/route.ts`, `src/app/auth/error/page.tsx`, `src/app/page.tsx`, `src/app/setup/page.tsx`, `src/app/bridge/layout.tsx`, `src/app/bridge/page.tsx`.

Results:
- No `TODO`, `FIXME`, `HACK`, or `XXX` comments in implementation files
- No `return null` / `return {}` stub returns in server actions
- No `console.log` only implementations
- HTML `placeholder` attributes in inputs are correctly used (not code stubs)
- `animate-shake` class used in `page.tsx` is defined in `globals.css` line 182
- `"use server"` directive present at top of `auth.ts`
- All server actions use `supabaseAdmin` (service role) for writes, `createClient()` for session reads

One notable deviation documented in summaries: the initial `verifyOtp` callback was incorrect and was replaced with `exchangeCodeForSession` in commit `5bcc6a8` during Plan 03 verification. The fix is present in the current codebase.

---

## Human Verification Required

### 1. End-to-End Magic Link + Account Creation

**Test:** Run `npm run dev`. Visit `http://localhost:3000`. With no `agenty_kid_email` in localStorage, confirm the parent magic link form appears. Enter a real email address and click "Send Setup Link". Verify a magic link email arrives. Click the link — confirm you land on `/setup`. Enter a display name and 6-digit PIN (twice), click "Create Agent Account". Verify the success screen appears and shows a synthetic email (`player-{uuid}@agenty.local`).
**Expected:** Full account creation completes; `agenty_kid_email` is saved to localStorage automatically.
**Why human:** Requires live Supabase project with email delivery configured; PKCE redirect chain involves real browser navigation.

### 2. Kid PIN Login to /bridge

**Test:** With `agenty_kid_email` in localStorage (from step 1), visit `/`. Confirm the PIN pad appears with Cooper's greeting. Tap the correct 6-digit PIN. Verify auto-submission at the 6th digit and redirect to `/bridge` where the display name appears.
**Expected:** `/bridge` renders "Welcome to The Bridge, {displayName}!" with a Log Out button.
**Why human:** Requires live session cookie from `signInWithPassword`; cannot verify cookie-setting behavior in static analysis.

### 3. Tactical Lockdown After 5 Wrong PINs

**Test:** Enter an incorrect PIN 5 times in a row. Verify the PIN pad is replaced by the Tactical Lockdown screen showing "Tactical Lockdown!" with a Cooper message and an MM:SS countdown. Wait for the countdown to reach 0:00 and confirm the PIN pad reappears.
**Expected:** Lockout screen appears after 5th failure; countdown decrements each second; pad reappears after timer expires.
**Why human:** Requires live `pin_attempts` table writes via server action; countdown timer behavior must be observed in-browser.

### 4. Unauthenticated /bridge Redirect

**Test:** Clear all browser cookies and localStorage. Directly visit `http://localhost:3000/bridge`. Confirm immediate redirect to `/` (login page) with no flash of the bridge content.
**Expected:** Redirect happens at middleware level (before any server component renders).
**Why human:** Middleware behavior must be observed in a running Next.js server; redirect timing and flash prevention cannot be verified statically.

### 5. Adventure Navy UI Fidelity

**Test:** On the PIN login screen, verify: (a) background is Adventure Navy dark (`#050B14`); (b) PIN buttons are at least 64px tall with chunky 2px borders; (c) Cooper blue (`#3B82F6`) neon glow appears on button hover; (d) filled PIN dots glow Cooper blue; (e) the Tactical Lockdown screen shows amber/orange styling for the timer; (f) all screens feel like a game interface, not a corporate form.
**Expected:** Consistent Adventure Navy design system throughout all auth screens.
**Why human:** Visual aesthetics and touch target quality require browser inspection; Tailwind class compilation and rendering must be verified visually.

---

## Summary

Phase 01 (Auth Foundation) has complete, substantive, and properly wired implementations for all 6 requirements (AUTH-01 through AUTH-06). Every artifact passes all three verification levels:

- **Exists:** All 14 expected files are present
- **Substantive:** No stubs, placeholder returns, or TODO-only implementations; all server actions contain real logic
- **Wired:** All imports are used, all actions are called from the correct pages, localStorage flow is bidirectional

The one code-path correction noted during execution (PKCE `verifyOtp` → `exchangeCodeForSession`) was identified and fixed before phase completion. The current codebase reflects the corrected implementation.

Automated verification cannot confirm: email delivery, live database operations, browser session cookie behavior, or visual rendering quality. Those 5 items are documented above for human testing.

---

_Verified: 2026-03-11_
_Verifier: Claude (gsd-verifier)_
