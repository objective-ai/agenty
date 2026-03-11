# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Next.js 15 App Router with Context-based state management and a monolithic client-server boundary.

**Key Characteristics:**
- Client-side component tree with minimal server-side logic
- Supabase for authentication and data persistence
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

**Data Layer:**
- Purpose: Provide Supabase client connections for authentication and data querying
- Location: `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts`
- Contains: Browser-based Supabase client initialization and server-side cookie-based client factory
- Depends on: @supabase/ssr, @supabase/supabase-js, Next.js cookies API
- Used by: Server Actions (not yet implemented) and future data-fetching logic

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

1. StatsBar, XPProgress, DailyStreak, and RecentLoot display hardcoded player state
2. Data flows down as props (no context or state management for these values)
3. Components calculate derived values locally (e.g., XP percentage = currentXP / nextLevelXP)
4. All use agent-accent color for visual emphasis

**State Management:**
- Client-side only: Agent selection via React Context
- UI State: Component-level (progress percentages, streak calculations)
- Game State: Hardcoded in page component (QUESTS array, stats values)
- Persistence: None currently implemented (Supabase clients configured but unused)

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
- Responsibilities: Sets up HTML structure, loads fonts, sets metadata (title: "AGENTY — Quest for Knowledge"), imports globals.css

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

**Validation:** Minimal. Quest and LootItem types are defined but data is hardcoded. Future Server Actions will validate user input before database writes.

**Authentication:** Supabase Auth configured in `src/lib/supabase/` but not wired into UI. Currently no login/signup flow. All visitors see the same static quest data.

**Authorization:** Row-Level Security (RLS) defined in Supabase schema for profiles, loot_ledger, and energy_logs tables. Policies restrict users to viewing their own data. Not enforced client-side yet since no auth flow exists.

---

*Architecture analysis: 2026-03-10*
