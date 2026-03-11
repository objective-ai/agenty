# Project Research Summary

**Project:** Agenty — Gamified Kids' Learning OS
**Domain:** Game-style educational dashboard with PIN auth, animated economy, and agent companion system
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

Agenty is a single-player gamified learning OS for a 9-year-old child, built on a locked Next.js 16 / React 19 / Supabase stack. The product's core mechanic is a reward loop: kid logs in via PIN, selects an AI agent companion, claims a daily reward, completes a demo quest, and watches their gold counter count up with game-feel animations. Research confirms the stack is largely in place — the only missing runtime packages are `motion` (for animations) and `react-pin-field` (for the PIN pad). The architecture pattern is Server Component data fetch → Client Context hydration → optimistic economy mutations via Server Actions, which avoids loading-state flicker that would break the game-UI aesthetic.

The primary risk is that this product is used by a minor, which creates two overlapping concerns: security (PIN brute-force, economy exploit surface, Supabase key exposure) and compliance (COPPA 2025 amendments). Both must be addressed in the first phase, not retrofitted. The economy already has the correct "Loot Guard" model per CLAUDE.md — Server Actions wrapping Supabase RPCs with service-role client, never exposed to the browser. The primary remaining gap is idempotency on reward claims and rate limiting on PIN verification. The recommended approach is to build auth correctly once, then wire economy features on top of a validated session foundation.

The feature set is deliberately constrained for v1: validate the full loop (login → agent selection → daily claim → demo quest → celebration) before adding any v1.x or v2+ features. Research from Prodigy, Duolingo, and child UX literature confirms this loop is sufficient to establish daily habit formation. Anti-features to avoid include social comparison, FOMO timers, and in-app purchases — all documented dark patterns for under-12 users.

---

## Key Findings

### Recommended Stack

The stack is effectively locked. Supabase clients (`client.ts`, `server.ts`, `admin.ts`), Tailwind v4, and Next.js 16 App Router are already configured. Two packages need to be added: `motion` (npm install motion, import from `motion/react` — canonical rebranding from framer-motion in 2024) and `react-pin-field` for the kid's PIN entry UI. Crucially, `framer-motion` as an import path causes hydration errors in React 19; use `motion/react` for all new code.

The auth architecture is a dual-flow design. Parent setup uses Supabase magic link with PKCE flow, handled entirely server-side at `/auth/callback/route.ts`. Daily kid login uses `signInWithPassword` with the parent email as account identity and a 6-digit PIN as the password — 6 digits satisfies Supabase's 6-character minimum without any padding hacks, and is equally easy for a 9-year-old.

**Core technologies:**
- `Next.js 16 (App Router)`: Framework — already configured, Server Components for data fetch, Route Handlers for auth callback
- `Supabase + @supabase/ssr ^0.9.0`: Auth + database — both browser and server clients exist, RPCs `award_loot()` and `spend_energy()` are complete
- `motion ^12.35.x` (NEW): All reward animations, number counters, page transitions — `motion/react` import path required for React 19
- `react-pin-field ^3.x` (NEW): Accessible, React 19-compatible 4-6 digit PIN pad — headless, styled with Tailwind

**Critical version constraint:** All motion components must carry `"use client"` directive. Create `src/components/motion-wrappers.tsx` as a single shared re-export to avoid scattering the directive across every leaf component.

### Expected Features

The research draws a sharp line between what a 9-year-old expects from any game-like app (table stakes), what makes Agenty distinctive, and what would harm or bloat the product.

**Must have (table stakes) — v1:**
- PIN auth (6-digit) + magic link parent setup — kids cannot manage passwords
- Visible gold balance with animated count-up — static numbers feel dead to game-literate kids
- XP bar with level progress — RPG literacy is near-universal at age 9
- Daily streak indicator — flame icon + day count; 2.3x retention impact after 7-day streak
- Quest cards with name, energy cost, reward preview, and host agent
- Agent companion visible on the main screen with distinct color identity
- Animated reward feedback (celebration screen + gold counter) on quest completion
- Daily reward claim button — one-tap, disabled after claim, resets midnight
- Energy system display in HUD
- Quest completion celebration screen with agent branding

**Should have (competitive differentiators):**
- Agent selection as primary landing ritual — 4 agents (Cooper/Arlo/Minh/Maya), each with neon accent color
- Agent-tinted UI via `[data-agent]` CSS selectors — entire dashboard personality shifts per agent
- AAA game feel: Adventure Navy (#050B14), chunky 2px borders, neon glows — not SaaS aesthetic
- Loot narrative framing ("Quest Complete — Coach Cooper awards you 50 Gold")
- Dual-loop economy: daily claim (small, always available) + quest reward (larger, effort-required)
- Animated gold counter with slot-machine digit-flip effect (~800ms count-up)

**Defer (v2+):**
- Real curriculum quests (math, reading) — requires content design, not just UI
- Adaptive difficulty AI — premature without real quest library
- Parent dashboard — monitoring, energy limits, quest assignment
- Loot shop / cosmetic unlocks
- Achievement badge system

**Avoid entirely (anti-features):**
- Leaderboards — social humiliation risk for a single-user product
- FOMO countdown timers — documented anxiety-inducing dark pattern for under-12s
- In-app purchases — ethically inappropriate, requires IAP infrastructure
- Social feed / activity sharing — COPPA PII risk, enormous scope for zero validated need

### Architecture Approach

The architecture uses three clearly separated layers: a server layer (middleware session check, Server Component layout fetch, Server Action economy mutations), a client layer (Context providers initialized from server data, Framer Motion animated components), and the Supabase data layer (profiles, loot_ledger, energy_logs tables + award_loot/spend_energy RPCs). The key pattern is fetch once in the dashboard layout Server Component, hydrate `EconomyContext` and `AgentContext`, then let all client components read from context synchronously — eliminating the loading-state waterfall that makes dashboards feel like SaaS rather than games.

**Major components:**
1. `middleware.ts` — session refresh and auth redirect gate (Edge runtime); calls `getClaims()`, not deprecated `getSession()`
2. `(auth)/login/page.tsx` + `PinPad.tsx` — full-screen client component, PIN entry via `react-pin-field`, calls Server Action on complete
3. `(auth)/auth/callback/route.ts` — PKCE code exchange, session cookie write, profiles upsert fallback
4. `(dashboard)/layout.tsx` — Server Component; fetches profile once, wraps `EconomyProvider` + `AgentProvider`
5. `EconomyContext.tsx` (NEW) — client-side cache of {gold, xp, energy}; initialized from server, mutated optimistically on Server Action response
6. `AnimatedNumber.tsx` (NEW) — dumb display component using `motion/react` `animate()`; no Supabase knowledge; accepts `value` prop, counts up on change
7. `DailyRewardButton.tsx` — calls `awardLoot()` via `useTransition`; optimistic update → confirmed sync → rollback on failure
8. `QuestCard.tsx` — wires `spendEnergy()` on start, `awardLoot(50)` on complete; triggers celebration overlay

**Build order is strictly sequential** (each step unblocks the next): middleware → auth pages → auth callback → EconomyContext → dashboard layout → AnimatedNumber → StatsBar wire-up → DailyRewardButton → QuestCard → sidebar components.

### Critical Pitfalls

1. **PIN with no brute-force protection** — A 6-digit PIN is brute-forceable in seconds without server throttling. Implement 5-attempt-per-15-minute lockout in the PIN Server Action on day one. Lockout recovery requires parent magic link. Do not skip for MVP.

2. **Profiles row not created on first magic-link login** — DB triggers can fail silently (RLS block, bug, migration miss). Always `upsert` into `profiles` in the `/auth/callback` Server Action as a fallback — never rely on a trigger alone. Missing profile row causes silent failures across all economy actions.

3. **Magic link hash fragment lost in App Router** — Next.js App Router route handlers run server-side and never receive URL hash fragments. Use PKCE flow (Supabase default for server-side) and exchange the `?code=` query parameter in `/auth/callback/route.ts`. Legacy tutorials use implicit flow — ignore them.

4. **Economy actions exploitable without idempotency** — `awardLoot()` must reject duplicate claims. Store a `quest_completion_id` with `claimed_at`; reject at DB level with a unique constraint. Never accept `amount` as a client-supplied parameter — look it up server-side from the quest definition. The daily reward button must be disabled after first claim per session.

5. **Gold counter animation without rollback** — Optimistic UI is correct for responsiveness, but if the Server Action fails, the displayed balance must revert to the last confirmed value. Use `useOptimistic` or explicit `prevGold` rollback in the click handler. Always `revalidatePath` on Server Action success so Next.js syncs the canonical value.

6. **Framer Motion missing `"use client"` in App Router** — All `motion.*` usage crashes with hydration errors in Server Components. Establish the `motion-wrappers.tsx` shared re-export before building any animated component. Run `next build` after each phase and verify zero hydration warnings.

7. **COPPA 2025 compliance** — No third-party analytics, Google Fonts CDN, ad networks, or tracking SDKs on any child-facing page. Self-host all fonts. COPPA 2025 amendments (effective June 23, 2025) carry fines up to $51,744 per violation. Audit `layout.tsx` before each phase ships.

---

## Implications for Roadmap

Based on research, the dependency graph is clear: auth must exist before any economy feature, the dashboard layout must establish contexts before any wired component, and animated primitives must exist before reward flows. The suggested phase structure follows this dependency order strictly.

### Phase 1: Auth Foundation

**Rationale:** Every dashboard and economy feature depends on a valid Supabase session and a `profiles` row. This must be airtight before anything else is built. Security mistakes here (PIN brute force, missing PKCE, profile creation gaps) are the most expensive to retrofit.

**Delivers:** Working PIN login for the kid, magic link setup for the parent, session middleware, and a guaranteed `profiles` row on first login.

**Addresses features:**
- PIN auth (6-digit) + magic link parent setup
- Profile creation on first login

**Must avoid:**
- Pitfall 3 (PKCE hash fragment) — implement `/auth/callback/route.ts` with `exchangeCodeForSession(?code=)` before testing
- Pitfall 2 (missing profiles row) — `upsert` into `profiles` in the callback handler, not just a DB trigger
- Pitfall 1 (PIN brute force) — 5-attempt lockout in PIN Server Action, not a client-side guard
- Pitfall 7 (COPPA) — audit `layout.tsx` for third-party scripts; self-host fonts

**Research flag:** Standard patterns — Supabase PKCE + Next.js App Router is well-documented in official docs.

---

### Phase 2: Dashboard Shell + Economy Context

**Rationale:** Once auth exists, establish the dashboard layout, contexts, and data flow before wiring any individual feature. This is the architectural foundation that all subsequent features read from. Build it wrong here (client-side fetches per component, providers in root layout) and every subsequent phase inherits the mistake.

**Delivers:** The Bridge dashboard renders with real gold/XP/energy from Supabase, AgentContext sets the neon theme, and `AnimatedNumber` is ready as a shared primitive.

**Addresses features:**
- The Bridge dashboard shell with agent selection and agent-tinted UI
- Live economy stats pulled from Supabase (not hardcoded)
- Adventure Navy dark theme with agent neon glows
- `AnimatedNumber` primitive for all subsequent reward animations

**Uses from stack:**
- `(dashboard)/layout.tsx` as Server Component data fetch
- `EconomyContext.tsx` — new, client-side cache
- `AgentContext.tsx` — existing, wire `data-agent` attribute
- `motion/react` `AnimatedNumber` — new shared primitive

**Must avoid:**
- Anti-pattern: Fetching economy data in client `useEffect` (waterfall loading states)
- Anti-pattern: Providers in root layout (breaks auth pages)
- Anti-pattern: `motion.*` without `"use client"` (hydration crash)

**Research flag:** Well-documented patterns — Server Component → Context hydration is the official Next.js recommended pattern.

---

### Phase 3: Economy Wiring — Daily Reward + Quest Loop

**Rationale:** With the dashboard shell and contexts in place, wire the actual reward loop. This is the v1 core: daily reward claim → animated gold count-up → demo quest → energy spend → quest completion celebration. This phase validates whether the product is fun and generates daily habit data.

**Delivers:** The full playable loop — kid logs in, claims daily gold (animated count-up), completes the Coach Cooper demo quest, watches the celebration screen, sees their gold increase confirmed by Supabase.

**Addresses features:**
- Daily reward claim button wired to `awardLoot()` — disabled after claim
- Quest card for "Daily Check-in" hosted by Coach Cooper
- Energy spend on quest start wired to `spendEnergy()`
- Quest completion triggers `awardLoot()` for 50 Gold
- Quest completion celebration screen with Cooper agent branding
- Framer Motion animations (quest completion, loot award, UI transitions)
- Streak counter display (read-only)

**Must avoid:**
- Pitfall 4 (economy exploit) — idempotency keys on daily reward and quest completion; `amount` from server only
- Pitfall 6 (gold counter no rollback) — `prevGold` rollback on Server Action failure; `revalidatePath` on success
- Anti-pattern: Client-side Supabase RPC calls — all economy actions go through `actions/economy.ts` Server Actions only
- Performance trap: Animating `width`/`height` — use `transform`, `scale`, `opacity` only; use `layout` prop for size changes

**Research flag:** Needs care on idempotency implementation — verify `loot_ledger` has unique constraint on `(profile_id, event_id)` before wiring the daily reward button.

---

### Phase 4: Polish + Sidebar Accuracy

**Rationale:** Wire the remaining sidebar components (XP progress, streak counter, recent loot log) to real Supabase data, and add the remaining Framer Motion polish to make the UI feel AAA. This is a low-risk phase with no new security surface.

**Delivers:** Fully accurate sidebar — XP bar fills animatedly, streak shows real count, recent loot log reads from `loot_ledger`. All animations match Adventure Navy aesthetic.

**Addresses features (v1):**
- XP bar fill animation on level progress
- Streak counter accurate display
- Recent loot log from `loot_ledger` table

**Addresses features (v1.x — if time permits):**
- Streak increment server logic
- XP level-up celebration overlay
- Energy replenishment timer display

**Must avoid:**
- Performance trap: Multiple simultaneous Framer Motion `layout` animations — stagger with `transition.delay`
- Performance trap: Inline `variants` objects — define at module level as constants

**Research flag:** Standard patterns — reading from existing Supabase tables with Server Component fetch.

---

### Phase Ordering Rationale

- Auth before everything: No economy feature can run without a valid session and a `profiles` row. The dependency graph in FEATURES.md confirms this explicitly.
- Context before components: The EconomyContext must be initialized before any component reads gold/xp/energy. Building components first with hardcoded data creates a tech debt migration step.
- Economy primitives before economy wiring: `AnimatedNumber` must exist before `DailyRewardButton` and `QuestCard` are built, or animations get hacked in-line and diverge.
- Reward loop validation before v1.x: Streak increment logic, energy timers, and XP level-up celebrations add no validated value until the core loop is confirmed working with a real child user.

### Research Flags

Phases needing deeper research during planning:
- **Phase 3 (Economy Wiring):** Verify exact `loot_ledger` schema for idempotency (unique constraint columns). Verify `awardLoot()` Server Action signature does not accept client-supplied `amount`. If it does, this must be fixed before the daily reward button is wired.

Phases with well-documented standard patterns (skip additional research):
- **Phase 1 (Auth):** Supabase PKCE + Next.js App Router is fully documented in official Supabase SSR guides.
- **Phase 2 (Dashboard Shell):** Server Component → Context hydration is the official Next.js recommended pattern with code examples in the docs.
- **Phase 4 (Polish):** Reading from existing Supabase tables is straightforward with existing client setup.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Stack is locked; only two new packages needed (`motion`, `react-pin-field`). Official docs confirm compatibility with React 19 / Next.js 16. |
| Features | HIGH | Core gamification patterns (dual-loop economy, streak, animated rewards) are well-supported by Duolingo/Prodigy precedent and child UX research. Age-specific UX specifics are MEDIUM — validated against multiple sources but not A/B tested. |
| Architecture | HIGH | Stack is fixed and official patterns are verified. Existing `AgentContext`, `actions/economy.ts`, and Supabase clients remove most uncertainty. EconomyContext is new but follows standard React Context + Server Component initialization pattern. |
| Pitfalls | HIGH | Auth/security pitfalls verified against official Supabase and COPPA docs. Animation gotchas MEDIUM — community-confirmed but fewer official sources. |

**Overall confidence:** HIGH

### Gaps to Address

- **`loot_ledger` idempotency schema:** Research confirms idempotency is required but did not verify whether the existing `loot_ledger` table has the unique constraint on `(profile_id, event_id)` already. Inspect the Supabase schema before Phase 3 begins.
- **`awardLoot()` Server Action signature:** Must verify the existing Server Action does not accept `amount` as a client-supplied parameter. If it does, the signature must be fixed to look up reward amounts from a server-side quest definition table before Phase 3.
- **PIN attempt rate limiting implementation detail:** Research identifies the requirement (5 attempts / 15 minutes) but does not specify whether to use a Supabase `pin_attempts` table or an edge middleware approach (e.g., Upstash Redis). The Supabase table approach requires no additional infrastructure; Upstash is faster but adds a dependency. Decide at Phase 1 planning.
- **Streak increment logic timing:** The streak display is v1; increment is v1.x. Clarify whether "daily login" means first PIN login per calendar day (UTC? local timezone?) to avoid off-by-one bugs when implementing.
- **Session duration:** Research recommends JWT expiry of 7 days (set in Supabase Auth Settings). Verify this is configured before Phase 1 ships; session expiry mid-quest is a confirmed UX failure mode.

---

## Sources

### Primary (HIGH confidence)
- Supabase Auth SSR + Next.js official guide — PKCE flow, middleware pattern, `@supabase/ssr`
- Supabase email OTP and magic link official docs — flow design
- Next.js official docs — Route Groups, Server Actions, Server Components
- React 19 official docs — `useOptimistic`, `useTransition`, `useActionState`
- Motion (motion.dev) npm registry — version 12.35.2, React 19 compatibility confirmed
- FTC COPPA compliance FAQ and Federal Register 2025 COPPA amendments

### Secondary (MEDIUM confidence)
- BuildUI animated counter recipe (buildui.com) — slot-machine digit-flip pattern using `useSpring` + `useTransform`
- GitHub vercel/next.js discussions — Tailwind v4 + Next.js 15/16, Framer Motion `use client` workaround
- Supabase community discussions — 6-character minimum password length on managed platform
- Motion + Next.js `"use client"` wrapper pattern (hemantasundaray.com)
- react-pin-field React 19 support — GitHub repo confirmed

### Tertiary (LOW confidence)
- Age-specific streak retention data (2.3x after 7-day streak) — cited via Plotline/Trophy.so, not primary research
- Competitor feature analysis (Prodigy, Duolingo) — based on public documentation and product observation, not internal data

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
