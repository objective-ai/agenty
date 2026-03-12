# Architecture

**Analysis Date:** 2026-03-10 (updated 2026-03-12)

## Pattern Overview

**Overall:** Next.js 15 App Router with Context-based state management and a monolithic client-server boundary.

**Key Characteristics:**
- Client-side component tree with Server Actions for auth and economy mutations
- Supabase for authentication (magic-link + PIN), data persistence, and vector search
- AI SDK v6 + Anthropic Claude for streaming chat with agent personas
- OpenAI embeddings + pgvector for RAG (PDF upload → chunk → embed → retrieve)
- Mission Mode: structured learning with MissionRegistry, missionReducer, and tool-based stat updates
- Agent-based theme switching system using context and CSS custom properties
- Game mechanics modeled in data (profiles, loot ledger, energy logs)
- Gamified UI with "Adventure Navy" aesthetic and agent-specific color overlays

## Layers

**Presentation Layer:**
- Purpose: Render quest cards, stats, progress bars, and game UI
- Location: `src/components/` and `src/app/page.tsx`
- Contains: React components (AgentSelector, QuestCard, StatsBar, XPProgress, DailyStreak, RecentLoot)
- Depends on: AgentContext for active agent selection, CSS custom properties for theming
- Used by: Root layout and page component

**State Management Layer:**
- Purpose: Manage active agent selection and propagate agent-specific theme colors
- Location: `src/contexts/AgentContext.tsx`
- Contains: React Context provider, agent definitions (Cooper/Arlo/Minh/Maya), useAgent hook
- Depends on: React Context API, document attribute manipulation for theme switching
- Used by: All components that need agent awareness (AgentSelector, QuestCard, XPProgress, etc.)

**Styling Layer:**
- Purpose: Define design tokens, theme variables, and agent color schemes
- Location: `src/app/globals.css`
- Contains: CSS custom properties (--bg-*, --ink-*, --gold, --agent-accent, etc.), loot-card class system, Tailwind v4 theme integration
- Depends on: Tailwind CSS v4 for theme inline syntax
- Used by: All components via Tailwind classes and inline style props

**AI Layer (Phase 2.5):**
- Purpose: Streaming AI chat with agent personas, RAG knowledge retrieval, Mission Mode tools
- Location: `src/app/api/chat/route.ts`, `src/lib/agents/prompts.ts`, `src/lib/knowledge/retrieve.ts`
- Contains: Chat streaming route (AI SDK v6 + Anthropic), agent system prompts, knowledge retrieval via pgvector
- Tools: `updateStat` (Mission Mode) — updates briefing board stat gauges when student answers correctly
- Depends on: `ai` (AI SDK v6), `@ai-sdk/anthropic`, `openai` (embeddings only), Supabase vector search
- Used by: CommsPanel (client-side chat UI), MissionModeShell (tool interception)

**Mission Layer (Phase 2.5–2.6):**
- Purpose: Structured learning missions with real-time stat tracking and SVG blueprint visualization
- Location: `src/lib/missions/`, `src/components/MissionBriefingBoard.tsx`, `src/components/MissionModeShell.tsx`
- Contains: MissionRegistry (static + DB-backed), missionReducer (state machine: ghost → active → complete), BlueprintDiagram (SVG inlining), StatGauge, ObjectiveCard
- Static missions: Dragon Bridge, Mars Rover, Pyramid Architect, Solar ISS
- DB missions: Resolved via `resolveMission()` which checks Supabase `missions` table first, falls back to static registry
- Pattern: Board activates client-side on mount via `dispatch(MISSION_INIT)`. AI only calls `updateStat` for data updates.
- Depends on: React useReducer, CommsPanel for AI chat, mission config files
- Used by: `/bridge/lab` page

**Command Deck Layer (Phase 2.6):**
- Purpose: Parent-facing mission factory — generate, validate, preview, and save AI-powered missions
- Location: `src/components/CommandDeckShell.tsx`, `src/app/bridge/command-deck/page.tsx`, `src/app/api/generate-mission/route.ts`
- Contains: CommandDeckShell (orchestrator: list → form → generating → preview), MissionGeneratorForm, MissionList, MissionPreview
- Pipeline: Parent selects template + topic → `/api/generate-mission` calls Claude Sonnet 4 via `generateObject` → 11-rule validator checks output → parent previews → `saveMission()` persists to `missions` table
- Templates: 4 SVG manifests in `src/lib/missions/templates.ts` with zone metadata for LLM guidance
- Validation: `src/lib/missions/validator.ts` — zone coverage, grade constraints, unique values, reward bounds, slug format, etc.
- Depends on: `@ai-sdk/anthropic`, `ai` (generateObject), `zod`, Supabase admin client
- Used by: `/bridge/command-deck` page

**Server Actions Layer:**
- Purpose: Secure server-side mutations for auth, economy, intel, mission CRUD, and agent selection
- Location: `src/lib/actions/auth.ts`, `src/lib/actions/economy.ts`, `src/lib/actions/intel.ts`, `src/lib/actions/missions.ts`, `src/lib/actions/agent.ts`
- Contains:
  - Auth: `sendMagicLink`, `setupChildAccount`, `loginWithPin`, `logOut`
  - Economy (Loot Guard): `awardLoot(amount, source, questId?)`, `spendEnergy(energyCost, activity, metadata?)` — amounts are server-determined, client cannot supply
  - Intel: `uploadIntel` (PDF → chunk → embed → store), `listIntelFiles`, `deleteIntelFile`
  - Missions: `saveMission`, `updateMissionStatus`, `deleteMission`, `getMyMissions`
  - Agent: `saveAgentSelection(agentId)`
- Depends on: Supabase server client, Supabase admin client (service role)
- Used by: Auth pages, IntelDrawer, economy components, CommandDeckShell, MissionCompleteOverlay

**Data Layer:**
- Purpose: Provide Supabase client connections for authentication and data querying
- Location: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`
- Contains: Browser client, server cookie-based client, admin service-role client
- Depends on: @supabase/ssr, @supabase/supabase-js, Next.js cookies API
- Used by: Server Actions, API routes, server components

**Framework Layer:**
- Purpose: Set up Next.js App Router and metadata
- Location: `src/app/layout.tsx`
- Contains: Root HTML structure, font imports, global metadata
- Depends on: Next.js 15, Google Fonts (Geist)
- Used by: All pages

## Data Flow

**Agent Selection Flow:**

1. User clicks agent button in AgentSelector
2. `setActiveAgent` callback updates context state and sets `data-agent` attribute on document root
3. CSS selectors `[data-agent="cooper"]` etc. override `--agent-accent-rgb` and related custom properties
4. All components using `var(--agent-accent)` automatically re-render with new color
5. State persists within browser session (not persisted to database)

**Quest Display Flow:**

1. Root page.tsx defines static `QUESTS` array with hardcoded quest data
2. QuestCard components render individual quests with status-dependent UI
3. Progress bars, difficulty badges, and action buttons change based on quest.status
4. Card styling applies loot-card class which uses agent-accent color for borders and shadows

**Game Stats Display:**

1. StatsBar, XPProgress, DailyStreak, and RecentLoot display hardcoded player state (Phase 3 will wire to Supabase)
2. Data flows down as props (no context or state management for these values)
3. Components calculate derived values locally (e.g., XP percentage = currentXP / nextLevelXP)
4. All use agent-accent color for visual emphasis

**Mission Generation Flow (Phase 2.6):**

1. Parent navigates to `/bridge/command-deck` → server component fetches `getMyMissions()` + `TEMPLATE_MANIFESTS`
2. Parent fills MissionGeneratorForm (topic, skill, grade, template) → CommandDeckShell calls `/api/generate-mission`
3. API route calls `generateObject` with Claude Sonnet 4 + Zod schema → LLM returns structured mission config
4. `validateMission()` runs 11 deterministic checks (zone coverage, grade constraints, reward bounds, etc.)
5. On validation failure, retries once with error feedback injected into prompt
6. Parent previews via MissionPreview (blueprint, stats, rewards) → approves or regenerates
7. `saveMission()` server action persists to `missions` table with RLS ownership

**Economy Flow (Phase 2.7):**

1. Mission completion → MissionCompleteOverlay renders with XP/Gold rewards
2. Player clicks "Collect Rewards" → calls `awardLoot(amount, source)` server action
3. Server validates auth, calls `award_loot` RPC via supabaseAdmin → updates loot_ledger
4. DailyClaim calls `awardLoot(25, "daily_bonus")` with idempotent server-side duplicate check
5. `spendEnergy()` validates sufficient balance before deducting via `spend_energy` RPC

**State Management:**
- Client-side: Agent selection (React Context), Mission state (useReducer in MissionModeShell), Command Deck flow state (useState in CommandDeckShell)
- Chat state: AI SDK v6 `useChat` hook in CommsPanel (manages message history, streaming status, tool call deduplication)
- Server-side: Auth sessions (Supabase), economy data (profiles, loot_ledger, energy_logs), missions (missions table)
- Persistence: Supabase for all server state; agent selection in-memory per session

## Key Abstractions

**Agent System:**
- Purpose: Provide a companion character with domain expertise that can be toggled
- Examples: `src/contexts/AgentContext.tsx` (AGENTS constant, AgentProvider, useAgent hook)
- Pattern: Defines AgentId union type ("cooper" | "arlo" | "minh" | "maya") and Agent interface with name, title, emoji, and domain properties. Provider sets data-agent attribute to trigger CSS overrides.

**Loot Card Component:**
- Purpose: Unified card styling for game interface elements
- Examples: QuestCard, XPProgress, DailyStreak, RecentLoot all use .loot-card class
- Pattern: CSS class with border, shadow, and hover effects keyed to agent-accent color. Provides consistent visual language across game UI.

**Agent Color Mapping:**
- Purpose: Maintain consistent color scheme for each agent across UI
- Examples: AGENT_COLORS in AgentSelector, data-agent CSS selectors in globals.css
- Pattern: Record<AgentId, colorHex> maps agent IDs to specific colors (Cooper: #3B82F6 blue, Arlo: #F97316 orange, Minh: #10B981 green, Maya: #8B5CF6 purple). CSS custom properties allow theme-wide color substitution.

**Game Data Model:**
- Purpose: Represent game entities (Quest, LootItem) with type safety
- Examples: `src/components/QuestCard.tsx` (Quest interface), `src/components/RecentLoot.tsx` (LootItem interface)
- Pattern: TypeScript interfaces define shape of game objects. Data is hardcoded in components/pages; future Server Actions will fetch from Supabase.

## Entry Points

**Root Page:**
- Location: `src/app/page.tsx`
- Triggers: Browser navigates to / route
- Responsibilities: Wraps page in AgentProvider, renders sidebar (AgentSelector, player card), renders main content (header with StatsBar, quest grid, right rail with progress/streak/loot)

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Wraps all routes
- Responsibilities: Sets up HTML structure, loads fonts, sets metadata (title: "AGENTY: Your AI Quest for Knowledge"), imports globals.css

**AgentProvider:**
- Location: `src/contexts/AgentContext.tsx`
- Triggers: Renders AgentProvider in page.tsx
- Responsibilities: Initializes activeAgent state to "cooper", provides setActiveAgent callback that updates DOM attribute, supplies agent object to descendants

## Error Handling

**Strategy:** Minimal error handling currently implemented. Future Server Actions will need try-catch blocks for Supabase operations.

**Patterns:**
- Client-side rendering assumes data is always available (no loading states)
- No error boundaries implemented
- useAgent hook throws error if used outside AgentProvider scope (helps catch misconfiguration)

## Cross-Cutting Concerns

**Logging:** Not implemented. No logging framework configured.

**Validation:** Mission generation output validated by 11-rule deterministic validator (`src/lib/missions/validator.ts`). Zod schemas validate API input. Economy server actions enforce server-side amount constants (Loot Guard). Dashboard components still use hardcoded data (Phase 3).

**Authentication:** Supabase Auth with two flows: parent magic-link (OTP email) and child PIN login (6-digit, `signInWithPassword`). Auth gate on `/api/chat` and Server Actions. `BridgeLayout` checks auth server-side. Dev bypass via `NEXT_PUBLIC_DEV_SKIP_AUTH`.

**Authorization:** Row-Level Security (RLS) on profiles, loot_ledger, energy_logs, knowledge_base, pin_attempts, missions. Missions table: parent CRUD own rows, anyone reads active. Server Actions use admin client (service role) for mutations. `/api/chat` and `/api/generate-mission` validate session before any AI call.

---

*Architecture analysis: 2026-03-10 (updated 2026-03-12 — added AI, Mission, Command Deck, Economy, Server Actions layers)*
