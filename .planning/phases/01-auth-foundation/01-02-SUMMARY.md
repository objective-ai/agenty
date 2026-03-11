---
phase: 01-auth-foundation
plan: 02
subsystem: auth
tags: [supabase, server-actions, magic-link, pin-auth, rate-limiting, otp]

requires:
  - phase: 01-auth-foundation/00
    provides: "Supabase client helpers (server.ts, client.ts, admin.ts)"
  - phase: 01-auth-foundation/01
    provides: "Middleware, PKCE callback, pin_attempts table, session timebox"
provides:
  - "sendMagicLink server action for parent OTP email"
  - "setupChildAccount server action with synthetic email and profile upsert"
  - "loginWithPin server action with 5-attempt/15-min rate limiting"
  - "logOut server action with redirect"
  - "get_uid_by_email Postgres RPC for email-to-UUID lookup"
affects: [01-auth-foundation/03]

tech-stack:
  added: []
  patterns: ["Server actions with 'use server' directive for all auth logic", "Service-role RPC for cross-schema lookups", "Synthetic email pattern for child accounts without real inboxes"]

key-files:
  created:
    - src/lib/actions/auth.ts
    - supabase/migrations/20260311100000_get_uid_by_email.sql
  modified: []

key-decisions:
  - "Used service-role RPC (get_uid_by_email) instead of getUserByEmail -- that method does not exist in @supabase/supabase-js v2.99"
  - "PIN stored as Supabase auth password (Supabase handles hashing) -- no custom hash logic"

patterns-established:
  - "Auth server actions pattern: all mutations via 'use server' with createClient() for session and supabaseAdmin for writes"
  - "Synthetic email for kid accounts: player-{uuid}@agenty.local"
  - "Rate limiting via pin_attempts table with 15-minute sliding window"

requirements-completed: [AUTH-01, AUTH-03, AUTH-04, AUTH-05]

duration: 3min
completed: 2026-03-11
---

# Phase 01 Plan 02: Auth Server Actions Summary

**Four server actions -- magic link OTP, child account setup with profile upsert, PIN login with tactical lockdown rate limiting, and logout with redirect**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T07:55:10Z
- **Completed:** 2026-03-11T07:58:25Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- sendMagicLink triggers OTP email with redirect to /auth/confirm?next=/setup
- setupChildAccount creates kid auth user with synthetic email, PIN as password, and explicit profile upsert (AUTH-03)
- loginWithPin enforces 5-attempt/15-minute lockout returning tactical_lockdown with unlockAt and remainingSeconds
- logOut signs out and redirects to landing page
- All auth logic is server-side via "use server" directive

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement sendMagicLink server action** - `105161d` (feat)
2. **Task 2: Implement setupChildAccount, loginWithPin, and logOut** - `3118a6c` (feat)

## Files Created/Modified
- `src/lib/actions/auth.ts` - All four auth server actions (sendMagicLink, setupChildAccount, loginWithPin, logOut)
- `supabase/migrations/20260311100000_get_uid_by_email.sql` - Service-role-only Postgres function to resolve user ID by email

## Decisions Made
- Used a Postgres RPC function (`get_uid_by_email`) instead of `getUserByEmail` -- that admin API method does not exist in @supabase/supabase-js v2.99. The RPC is `security definer` with execute revoked from public/anon/authenticated, so only the service role can call it.
- PIN is stored as the Supabase auth user's password. Supabase handles bcrypt hashing internally -- no custom hash logic needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created get_uid_by_email RPC to replace missing getUserByEmail**
- **Found during:** Task 2 (loginWithPin implementation)
- **Issue:** Plan specified `supabaseAdmin.auth.admin.getUserByEmail(kidEmail)` but this method does not exist in @supabase/supabase-js v2.99. The GoTrueAdminApi only exposes `getUserById`, `listUsers`, `createUser`, etc.
- **Fix:** Created a Postgres function `get_uid_by_email(text)` that queries `auth.users` directly. It is `security definer` with execute privileges revoked from all roles except service_role. Called via `supabaseAdmin.rpc()`.
- **Files modified:** supabase/migrations/20260311100000_get_uid_by_email.sql, src/lib/actions/auth.ts
- **Verification:** `next build` succeeds, function signature correct
- **Committed in:** 3118a6c

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential substitution for non-existent API method. The RPC approach is actually more secure (server-side SQL vs client-side filter). No scope creep.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All four auth server actions ready for Plan 03 (auth UI pages)
- setupChildAccount returns kidEmail for client-side storage (needed by loginWithPin)
- Rate limiting infrastructure complete (pin_attempts table from Plan 01 + query logic in Plan 02)

## Self-Check: PASSED

All 2 files verified present. Both task commits (105161d, 3118a6c) verified in git log. 4 exported functions confirmed in auth.ts.

---
*Phase: 01-auth-foundation*
*Completed: 2026-03-11*
