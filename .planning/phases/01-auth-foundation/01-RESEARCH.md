# Phase 1: Auth Foundation - Research

**Researched:** 2026-03-11
**Domain:** Supabase Auth + Next.js 16 App Router SSR authentication
**Confidence:** HIGH

## Summary

Phase 1 implements a two-tier authentication system: parent magic link signup/setup, and kid 6-digit PIN daily login. The technical core is Supabase Auth with `@supabase/ssr` for cookie-based session management in Next.js 16 App Router, plus application-level rate limiting for PIN brute-force protection.

The synthetic email pattern (`player-{id}@agenty.local` mapped to `signInWithPassword`) is a well-supported approach -- Supabase treats it as standard email+password auth. The magic link flow uses `signInWithOtp` with PKCE (default in `@supabase/ssr`). The middleware/"proxy" pattern for session refresh is well-documented and the project already has the correct `@supabase/ssr` client setup.

**Primary recommendation:** Use the official Supabase SSR proxy pattern with `getClaims()` for middleware session validation, `verifyOtp` for magic link callback, and a `pin_attempts` table in Supabase for rate limiting (no Redis dependency needed).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Adventure Navy (#050B14) dark theme with massive chunky 6-digit PIN pad as centerpiece
- Cooper is the mascot on login screen with tactical greeting ("Ready for your mission, Agent?")
- Game-themed UI: chunky borders, neon blue (Cooper accent #3B82F6), deep shadows
- PIN pad digits sized for iPad touch targets
- Magic link sends parent to `/setup` route
- On `/setup`, parent chooses initial 6-digit PIN for kid
- PIN creation on `/setup` triggers profile row upsert in `profiles`
- Single entry point for account creation -- no other signup flow
- Synthetic email pattern (`player-{id}@agenty.local`) mapped to `signInWithPassword` for kid PIN login
- After 5 failed PIN attempts within 15 minutes: "Tactical Lockdown" message from Cooper
- Lockout is friendly, game-mechanic framing, not punishment
- 15-minute countdown timer showing when kid can try again
- Recovery path: parent magic link bypasses lockout and resets PIN
- Session duration: 24 hours before re-login
- `/bridge/*` unauthenticated -> redirect to PIN login
- Root `/` serves as PIN login (or redirects to `/bridge` if authenticated)
- After successful PIN entry, redirect to `/bridge`

### Claude's Discretion
- Exact PKCE callback route handler implementation (`/auth/callback/route.ts`)
- Middleware implementation details for route protection
- PIN hashing approach (if needed beyond Supabase built-in password hashing)
- Exact Supabase `pin_attempts` table schema for rate limiting
- Loading states and transition animations between auth screens

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Parent can set up child account via magic link sent to parent's email | `signInWithOtp` with `emailRedirectTo` pointing to `/setup` route; PKCE flow enabled by default in `@supabase/ssr` |
| AUTH-02 | PKCE callback route handler exchanges code for session and sets cookie | Use `verifyOtp` with `token_hash` pattern (official template approach) at `/auth/confirm/route.ts`; alternatively `exchangeCodeForSession` at `/auth/callback/route.ts` |
| AUTH-03 | Profile row is upserted in `profiles` table on first login (not reliant on DB trigger alone) | Server Action on `/setup` uses `supabaseAdmin` to upsert profile; DB trigger exists as fallback but explicit upsert is primary |
| AUTH-04 | Kid can log in daily with 6-digit PIN (mapped to `signInWithPassword`) | Synthetic email `player-{userId}@agenty.local` + PIN as password via `signInWithPassword` |
| AUTH-05 | PIN input locks after 5 failed attempts per 15-minute window | `pin_attempts` table in Supabase with Server Action rate-limit check before calling `signInWithPassword` |
| AUTH-06 | Auth middleware protects `/bridge` routes, redirects unauthenticated users to login | Middleware proxy pattern with `getClaims()` for session validation; redirect unauthenticated to `/` |

</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | ^0.9.0 | Cookie-based auth for SSR frameworks | Official Supabase package for Next.js App Router auth |
| `@supabase/supabase-js` | ^2.99.0 | Supabase client (auth, db, realtime) | Core Supabase SDK |
| `next` | 16.1.6 | App Router, middleware, route handlers | Project framework |

### Supporting (No New Dependencies Needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/server` | (bundled) | `NextRequest`/`NextResponse` in middleware | Route protection, session refresh |
| `next/headers` | (bundled) | Cookie access in Server Components/Actions | Server-side auth checks |
| `next/navigation` | (bundled) | `redirect()`, `useRouter()` | Post-auth navigation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase `pin_attempts` table | Upstash Redis | Redis adds a dependency and cost; Supabase table is simpler and already in the stack |
| `getClaims()` in middleware | `getUser()` in middleware | `getUser()` hits Auth server every request (slower); `getClaims()` validates JWT locally (faster, sufficient for session check) |
| `verifyOtp` callback | `exchangeCodeForSession` callback | Both work for magic links; `verifyOtp` is the current official template pattern |

**Installation:** No new packages required. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── page.tsx                    # PIN login screen (root route)
│   ├── setup/
│   │   └── page.tsx                # Parent magic link landing + PIN creation
│   ├── auth/
│   │   ├── confirm/
│   │   │   └── route.ts           # Magic link callback (verifyOtp / code exchange)
│   │   └── error/
│   │       └── page.tsx            # Auth error display
│   ├── bridge/
│   │   ├── layout.tsx              # Protected layout (session check)
│   │   └── page.tsx                # Dashboard (Phase 2)
│   └── layout.tsx                  # Root layout (existing)
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client (existing)
│   │   ├── server.ts              # Server client with cookies (existing)
│   │   ├── admin.ts               # Service-role client (existing)
│   │   └── middleware.ts          # updateSession helper for middleware
│   └── actions/
│       ├── auth.ts                # Auth server actions (magic link, PIN login, rate limiting)
│       └── economy.ts            # Economy server actions (existing)
├── middleware.ts                   # Root middleware (session refresh + route protection)
└── contexts/
    └── AgentContext.tsx            # Agent theming (existing, has Cooper #3B82F6)
```

### Pattern 1: Middleware Proxy for Session Refresh
**What:** Middleware intercepts every request, refreshes expired JWT tokens via `getClaims()`, and passes refreshed cookies to both server components and browser.
**When to use:** Every request to the app (except static assets).
**Example:**
```typescript
// Source: Official Supabase Next.js template (create-next-app -e with-supabase)
// src/lib/supabase/middleware.ts

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // CRITICAL: Do not run code between createServerClient and getClaims()
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Route protection logic here
  if (!user && request.nextUrl.pathname.startsWith("/bridge")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login
  if (user && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/bridge";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

### Pattern 2: Magic Link Callback Route Handler
**What:** Route handler that processes the magic link redirect, exchanges the auth code for a session.
**When to use:** When parent clicks magic link in email.
**Example:**
```typescript
// Source: Official Supabase Next.js template
// src/app/auth/confirm/route.ts

import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/setup";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    } else {
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  redirect(`/auth/error?error=No+token+hash+or+type`);
}
```

### Pattern 3: Synthetic Email PIN Login
**What:** Maps a 6-digit PIN to Supabase's password-based auth using a deterministic synthetic email.
**When to use:** Kid daily login via PIN pad.
**Example:**
```typescript
// src/lib/actions/auth.ts (Server Action)
"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function loginWithPin(profileId: string, pin: string) {
  // 1. Check rate limit first (query pin_attempts table)
  // 2. If locked out, return lockout error with remaining time
  // 3. Attempt sign-in with synthetic email
  const syntheticEmail = `player-${profileId}@agenty.local`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: pin,
  });
  // 4. On failure: record attempt in pin_attempts table
  // 5. On success: clear attempts, return session
}
```

### Pattern 4: PIN Rate Limiting via Supabase Table
**What:** Track failed PIN attempts in a `pin_attempts` table, enforce 5-attempt/15-min lockout.
**When to use:** Before every PIN login attempt.
**Example schema:**
```sql
-- New migration: create pin_attempts table
create table public.pin_attempts (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  ip_address  text  -- optional, for additional security
);

-- Index for fast lookups
create index idx_pin_attempts_profile_window
  on public.pin_attempts(profile_id, attempted_at desc);

-- RLS: no public access (service_role only)
alter table public.pin_attempts enable row level security;
-- No policies = no access via anon/authenticated roles
```

### Anti-Patterns to Avoid
- **Using `getSession()` in middleware:** Not guaranteed to revalidate the auth token. Always use `getClaims()` (fast, local JWT validation) or `getUser()` (slower, server-side validation).
- **Creating Supabase client as a global singleton:** With Fluid compute, always create a new client per request in middleware/server actions.
- **Running code between `createServerClient` and `getClaims()`:** Can cause random logouts due to cookie timing issues.
- **Client-side rate limiting:** Easily bypassed. All rate limiting must happen server-side via Server Actions.
- **Trusting client-supplied `profileId` without validation:** The `loginWithPin` action should validate that the profileId corresponds to a real profile.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT token refresh | Custom token refresh logic | `@supabase/ssr` middleware `updateSession` + `getClaims()` | Cookie synchronization between server/browser is complex; the library handles edge cases around token expiry, cookie chunking, and race conditions |
| Password hashing for PIN | Custom bcrypt/argon2 hashing | Supabase Auth `signInWithPassword` / `admin.createUser` | Supabase handles hashing internally; the PIN IS the password in the synthetic email pattern |
| Session management | Custom JWT/cookie logic | `@supabase/ssr` cookie-based sessions | Handles httpOnly cookies, chunking for large JWTs, SameSite attributes, and secure flags automatically |
| Email sending for magic links | Custom email integration | `supabase.auth.signInWithOtp()` | Supabase handles email delivery, rate limiting, and OTP expiry |
| PKCE code verifier/challenge | Manual PKCE implementation | `@supabase/ssr` (PKCE enabled by default) | Library generates and stores code verifier automatically in cookies |

**Key insight:** Supabase Auth handles all cryptographic operations (password hashing, JWT signing, PKCE challenges). The application code only needs to call the right API methods and manage routing.

## Common Pitfalls

### Pitfall 1: Cookie Write Failure in Server Components
**What goes wrong:** Server Components are read-only for cookies. Attempting to set cookies (e.g., during token refresh) silently fails.
**Why it happens:** Next.js App Router design -- Server Components render on the server but cannot modify the response.
**How to avoid:** Always use middleware for token refresh. The `try/catch` in the server.ts `setAll` is intentional -- middleware handles the actual cookie writes.
**Warning signs:** Users getting randomly logged out despite valid sessions.

### Pitfall 2: Synthetic Email Must Be Created BEFORE PIN Login
**What goes wrong:** `signInWithPassword` fails because no Supabase Auth user exists with the synthetic email.
**Why it happens:** The parent magic link creates a Supabase user with the PARENT's email. The kid's synthetic email user must be created separately during the `/setup` flow.
**How to avoid:** During `/setup`, use `supabaseAdmin.auth.admin.createUser()` to create the kid's auth user with the synthetic email and PIN as password. Then upsert the `profiles` row.
**Warning signs:** "Invalid login credentials" error on PIN entry despite correct PIN.

### Pitfall 3: Profile Row Race Condition
**What goes wrong:** Auth user created but profile row missing, causing "Profile not found" errors in economy actions.
**Why it happens:** DB trigger (`on_auth_user_created`) and explicit upsert could race, or trigger could fail silently.
**How to avoid:** Use explicit upsert in the `/setup` Server Action (primary), keep DB trigger as fallback. The requirement says "not reliant on DB trigger alone."
**Warning signs:** Economy actions returning "Profile not found" for newly created accounts.

### Pitfall 4: Middleware Matcher Too Broad or Too Narrow
**What goes wrong:** Either static assets trigger auth checks (slow page loads) or API routes bypass protection.
**Why it happens:** Incorrect regex in middleware `config.matcher`.
**How to avoid:** Use the official matcher pattern that excludes `_next/static`, `_next/image`, `favicon.ico`, and common static file extensions.
**Warning signs:** Slow page loads (matcher too broad) or unprotected routes (matcher too narrow).

### Pitfall 5: Rate Limiting Clock Skew
**What goes wrong:** Lockout window doesn't behave as expected (locks too early or too late).
**Why it happens:** Using JavaScript `Date.now()` instead of database `now()` for timestamp comparisons.
**How to avoid:** All timestamp logic in the `pin_attempts` table should use `now()` (database time). Query with `WHERE attempted_at > now() - interval '15 minutes'`.
**Warning signs:** Users reporting inconsistent lockout behavior.

### Pitfall 6: NEXT_PUBLIC_SUPABASE_ANON_KEY vs PUBLISHABLE_KEY
**What goes wrong:** Confusion between old and new Supabase key naming.
**Why it happens:** Supabase is transitioning from `anon_key` to `publishable_key` naming. Latest templates use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
**How to avoid:** This project uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (in existing client.ts and server.ts). Keep using this name consistently -- both work with current Supabase versions. Do NOT rename mid-project.
**Warning signs:** Environment variable not found errors after copy-pasting from new docs.

## Code Examples

### Parent Magic Link Trigger (Server Action)
```typescript
// Source: Supabase signInWithOtp docs
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function sendMagicLink(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/setup`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Show "check your email" message
  return { success: true };
}
```

### Create Kid Account on /setup (Server Action)
```typescript
// Source: Supabase admin.createUser docs
"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function setupChildAccount(formData: FormData) {
  const pin = formData.get("pin") as string;
  const displayName = formData.get("displayName") as string;

  // Verify parent is authenticated
  const supabase = await createClient();
  const { data: { user: parent } } = await supabase.auth.getUser();
  if (!parent) return { error: "Not authenticated" };

  // Create kid's auth user with synthetic email
  const kidEmail = `player-${crypto.randomUUID()}@agenty.local`;
  const { data: kidUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: kidEmail,
    password: pin,
    email_confirm: true, // Skip email verification for synthetic account
    user_metadata: { display_name: displayName, parent_id: parent.id },
  });

  if (createError) return { error: createError.message };

  // Explicit profile upsert (don't rely solely on DB trigger)
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: kidUser.user.id,
      display_name: displayName || "Adventurer",
    }, { onConflict: "id" });

  if (profileError) return { error: profileError.message };

  return { success: true, kidEmail };
}
```

### PIN Login with Rate Limiting (Server Action)
```typescript
// Source: Supabase signInWithPassword docs + custom rate limiting
"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

export async function loginWithPin(kidEmail: string, pin: string) {
  // 1. Check rate limit
  const { data: attempts } = await supabaseAdmin
    .from("pin_attempts")
    .select("attempted_at")
    .eq("profile_email", kidEmail)
    .gte("attempted_at", new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000).toISOString())
    .order("attempted_at", { ascending: false });

  if (attempts && attempts.length >= MAX_ATTEMPTS) {
    const oldestInWindow = new Date(attempts[attempts.length - 1].attempted_at);
    const unlockAt = new Date(oldestInWindow.getTime() + LOCKOUT_WINDOW_MINUTES * 60 * 1000);
    return {
      error: "tactical_lockdown",
      unlockAt: unlockAt.toISOString(),
      remainingSeconds: Math.ceil((unlockAt.getTime() - Date.now()) / 1000),
    };
  }

  // 2. Attempt sign-in
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: kidEmail,
    password: pin,
  });

  if (error) {
    // 3. Record failed attempt
    await supabaseAdmin.from("pin_attempts").insert({
      profile_email: kidEmail,
    });
    return { error: "wrong_pin", attemptsRemaining: MAX_ATTEMPTS - (attempts?.length ?? 0) - 1 };
  }

  // 4. Clear old attempts on success
  await supabaseAdmin
    .from("pin_attempts")
    .delete()
    .eq("profile_email", kidEmail);

  return { success: true };
}
```

### Middleware Route Protection
```typescript
// Source: Official Supabase template proxy pattern
// src/middleware.ts

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | auth-helpers is deprecated; ssr is framework-agnostic |
| `getSession()` in middleware | `getClaims()` in middleware | Late 2024/2025 | `getSession()` not safe server-side; `getClaims()` validates JWT locally |
| `getUser()` in middleware | `getClaims()` in middleware | 2025 | `getUser()` hits auth server each request; `getClaims()` is faster for middleware |
| `exchangeCodeForSession` callback | `verifyOtp` with `token_hash` callback | 2025 | Official template now uses `verifyOtp` pattern; both still work |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 2025 (transition) | New naming convention; old name still works. **Keep using ANON_KEY in this project** |
| "middleware.ts" naming | "proxy" concept (same file) | 2025 | Supabase docs now call it "proxy"; still exports from middleware.ts in Next.js |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Fully deprecated, replaced by `@supabase/ssr`
- `supabase.auth.getSession()` in server code: Unsafe, can be spoofed from cookies
- Implicit flow for SSR: PKCE is the default and recommended flow

## Open Questions

1. **Kid Account Discovery for PIN Login**
   - What we know: Kid logs in with PIN on a shared device. The synthetic email is needed to call `signInWithPassword`.
   - What's unclear: How does the app know WHICH kid account to authenticate? There's no email input on the kid's login screen.
   - Recommendation: Store the kid's synthetic email in localStorage after first setup. If localStorage is empty (new device), show a "parent re-link" flow via magic link. This is a UX decision the planner should address.

2. **Session Duration Configuration**
   - What we know: User wants 24-hour sessions. Supabase default JWT expiry is 3600 seconds (1 hour).
   - What's unclear: Whether to change JWT expiry in Supabase config or handle via refresh token rotation.
   - Recommendation: Keep default 1-hour JWT expiry (security best practice). The middleware automatically refreshes tokens via `getClaims()`. The 24-hour window is effectively the refresh token lifetime. Configure `[auth.sessions] timebox = "24h"` in supabase config.toml.

3. **Parent-to-Kid Account Linking**
   - What we know: Parent signs up via magic link, then creates kid account on `/setup`.
   - What's unclear: How parent and kid accounts are linked in the database (parent_id in kid's user_metadata? Separate linking table?).
   - Recommendation: Store `parent_id` in kid's `user_metadata` during `admin.createUser()`. For v1 this is sufficient. A formal linking table is v2 scope.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed -- needs setup (Vitest recommended for Next.js 16) |
| Config file | none -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Magic link sends OTP email | integration | `npx vitest run src/__tests__/auth/magic-link.test.ts -t "sends magic link"` | No -- Wave 0 |
| AUTH-02 | Callback exchanges code for session | integration | `npx vitest run src/__tests__/auth/callback.test.ts -t "verifies OTP"` | No -- Wave 0 |
| AUTH-03 | Profile row upserted on setup | unit | `npx vitest run src/__tests__/auth/setup.test.ts -t "upserts profile"` | No -- Wave 0 |
| AUTH-04 | PIN login via signInWithPassword | integration | `npx vitest run src/__tests__/auth/pin-login.test.ts -t "authenticates with PIN"` | No -- Wave 0 |
| AUTH-05 | Rate limiting locks after 5 attempts | unit | `npx vitest run src/__tests__/auth/rate-limit.test.ts -t "locks after 5 attempts"` | No -- Wave 0 |
| AUTH-06 | Middleware redirects unauthenticated | unit | `npx vitest run src/__tests__/auth/middleware.test.ts -t "redirects to login"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Install Vitest: `npm install -D vitest @vitejs/plugin-react`
- [ ] `vitest.config.ts` -- framework config with path aliases
- [ ] `src/__tests__/auth/` -- test directory structure
- [ ] `src/__tests__/helpers/supabase-mock.ts` -- shared Supabase client mocks
- [ ] `src/__tests__/auth/magic-link.test.ts` -- covers AUTH-01
- [ ] `src/__tests__/auth/callback.test.ts` -- covers AUTH-02
- [ ] `src/__tests__/auth/setup.test.ts` -- covers AUTH-03
- [ ] `src/__tests__/auth/pin-login.test.ts` -- covers AUTH-04
- [ ] `src/__tests__/auth/rate-limit.test.ts` -- covers AUTH-05
- [ ] `src/__tests__/auth/middleware.test.ts` -- covers AUTH-06

## Sources

### Primary (HIGH confidence)
- Official Supabase Next.js template (`npx create-next-app -e with-supabase`) -- proxy.ts, auth/confirm/route.ts, server.ts patterns verified from downloaded template
- [Supabase signInWithOtp docs](https://supabase.com/docs/reference/javascript/auth-signinwithotp) -- API signature and parameters
- [Supabase signInWithPassword docs](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) -- API signature for PIN login
- [Supabase SSR Next.js guide](https://supabase.com/docs/guides/auth/server-side/nextjs) -- middleware/proxy pattern
- [Supabase getClaims API](https://supabase.com/docs/reference/javascript/auth-getclaims) -- new JWT validation method
- Installed `@supabase/ssr@0.9.0` -- verified `getClaims()` exists in type definitions

### Secondary (MEDIUM confidence)
- [getClaims vs getUser discussion](https://github.com/supabase/supabase/issues/40985) -- performance comparison and when to use each
- [Supabase PKCE flow docs](https://supabase.com/docs/guides/auth/sessions/pkce-flow) -- PKCE is default in @supabase/ssr
- [Supabase server-side advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide) -- code exchange patterns

### Tertiary (LOW confidence)
- Synthetic email pattern for PIN login -- not documented in official Supabase docs as a pattern, but technically sound since Supabase treats it as standard email+password auth. Needs validation during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and verified, official template code verified
- Architecture: HIGH -- patterns directly from official Supabase template and docs
- Pitfalls: HIGH -- well-documented in Supabase troubleshooting guides and GitHub discussions
- Rate limiting: MEDIUM -- custom implementation using Supabase table (no official pattern), but straightforward SQL
- Synthetic email pattern: MEDIUM -- technically valid but unconventional; needs careful testing

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (30 days -- Supabase SSR is stable)
