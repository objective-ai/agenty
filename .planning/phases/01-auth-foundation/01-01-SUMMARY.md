---
phase: 01-auth-foundation
plan: 01
subsystem: auth
tags: [supabase, middleware, pkce, magic-link, rls, session-management]

requires:
  - phase: 01-auth-foundation/00
    provides: "Supabase client helpers (server.ts, client.ts, admin.ts) and test stubs"
provides:
  - "updateSession middleware helper for JWT refresh and route protection"
  - "Root Next.js middleware with static asset exclusion"
  - "PKCE callback route for magic link verification"
  - "Auth error display page with Adventure Navy styling"
  - "pin_attempts table migration with RLS (service_role only)"
  - "24-hour session timebox configuration"
affects: [01-auth-foundation/02, 01-auth-foundation/03]

tech-stack:
  added: []
  patterns: ["Supabase SSR middleware pattern with getUser() for session refresh", "PKCE callback with verifyOtp", "RLS with no policies for service_role-only tables"]

key-files:
  created:
    - src/lib/supabase/middleware.ts
    - src/middleware.ts
    - src/app/auth/confirm/route.ts
    - src/app/auth/error/page.tsx
    - supabase/migrations/20260311000000_create_pin_attempts.sql
  modified:
    - supabase/config.toml

key-decisions:
  - "Used getUser() instead of getClaims() — getClaims() not available in installed @supabase/supabase-js v2.99"
  - "No ip_address column in pin_attempts — unnecessary for kid's app on shared family device"

patterns-established:
  - "Middleware pattern: createServerClient with cookie forwarding + getUser() immediately after"
  - "Service-role-only tables: enable RLS with zero policies"

requirements-completed: [AUTH-02, AUTH-06]

duration: 2min
completed: 2026-03-11
---

# Phase 01 Plan 01: Auth Infrastructure Summary

**Supabase middleware with route protection, PKCE magic link callback, pin_attempts migration, and 24-hour session timebox**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-11T07:50:03Z
- **Completed:** 2026-03-11T07:52:21Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Middleware that protects /bridge routes (redirects unauthenticated to /) and redirects authenticated users from / to /bridge
- PKCE callback route that exchanges magic link token_hash for a session via verifyOtp
- Adventure Navy styled error page with Cooper theme for auth failures
- pin_attempts table with RLS and no public access for server-side rate limiting
- 24-hour session timebox enabled in supabase/config.toml

## Task Commits

Each task was committed atomically:

1. **Task 1: Middleware helper + root middleware + PKCE callback + error page** - `76351a5` (feat)
2. **Task 2: Create pin_attempts migration and configure 24-hour sessions** - `d6fc9ef` (feat)

## Files Created/Modified
- `src/lib/supabase/middleware.ts` - updateSession helper with route protection logic
- `src/middleware.ts` - Root middleware wiring with static asset exclusion matcher
- `src/app/auth/confirm/route.ts` - PKCE callback handler for magic link verification
- `src/app/auth/error/page.tsx` - Auth error page with Cooper/Adventure Navy styling
- `supabase/migrations/20260311000000_create_pin_attempts.sql` - Rate limiting table with RLS
- `supabase/config.toml` - Enabled 24-hour session timebox

## Decisions Made
- Used `getUser()` instead of `getClaims()` — the plan referenced `getClaims()` but it does not exist in @supabase/supabase-js v2.99. `getUser()` is the standard approach and serves the same purpose (revalidates session, refreshes token).
- Kept pin_attempts table simple (profile_id + attempted_at only) — no ip_address column needed for a kid's app on shared family devices.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used getUser() instead of getClaims()**
- **Found during:** Task 1 (Middleware helper)
- **Issue:** Plan specified `getClaims()` API but it does not exist in installed @supabase/supabase-js v2.99.0
- **Fix:** Used `getUser()` which is the official Supabase SSR middleware pattern for session validation and token refresh
- **Files modified:** src/lib/supabase/middleware.ts
- **Verification:** `next build` succeeds, middleware functions correctly
- **Committed in:** 76351a5

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential substitution for non-existent API. `getUser()` provides identical functionality. No scope creep.

## Issues Encountered
- Next.js 16 shows deprecation warning for "middleware" file convention (recommends "proxy" instead). Middleware still works; this is a future migration concern, not a blocker for the current phase.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Middleware infrastructure is in place for all auth flows
- pin_attempts table ready for Plan 02 (PIN verification with rate limiting)
- PKCE callback route ready for Plan 03 (magic link login flow)
- Session duration configured to 24 hours per user decision

## Self-Check: PASSED

All 6 files verified present. Both task commits (76351a5, d6fc9ef) verified in git log.

---
*Phase: 01-auth-foundation*
*Completed: 2026-03-11*
