# Pitfalls Research

**Domain:** Gamified kids' learning OS — kid-friendly auth, animated game dashboard, Supabase economy wiring
**Researched:** 2026-03-10
**Confidence:** HIGH (auth/security), HIGH (Supabase integration), MEDIUM (animation gotchas), HIGH (UX/engagement patterns)

---

## Critical Pitfalls

### Pitfall 1: PIN with No Brute-Force Protection

**What goes wrong:**
A 4-digit PIN has only 10,000 possible combinations. Without rate limiting, an automated script can exhaust the entire keyspace in seconds. A 6-digit PIN is still only 1,000,000 combinations — trivially brute-forceable without server-side throttling.

**Why it happens:**
PIN auth is implemented as a quick login convenience and developers treat it the same as a full password, skipping the lockout/throttle logic. The frontend swallows failed attempts silently and the backend has no memory of them across requests.

**How to avoid:**
- Implement server-side rate limiting on the PIN verification endpoint: max 5 failed attempts per 15-minute window per IP and per user ID
- After 5 failures, require the parent's magic link to re-authorize the session before PIN attempts resume
- Store attempt count and window start in a lightweight server-side store (Redis, Upstash, or a Supabase `pin_attempts` table with a created_at column)
- Return HTTP 429 on lockout — never a descriptive error that reveals whether the user ID exists

**Warning signs:**
- PIN check is a direct Supabase client call from the browser with no server middleware
- No `pin_attempts` tracking table or rate-limit middleware exists
- Frontend simply shows "Wrong PIN" with no cooldown UI

**Phase to address:**
Auth phase (PIN implementation). Must be built into the initial PIN verification handler, not retrofitted.

---

### Pitfall 2: Profiles Row Not Created on First Magic-Link Login

**What goes wrong:**
The Supabase auth user is created successfully when the magic link is clicked, but no corresponding row exists in `public.profiles`. Every downstream query (`awardLoot`, `spendEnergy`, stats display) then fails with "row not found" or a foreign key violation, often silently from the app's perspective.

**Why it happens:**
Teams rely on a database trigger (`on_auth_user_created`) to insert the profile row, but triggers can fail silently if: (a) RLS on `profiles` blocks the trigger's service context, (b) the trigger function has a bug that throws an exception, or (c) the trigger is never created in the first place after schema migrations.

**How to avoid:**
- Use the Server Action that handles the magic-link callback to explicitly `upsert` into `profiles` after confirming the session — do not rely solely on a trigger
- Pattern: `supabase.from('profiles').upsert({ id: user.id, ... }, { onConflict: 'id' })` inside the auth callback Server Action
- If a DB trigger is also used, add a `SECURITY DEFINER` attribute to the trigger function so it runs with `postgres` role permissions, bypassing RLS
- Add a startup check in the Bridge dashboard: if `profiles` row is missing, redirect to a "first time setup" flow rather than crashing

**Warning signs:**
- Dashboard shows blank/zero stats on first login only
- Supabase logs show FK constraint violations on `loot_ledger` or `energy_logs` inserts after magic link
- The only profile-creation code is a DB trigger with no fallback

**Phase to address:**
Auth phase (magic link callback handling). The profile upsert must be part of the callback route handler, not an afterthought.

---

### Pitfall 3: Supabase Auth Hash Fragment Lost in Next.js App Router

**What goes wrong:**
Supabase magic links deliver the session as a URL hash fragment (e.g., `#access_token=...&refresh_token=...`). Next.js App Router route handlers run server-side and never receive the hash — the server sees a bare callback URL with no tokens. Authentication appears to succeed client-side but no session cookie is ever set.

**Why it happens:**
The hash is a browser-only concept; it never reaches the server. Developers follow older Supabase tutorials that assume Pages Router or a client-side SPA and miss the App Router-specific callback pattern.

**How to avoid:**
- Use the official `@supabase/ssr` package's `createServerClient` with Next.js cookie helpers
- Create a dedicated `/auth/callback/route.ts` route handler that calls `supabase.auth.exchangeCodeForSession(code)` using the `code` query parameter (not the hash) — Supabase's PKCE flow sends `code` as a query param, not a hash
- In the Supabase dashboard, enable **PKCE flow** (the default for server-side auth); disable implicit flow
- Never attempt to read `#access_token` from a server-side route handler

**Warning signs:**
- Magic link redirect lands on the app but user is immediately shown the login screen again
- No `Set-Cookie` headers appear in the auth callback response
- Auth redirect URL is set to a client-side page rather than `/auth/callback`

**Phase to address:**
Auth phase (magic link flow setup). Configure PKCE flow and the callback route before any other auth work.

---

### Pitfall 4: Economy Actions Callable by Any Authenticated User

**What goes wrong:**
The `awardLoot()` and `spendEnergy()` Server Actions are accessible to any authenticated Supabase session. If the kid's account credentials (or the anon key + valid JWT) are obtained, any caller can fire arbitrary `awardLoot()` calls and inject gold into any profile, or drain energy to zero.

**Why it happens:**
Server Actions feel "safe" because they run server-side, but they are HTTP endpoints under the hood. Without server-side validation of *who is allowed to request a reward and why*, they become an open economy exploit surface.

**How to avoid:**
- Every `awardLoot()` call must be gated by a server-side idempotency key tied to a specific quest completion event (e.g., `quest_completion_id` stored in DB, marked as `claimed = true` after first use)
- The Server Action verifies: (1) the calling user's JWT matches the target `profile_id`, (2) the quest/event exists and belongs to that user, (3) it has not already been claimed
- Never accept `amount` as a parameter from the client — the server looks up the canonical reward amount from the quest definition
- Supabase RLS policies on `loot_ledger` should restrict INSERT to service_role only (Server Actions use the service client), so direct client SDK calls cannot insert

**Warning signs:**
- `awardLoot` accepts an arbitrary `amount` parameter passed from the client
- No `claimed` or idempotency guard on quest completions in the DB
- The daily reward button can be clicked multiple times and each click triggers a new `awardLoot()` call

**Phase to address:**
Economy wiring phase (Bridge dashboard). Add idempotency checks before wiring the daily reward button and quest completion trigger.

---

### Pitfall 5: Framer Motion Components Missing `use client` in App Router

**What goes wrong:**
Any component using `motion.div`, `AnimatePresence`, or `useAnimation` crashes with a hydration error or "ReactDOM is not defined" because these APIs require browser DOM access. In Next.js App Router, all components default to Server Components.

**Why it happens:**
Developers copy Framer Motion examples written for Pages Router or CRA and paste them into App Router page files without adding the `'use client'` directive. The error message is often cryptic and points to Framer Motion internals rather than the missing directive.

**How to avoid:**
- All Framer Motion components must live in dedicated Client Component files with `'use client'` at the top
- Create a thin wrapper pattern: `AnimatedWrapper.tsx` (client) wraps the motion logic; Server Components import and render the wrapper
- Use `LazyMotion` + `domAnimation` feature bundle to reduce bundle size (~18kb vs ~50kb full bundle)
- Add `suppressHydrationWarning` on motion elements that have initial state differing from server render

**Warning signs:**
- "ReactDOM.createRoot is not a function" or "Event handlers cannot be passed to Client Component props" errors
- Framer Motion animations work in development but show a flash/flicker on first load in production (hydration mismatch)
- `layout` prop on a motion component causes elements to jump on first render

**Phase to address:**
Bridge dashboard phase (all animated UI components). Establish the `'use client'` wrapper convention before building any animated reward/stats components.

---

### Pitfall 6: Gold Counter Animation Firing Before Server Confirms the Award

**What goes wrong:**
The animated gold counter plays the count-up animation (e.g., 100 → 150) immediately on button click as an optimistic update, but if the `awardLoot()` Server Action fails (duplicate claim, network error, RLS violation), the UI shows the wrong balance permanently. The user sees gold they don't actually have.

**Why it happens:**
Optimistic UI is the right pattern for responsiveness, but without a proper rollback mechanism, a failed server action leaves stale optimistic state. React's `useOptimistic` hook does rebase on source state change, but only if the component re-renders with the corrected server value after failure.

**How to avoid:**
- Use `useOptimistic` (React 19 / Next.js 15 built-in) for the balance counter: set optimistic value on action start, let it auto-revert to server value if action throws
- Always `revalidatePath` or `revalidateTag` at the end of a successful `awardLoot()` so Next.js re-fetches the canonical balance
- Visually distinguish the "pending" state (e.g., slightly dimmed counter with a spinner) from the "confirmed" state — never show the full celebration animation until the server responds with success
- Wrap the Server Action call in try/catch on the client; show a toast/error indicator on failure

**Warning signs:**
- Gold counter jumps immediately on click with no loading state
- Clicking "Claim Daily Reward" rapidly can trigger multiple in-flight Server Actions
- No `revalidatePath` call at the end of `awardLoot()` in `economy.ts`

**Phase to address:**
Economy wiring phase (daily reward button, quest completion trigger). Define the optimistic/confirmed state machine before wiring any reward action.

---

### Pitfall 7: COPPA-Adjacent Data Collection via Third-Party SDKs

**What goes wrong:**
An analytics SDK, error monitoring tool, or font loader silently collects persistent identifiers (device IDs, IP addresses, fingerprints) or cross-site tracking data from a child user. Even though the app itself doesn't actively collect PII, the SDK does — and the app operator is liable under COPPA (updated rule effective June 23, 2025).

**Why it happens:**
Developers add analytics/monitoring as a "sensible default" without auditing what data each SDK transmits. Free-tier analytics tools are often ad-funded and rely on cross-app profiling. COPPA's "directed to children" trigger applies based on the app's actual audience, not a stated age gate.

**How to avoid:**
- Audit every third-party script/SDK before adding it: explicitly check their privacy policy for COPPA compliance statements
- For error monitoring, use a self-hosted or privacy-first option (e.g., Sentry with IP anonymization, no replay on child sessions) or skip it for MVP
- Do not add Google Analytics, Meta Pixel, Hotjar, FullStory, or any ad-network SDK
- For font loading: self-host fonts (Google Fonts' CDN logs IPs) — the Adventure Navy design system uses custom fonts; bundle them with the app
- Log only aggregate, anonymous, session-scoped events server-side (Supabase table with no PII)

**Warning signs:**
- Any `<Script src="https://www.googletagmanager.com/...">` or similar in `layout.tsx`
- Error boundaries reporting to a third-party service with user session context
- Google Fonts `@import` in `globals.css` rather than locally served font files

**Phase to address:**
Auth phase (initial setup) and every subsequent phase. Review `layout.tsx` and `next.config.js` for third-party scripts before each phase ships.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode gold reward amount in client component | Faster to implement | Client can be modified to pass any amount to Server Action | Never — amount must come from server-side quest definition |
| Skip PIN attempt rate limiting for MVP | Faster auth implementation | 4-digit PIN is brute-forceable in seconds without throttling | Never |
| Use a DB trigger alone for profile creation (no fallback) | Clean separation of concerns | Silent failures leave orphaned auth users with no profile; every economy action breaks | Only if trigger is tested and a Server Action fallback upsert exists |
| Animate balance with `useState` + `setInterval` outside `useEffect` | Simple to write | Stale closure captures old balance value; multiple rapid clicks create competing animation loops | Never — use a proper animation library (Motion's AnimateNumber) |
| Use service_role key in a client component to bypass RLS | Unblocks development quickly | Full database bypass exposed in browser devtools; catastrophic security hole | Never |
| Skip `revalidatePath` after Server Action | Fewer round trips | UI shows stale data after economy mutations; gold balance doesn't update without page refresh | Never for economy mutations |
| Single Supabase client instance shared across server and client | Simpler setup | Server client with service_role key gets leaked to client bundle | Never — maintain separate `createServerClient` and `createBrowserClient` instances |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase magic link + Next.js App Router | Expecting hash fragment in route handler | Use PKCE flow; exchange `?code=` param in `/auth/callback/route.ts` via `exchangeCodeForSession()` |
| Supabase RLS + Server Actions | Calling service_role client from a component mistakenly | Keep service_role client in Server Actions only (`actions/economy.ts`); browser client uses anon key + user JWT |
| Supabase `profiles` table + auth trigger | Trigger creates profile but RLS blocks the insert | Set trigger function as `SECURITY DEFINER`; add Server Action upsert as fallback in auth callback |
| Framer Motion + App Router | Using `motion.*` in Server Component files | Add `'use client'` to every file importing from `framer-motion`; wrap Server Component pages with thin Client Component animation shells |
| `useOptimistic` + Server Action failure | Optimistic state persists after server error | Always `revalidatePath` on success; wrap action in try/catch with rollback toast on failure |
| Supabase anon key in `NEXT_PUBLIC_` | Treating it as a secret | Anon key exposure is acceptable only when RLS is enabled on all tables; service_role key must never have `NEXT_PUBLIC_` prefix |
| PIN storage | Storing raw PIN in `profiles` table | Hash the PIN server-side with bcrypt/argon2 before storage; never store or log the raw PIN value |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Animating `width`/`height` instead of `transform` | Gold counter or card animations cause layout thrashing, janky 15-30fps on low-end devices | Animate `scale`, `x`, `y`, `opacity` only; use `layout` prop for size changes (FLIP technique) | On any device; especially visible on budget Android tablets a 9-year-old might use |
| Fetching stats (gold, XP, energy) in client `useEffect` on every render | Stats flicker blank then populate; extra waterfall network round trip | Fetch stats as a Server Component prop passed down; use `cache()` or `unstable_cache` for Supabase calls | From first render in production |
| Multiple simultaneous Framer Motion `layout` animations | Elements jump or overlap during quest completion + stats update animations | Stagger animations sequentially via `transition.delay`; avoid concurrent `layout` animations on sibling elements | Visible any time two animated sections update simultaneously |
| Non-memoized animation variants defined inline | Every parent re-render recreates variant objects, causing unnecessary child re-renders | Define `variants` as module-level constants outside component functions | As component tree grows; especially on the Bridge dashboard with multiple animated stat cards |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing raw PIN in the database | Database dump exposes all PINs; attacker can log in as any child with zero cracking effort | Hash PIN with bcrypt (cost factor 10+) in the Server Action before inserting into `profiles` |
| No rate limiting on PIN verification endpoint | 4-digit PIN brute-forceable in <1 hour with no throttle | 5 attempts per 15-min window per IP + user ID; lockout requires parent magic link to reset |
| `awardLoot()` accepting client-supplied `amount` | Attacker calls Server Action directly with `amount: 999999` and gives child unlimited gold | Amount must be looked up server-side from the quest definition table; never trust client-supplied values |
| Service_role key in environment variable with `NEXT_PUBLIC_` prefix | Key exposed in browser bundle; attacker has full DB access bypassing all RLS | `SUPABASE_SERVICE_ROLE_KEY` must never have `NEXT_PUBLIC_` prefix; verify with `grep -r NEXT_PUBLIC_ .env` |
| Third-party analytics SDK on child-facing pages | COPPA violation; potential FTC enforcement (fines up to $51,744 per violation as of 2024 rule) | No third-party tracking scripts on any page accessible after auth; self-host fonts and assets |
| Quest completion claiming not idempotent | Double-click or network retry fires `awardLoot()` twice, granting double gold | Store `quest_completion_id` with `claimed_at` timestamp; reject duplicate claims at DB level with unique constraint |
| Broad RLS SELECT policy (`true`) on `profiles` table | Any authenticated user can query all children's profiles and balances | RLS SELECT policy: `auth.uid() = id` only; admin reads go through service_role in Server Actions |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| PIN pad that looks like a standard HTML `<input type="number">` | 9-year-old doesn't understand it's a PIN; browser suggests saved passwords; form feels adult/corporate | Build a custom visual PIN pad component with large tap targets (min 64x64px), number-only buttons, and dot indicators — no browser autocomplete |
| Reward animation plays but feels weightless (no audio cue, no screen flash) | Reward moment doesn't land; child doesn't feel the win | Gold counter count-up + brief screen flash in agent accent color + (optional) haptic feedback on mobile; the visual animation alone is not enough for a 9-year-old |
| Magic link email is confusing to the parent | Parent doesn't trust the email, marks it spam, child can never set up | Plain-language subject: "Your child's Agenty login link"; body explains what it is and that the PIN comes after; single clear CTA button |
| Session expires mid-quest and child is silently redirected to login | Child loses quest progress and doesn't understand why they're suddenly on the login screen | Extend session duration to 7 days (Supabase `Auth > Settings > JWT expiry`); show a "Tap to re-enter your PIN" overlay rather than a hard redirect |
| Too many reward types displayed at once (gold, XP, energy, streak) | 9-year-old doesn't know what to focus on; all metrics feel equally meaningless | Lead with gold (primary reward); XP and energy are secondary; streak is ambient (fire icon in corner) — never show all four in equal visual weight |
| Quest completion shows nothing for 2+ seconds while Server Action runs | Child thinks nothing happened and taps again, triggering duplicate action | Show instant loading animation on quest completion button; disable button after first tap; play "pending" animation immediately; celebratory animation waits for server confirmation |

---

## "Looks Done But Isn't" Checklist

- [ ] **PIN auth:** Often missing rate limiting — verify a `pin_attempts` tracking mechanism exists in the Server Action handler, not just the UI
- [ ] **Magic link flow:** Often missing PKCE callback handler — verify `/auth/callback/route.ts` exchanges `?code=` param, not hash fragment
- [ ] **Profiles table:** Often missing on first login — verify magic link callback upserts into `profiles`; log in with a fresh incognito session and check Supabase dashboard
- [ ] **Daily reward button:** Often missing idempotency — verify clicking twice in rapid succession only grants gold once; check `loot_ledger` in Supabase after double-click test
- [ ] **Gold counter animation:** Often missing rollback — verify a forced Server Action failure (temporarily return an error) causes the displayed balance to revert, not freeze on the optimistic value
- [ ] **Framer Motion in App Router:** Often missing `'use client'` — verify no `motion.*` usage exists in any file without the directive; check build output for hydration warnings
- [ ] **RLS policies:** Often tested as superuser — verify policies work by running queries through the Supabase client SDK with a real user JWT, not from the SQL Editor
- [ ] **Third-party scripts:** Often added without audit — verify `layout.tsx` and `next.config.js` have no external script tags pointing to analytics, CDN fonts, or ad networks

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Profiles not created for existing auth users | MEDIUM | Write a one-time migration script: query `auth.users` for IDs with no corresponding `profiles` row; bulk upsert with default values; re-test auth flow |
| Gold granted multiple times (missing idempotency) | HIGH | Audit `loot_ledger` for duplicate `quest_id` + `profile_id` entries within the same day; manually reverse excess grants via admin Server Action; add idempotency constraint as hotfix |
| Service_role key exposed in client bundle | HIGH (immediate) | Rotate the key in Supabase dashboard immediately; redeploy; audit logs for any unauthorized access; add `grep` pre-commit hook to catch `NEXT_PUBLIC_SUPABASE_SERVICE` |
| Magic link never sets session (hash vs. PKCE issue) | MEDIUM | Switch Supabase project to PKCE flow; implement `/auth/callback/route.ts`; update redirect URLs in Supabase dashboard; test end-to-end in staging |
| Framer Motion hydration mismatch in production | LOW | Add `suppressHydrationWarning` to affected motion elements; ensure `initial` state matches server-rendered state; wrap in `useEffect` if needed |
| PIN brute force discovered | HIGH | Rotate all user PINs (force parent magic link re-setup); add rate limiting as emergency deploy; notify parent (email) to set a new PIN |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| PIN brute force (no rate limiting) | Auth phase — PIN implementation | Integration test: send 6+ wrong PINs in rapid succession; confirm 429 response and lockout |
| Profiles row not created on first login | Auth phase — magic link callback | Create fresh Supabase test user; complete magic link flow; confirm `profiles` row exists in dashboard |
| Magic link hash fragment lost in App Router | Auth phase — PKCE callback setup | Complete magic link flow in incognito; confirm session cookie is set; confirm redirect to Bridge dashboard |
| Economy actions exploitable (no idempotency) | Economy wiring phase — daily reward button | Double-click the reward button; check `loot_ledger` has only one row for that claim event |
| `awardLoot()` accepting client-supplied amount | Economy wiring phase — quest completion wiring | Inspect Server Action signature; confirm no `amount` param accepted from client |
| Framer Motion missing `'use client'` | Bridge dashboard phase — first animated component | Run `next build`; zero hydration errors; all motion components have directive |
| Gold counter no rollback on failure | Economy wiring phase — optimistic UI state | Force `awardLoot()` to throw; confirm displayed balance reverts; confirm no duplicate ledger row |
| Third-party SDK COPPA exposure | Auth phase (and every phase) | Audit `layout.tsx` for external scripts before phase ship; run browser devtools Network tab; filter for third-party origins |
| RLS policy tested as superuser only | Economy wiring phase — RLS audit | Re-run all Supabase queries through SDK with user JWT; confirm kid cannot read another kid's `profiles` row |
| Session expires mid-quest | Auth phase — session configuration | Set JWT expiry to 7 days in Supabase Auth settings; verify session persists across browser restarts |

---

## Sources

- [Supabase — Managing User Data (profiles table & triggers)](https://supabase.com/docs/guides/auth/managing-user-data)
- [Supabase — Use Auth with Next.js (PKCE flow, App Router)](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Supabase — Row Level Security docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Supabase — Understanding API Keys (anon vs service_role)](https://supabase.com/docs/guides/api/api-keys)
- [GitHub — on_auth_user_created trigger breaking signups (Discussion #6518)](https://github.com/orgs/supabase/discussions/6518)
- [GitHub — Next.js #49279: App Router + Framer Motion shared layout animations issue](https://github.com/vercel/next.js/issues/49279)
- [Motion docs — Layout Animations (FLIP)](https://motion.dev/docs/react-layout-animations)
- [Motion docs — AnimateNumber](https://motion.dev/docs/react-animate-number)
- [Framer Motion compatibility in Next.js 14 — `use client` workaround (Medium)](https://medium.com/@dolce-emmy/resolving-framer-motion-compatibility-in-next-js-14-the-use-client-workaround-1ec82e5a0c75)
- [Next.js — Server Actions and Mutations docs](https://nextjs.org/docs/13/app/building-your-application/data-fetching/server-actions-and-mutations)
- [FTC — COPPA Compliance FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [Federal Register — COPPA Rule 2025 amendments (effective June 23, 2025)](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)
- [COPPA Compliance 2025 — Practical Guide (Promise Legal)](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)
- [Supabase Security — Hidden Dangers of RLS (DEV Community)](https://dev.to/fabio_a26a4e58d4163919a53/supabase-security-the-hidden-dangers-of-rls-and-how-to-audit-your-api-29e9)
- [Usebasejump — OAuth and magic links with Supabase and Next.js middleware](https://usebasejump.com/blog/supabase-oauth-with-nextjs-middleware)
- [Security Boulevard — PIN Authentication security overview](https://securityboulevard.com/2025/05/what-is-pin-authentication-how-it-works-benefits-and-use-cases/)
- [Gamification in EdTech UX Design (Netbramha)](https://netbramha.com/blogs/gamification-in-edtech-ux-design/)

---
*Pitfalls research for: kid-friendly auth (PIN + magic link), gamified Bridge dashboard, Supabase economy wiring — Agenty*
*Researched: 2026-03-10*
