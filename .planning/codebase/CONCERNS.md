# Codebase Concerns

**Analysis Date:** 2026-03-10

## Tech Debt

**Hardcoded Mock Data Throughout UI Components:**
- Issue: All player statistics, quest data, and loot history are hardcoded strings/arrays with no connection to database
- Files:
  - `src/app/page.tsx` (QUESTS array with 6 mock quests)
  - `src/components/StatsBar.tsx` (hardcoded "2,450" gold, "85 min" energy, "Lv. 12")
  - `src/components/XPProgress.tsx` (hardcoded 3420/5000 XP, level 12, "Apprentice Explorer")
  - `src/components/RecentLoot.tsx` (RECENT_LOOT array with 4 mock transactions)
  - `src/components/DailyStreak.tsx` (STREAK array, hardcoded "Friday" as today)
  - `src/app/page.tsx` (hardcoded "Explorer Duy" player name, "Rank #42 Global")
- Impact: UI will not reflect actual player progress. Manual quest updates required. All reward/energy tracking broken until database integration complete.
- Fix approach:
  1. Create React hooks to fetch profile, quests, loot_ledger from Supabase using client.ts
  2. Replace mock QUESTS array with `useQuests()` hook
  3. Replace hardcoded stats in StatsBar with `useProfile()` hook
  4. Wrap components in Suspense boundaries with error states
  5. Add real-time subscription hooks to energy_logs and loot_ledger using `onAuthStateChange`

**No Server Actions Implemented:**
- Issue: PLAN.md specifies `awardLoot()` and `spendEnergy()` Server Actions as critical for security ("Loot Guard"), but none exist
- Files: `src/lib/supabase/` (missing actions)
- Impact: No ability to safely award gold, spend energy, or track transactions. Quest completion will not persist. Security model breaks without server-side validation.
- Fix approach:
  1. Create `src/lib/supabase/actions.ts` with `awardLoot()`, `spendEnergy()`, `claimQuest()` using service_role key
  2. Each action must validate auth.uid() against profile_id before mutating
  3. Wrap actions with try/catch returning typed Result<T, E>
  4. Add audit logging to metadata column in loot_ledger

**Incomplete Auth Scaffolding:**
- Issue: PLAN.md Task 4 "Auth Scaffold" is marked incomplete. No auth middleware, no protected routes, no session management
- Files: `src/app/layout.tsx` (no AuthProvider), missing middleware.ts, no auth context
- Impact: Entire app is unprotected. No way to identify current user. Server Actions will fail without auth.uid(). Login/logout flow missing.
- Fix approach:
  1. Create `src/middleware.ts` to check session and redirect unauthenticated to login
  2. Create `src/app/auth/` for login, signup, callback routes using Supabase Auth
  3. Add AuthProvider wrapper in layout.tsx using `@supabase/ssr` hooks
  4. Implement magic link or OAuth flow per PLAN.md spec

**Missing Energy System Implementation:**
- Issue: Energy displays as UI statistic but has no mechanics. No deduction on activity, no recovery schedule, no refill shop
- Files: `src/components/StatsBar.tsx` (shows "85 min" static), database has `energy_logs` table but no logic
- Impact: Energy currency is cosmetic. Cannot enforce screen-time limits. Daily/weekly quotas unenforceable.
- Fix approach:
  1. Create `useEnergy()` hook to subscribe to energy_logs for current session
  2. Add energy spend on quest start via `spendEnergy(profile_id, activity, cost)`
  3. Create daily reset cron job (Supabase Edge Function) to reset energy to 100 at midnight
  4. Add energy recovery mechanic (e.g., +10 per hour offline, max 200)

**Agent Context Uses Document Attribute Instead of Proper State Sync:**
- Issue: AgentContext sets `data-agent` attribute on document.documentElement during render, no hydration guards
- Files: `src/contexts/AgentContext.tsx` lines 59, 63-65
- Impact: Potential hydration mismatch on Next.js during SSR. Race condition where initial render may not match hydrated client. Agent colors may flicker.
- Fix approach:
  1. Use `useEffect` with dependency array instead of top-level conditional
  2. Add `suppressHydrationWarning` to html tag in layout
  3. Consider server-side agent preference from profile or cookie

**AgentContext ColorMap Duplicated in Components:**
- Issue: Agent color hex values (blue, orange, green, purple) defined in multiple places
- Files:
  - `src/contexts/AgentContext.tsx` (AGENTS object, no colors)
  - `src/components/AgentSelector.tsx` (AGENT_COLORS Record)
  - `src/app/globals.css` (inline color definitions for [data-agent] selectors)
  - Mission from CLAUDE.md specifies agent colors (Cooper: Blue, Arlo: Orange, Minh: Green, Maya: Violet)
- Impact: Colors may drift if updated in one place but not others. Single source of truth missing. Makes agent-specific theming fragile.
- Fix approach:
  1. Create `src/lib/agents.ts` with centralised AGENT_THEME Record including colors
  2. Export from there for use in CSS custom properties
  3. Update AgentContext to import from centralised theme

**No Loading/Error States in Components:**
- Issue: All components render static UI with no fallbacks for missing data, loading states, or error handling
- Files: All components in `src/components/` and `src/app/page.tsx`
- Impact: If Supabase query fails or is slow, users see stale/mock data indefinitely. No indication of data freshness. No retry mechanism.
- Fix approach:
  1. Add `<Suspense>` boundaries around data-dependent components
  2. Create loading skeletons for QuestCard, StatsBar, RecentLoot
  3. Add error boundary component with retry button
  4. Use React's `use()` hook for promise unwrapping with error propagation

## Security Considerations

**Client-Side Data Displayed Without Server Validation:**
- Risk: UI components read from Supabase client directly, no server-side filtering. If RLS policies fail, client could receive other players' data.
- Files: All data fetching will happen via `createClient()` from `src/lib/supabase/client.ts` (currently not used)
- Current mitigation: RLS policies exist in database schema (players can only SELECT own rows)
- Recommendations:
  1. Never trust client-side checks. Always re-validate auth.uid() in Server Actions before mutation
  2. Use server-side `createClient()` from server.ts (service_role key) for sensitive operations
  3. Audit all SELECT queries to ensure WHERE clause filters by auth.uid()
  4. Add request signing for any external API calls (LangGraph, future LLM integrations)

**Environment Variables Configuration:**
- Risk: `.env.local` file exists (detected) but contents not reviewed for exposure
- Current mitigation: `.env*` in .gitignore, Supabase keys are NEXT_PUBLIC_ (safe for public)
- Recommendations:
  1. Document required env vars in README or .env.example
  2. Validate all env vars exist at app startup
  3. Consider encrypting sensitive config (future: OpenAI key, parent payment API)

**No Rate Limiting on Planned Server Actions:**
- Risk: Once `awardLoot()`, `spendEnergy()` are implemented, malicious client could spam requests
- Impact: Gold inflation, energy bypass, XP farming
- Fix approach:
  1. Implement Supabase Rate Limiting Extension or custom middleware
  2. Add transaction-level conflict detection (e.g., two simultaneous awardLoot calls)
  3. Create activity logs with timestamps to detect suspicious patterns

## Performance Bottlenecks

**Agent Color Conversion Happening in Component Render:**
- Problem: `hexToRgb()` function called on every AgentSelector render to convert hex to RGB for CSS
- Files: `src/components/AgentSelector.tsx` lines 71-74
- Cause: No memoization, repeated string manipulation during every click
- Improvement path:
  1. Pre-compute RGB values in centralised theme object
  2. Export as `--agent-accent-rgb: 245, 197, 66;` CSS variables (already done in globals.css for agent tints, but not for AgentSelector logic)
  3. Use CSS variables instead of runtime conversion

**No Image Optimization:**
- Problem: avatar_url field in profiles table but no Image component usage detected
- Files: `src/app/page.tsx` (avatar "D" fallback, no image)
- Impact: If images added later without Next.js Image component, could load unoptimized large files
- Improvement path: Use `<Image>` component when avatar_url is implemented

**Quest Grid Re-renders on Every Page Load:**
- Problem: QUESTS array recreated inline in page.tsx (not memoized), 6 QuestCard children render
- Files: `src/app/page.tsx` lines 11-90
- Cause: No useMemo, no key stability
- Improvement path:
  1. Move QUESTS to module-level constant
  2. Add unique stable keys to quest cards (already using quest.id)
  3. Consider virtualisation if quest list grows > 20 items

## Fragile Areas

**Streak Display Logic Assumes Today is Friday:**
- Files: `src/components/DailyStreak.tsx` line 23: `const isToday = i === 4; // Friday`
- Why fragile: Hardcoded day index. If code runs on different day, display breaks. Comment indicates awareness but no fix.
- Safe modification: Fetch today's date from server/props, calculate index dynamically
- Test coverage: No tests detected for this component

**Magic Number: Energy Cap at 200:**
- Files: Database schema `src/database/migrations/20260310000000_create_core_tables.sql` line 20: `check (energy >= 0 and energy <= 200)`
- Why fragile: If game design changes energy cap, both DB and `XPProgress` component must update
- Safe modification: Define energy constants in `src/lib/constants.ts`, use in both migrations and components
- Test coverage: No tests for energy validation

**Agent Emoji Sync Missing:**
- Problem: Emoji displayed in AgentSelector comes from AGENTS context, but in page.tsx QUESTS has hardcoded agent names + separate agentEmoji fields
- Files:
  - `src/contexts/AgentContext.tsx` (AGENTS.cooper.emoji = "🧠")
  - `src/app/page.tsx` (quest 1 agentEmoji = "🧠", agent = "Coach Cooper")
- Why fragile: If agent name changes in context, hardcoded string in QUESTS breaks relationship
- Safe modification: Reference agent from AGENTS directly in QUESTS, derive emoji from agent
- Test coverage: No validation that agentEmoji matches AGENTS[agent].emoji

**Hardcoded Player Name and Rank:**
- Files: `src/app/page.tsx` lines 150-157 ("Explorer Duy", "Rank #42 Global")
- Why fragile: No source of truth. Will break when real player data arrives from database
- Safe modification: Fetch from profiles table, display profile.display_name and computed rank
- Test coverage: None

## Missing Critical Features

**No Quest Progression Mechanic:**
- Problem: QuestCard shows progress: 65 for "Fraction Fortress" but clicking buttons does nothing
- Blocks: Cannot start quests, cannot save progress, cannot submit completions
- Required before: Real gameplay loop, earning rewards, leveling up

**No Multiplayer / Social Features:**
- Problem: CLAUDE.md mentions "gamified learning" but no mentions of leaderboards, friends, shared quests
- Blocks: Cannot implement "Rank #42 Global" display properly, no cooperative/competitive mechanics
- Mentioned in data: loot_ledger has no friend_id or social metadata

**No Shop / Currency Exchange:**
- Problem: Players earn Gold but nowhere to spend it. No cosmetics, energy refills, quest unlocks via gold
- Blocks: Gold currency feels meaningless to players
- Required for: Retention, monetization path, secondary reward loop

**No Achievement / Badge System:**
- Problem: RecentLoot shows "Speed Demon" badge but nowhere in code defines badges or triggers
- Blocks: Cannot reward rare achievements, no collection/bragging rights
- Metadata support: loot_ledger.metadata can store badge data

**No Settings / Preferences Screen:**
- Problem: No way to change display_name, avatar, agent preference persistence
- Blocks: Players stuck with "Adventurer" placeholder, agent choice not saved across sessions
- Required for: Onboarding completion, profile customization

## Test Coverage Gaps

**No Tests Detected Anywhere:**
- What's not tested: Zero test files found (no .test.ts/.test.tsx/.spec.ts)
- Files: Entire `src/` directory
- Risk:
  - Agent color conversions unvalidated
  - XP progress calculations never tested (milestone logic at 25/50/75/100%)
  - RLS policies never verified
  - Server Actions (when implemented) have no happy/sad path tests
  - Auth flow never tested
- Priority: High — Critical for "Loot Guard" security before any real transactions

**Database Migration Not Tested:**
- Risk: Triggers `handle_updated_at()` and `handle_new_user()` never executed in test
- Files: `supabase/migrations/20260310000000_create_core_tables.sql`
- Impact: Profile auto-creation on signup could silently fail in production

**Component Integration Tests Missing:**
- Risk: AgentSelector sets data-agent attribute, no test verifies CSS variables update correctly
- Files: `src/components/AgentSelector.tsx`, `src/app/globals.css`
- Impact: Agent theming could break on CSS updates

---

*Concerns audit: 2026-03-10*
