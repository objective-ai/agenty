# Codebase Structure

**Analysis Date:** 2026-03-10

## Directory Layout

```
agenty/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with fonts and metadata
│   │   ├── page.tsx            # Main quest hub page ("The Bridge")
│   │   └── globals.css         # Design tokens, theme system, Tailwind config
│   ├── components/
│   │   ├── AgentSelector.tsx   # Sidebar agent toggle buttons
│   │   ├── QuestCard.tsx       # Individual quest card component
│   │   ├── StatsBar.tsx        # Top-right gold/energy/prestige display
│   │   ├── XPProgress.tsx      # Right rail: XP bar + level info
│   │   ├── DailyStreak.tsx     # Right rail: Weekly streak tracker
│   │   └── RecentLoot.tsx      # Right rail: Loot history list
│   ├── contexts/
│   │   └── AgentContext.tsx    # Agent selection state + provider
│   └── lib/
│       └── supabase/
│           ├── client.ts       # Browser Supabase client
│           └── server.ts       # Server-side Supabase client
├── supabase/
│   ├── config.toml             # Supabase local dev configuration
│   └── migrations/
│       └── 20260310000000_create_core_tables.sql
├── public/                      # Static assets
├── node_modules/
├── .env.local                   # Local environment config (Git-ignored)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.js           # (inherited from Tailwind v4)
├── postcss.config.mjs
├── eslint.config.mjs
├── CLAUDE.md                    # Development guidelines
├── PLAN.md                      # Phase tracking
└── README.md
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router pages and layout
- Contains: Root layout, page components, global styles
- Key files: `layout.tsx` (HTML structure), `page.tsx` (quest hub), `globals.css` (design tokens)

**`src/components/`:**
- Purpose: Reusable React components for game UI
- Contains: Individual feature components (quest cards, progress bars, agent selector)
- Key files: QuestCard (most complex, handles multiple quest statuses), AgentSelector (state interaction)

**`src/contexts/`:**
- Purpose: React Context for shared state
- Contains: Agent selection provider and custom hook
- Key files: `AgentContext.tsx` (only context file needed)

**`src/lib/`:**
- Purpose: Utility modules and client factories
- Contains: Supabase client initialization
- Key files: `supabase/client.ts` (browser), `supabase/server.ts` (server actions)

**`supabase/`:**
- Purpose: Supabase local dev setup and database schema
- Contains: Configuration and migrations
- Key files: `config.toml` (development settings), `migrations/` (schema definitions)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root HTML, font loading, metadata, global CSS import
- `src/app/page.tsx`: Main quest hub with sidebar + grid layout, AgentProvider wrapper

**Configuration:**
- `tsconfig.json`: Path alias `@/*` maps to `./src/*`
- `package.json`: Next.js 15, React 19, Tailwind CSS v4, Supabase dependencies
- `supabase/config.toml`: Local dev server ports (API: 54321, DB: 54322, Studio: 54323)

**Core Logic:**
- `src/contexts/AgentContext.tsx`: Agent state management and document attribute updates
- `src/components/QuestCard.tsx`: Quest status rendering (available/active/completed/locked) with progress tracking
- `src/app/globals.css`: 80 lines of design tokens covering backgrounds, text hierarchy, accent colors, agent theme overrides

**Styling:**
- `src/app/globals.css`: Master stylesheet with CSS custom properties and Tailwind v4 inline theme
- `.loot-card` class in globals.css: Base styling for all game UI cards (border, shadow, hover effects)

## Naming Conventions

**Files:**
- React components: PascalCase with .tsx extension (AgentSelector.tsx, QuestCard.tsx)
- Utilities/modules: camelCase with .ts extension (client.ts, server.ts)
- Context: descriptive name ending in Context.tsx (AgentContext.tsx)
- Page route: page.tsx (Next.js convention)
- Layout: layout.tsx (Next.js convention)

**Directories:**
- Feature directories: lowercase plural (components/, contexts/, lib/)
- Nested utilities: descriptive (supabase/)

**React Components:**
- Naming: Full component names describing primary element (AgentSelector, QuestCard, DailyStreak)
- Props interfaces: Inline (no separate .types.ts files) or local to component file
- Exports: Named exports for components

**TypeScript Types:**
- Game entities: Quest, LootItem, Agent, AgentId (defined in components or contexts where used)
- Avoid separate types/ directory; keep types co-located with components

## Where to Add New Code

**New Feature (e.g., new quest type or game mechanic):**
- Primary code: Create new component in `src/components/` (e.g., BossQuestCard.tsx)
- State if needed: Add to AgentContext.tsx if affecting agent/theme, or use component-level useState
- Styling: Use .loot-card base class and inline style props with CSS custom properties
- Integration: Import into `src/app/page.tsx` and render in appropriate grid location

**New Component/Module:**
- Presentation component: `src/components/FeatureName.tsx` with "use client" directive
- Utility/service: `src/lib/featureName.ts` (or `src/lib/supabase/operation.ts` for DB operations)
- Context: `src/contexts/FeatureContext.tsx` only if managing global state (avoid context proliferation)

**Server Actions (Future):**
- Location: `src/app/actions/` (suggested new directory for Server Actions)
- Pattern: Named async function with "use server" directive at top
- Security: All awardLoot() or spendEnergy() calls must validate user ownership and game rules server-side
- Example: `src/app/actions/quests.ts` → `acceptQuest(questId)`, `completeQuest(questId)`

**Utilities:**
- Shared helpers: `src/lib/utils/helpers.ts` (if needed; currently minimal)
- Constants: Define in component file or create `src/lib/constants.ts`
- Hooks: `src/lib/hooks/useHookName.ts` or co-locate with context

## Special Directories

**`.next/`:**
- Purpose: Next.js build artifacts
- Generated: Yes (during `npm run build`)
- Committed: No (.gitignore excludes it)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (during `npm install`)
- Committed: No (.gitignore excludes it)

**`supabase/.temp/`:**
- Purpose: Supabase CLI temporary files
- Generated: Yes (during local dev)
- Committed: No

**`public/`:**
- Purpose: Static assets (images, fonts, etc.)
- Generated: No (developer-managed)
- Committed: Yes

**`.planning/`:**
- Purpose: Architecture and planning documentation
- Generated: No (managed by GSD tools)
- Committed: Yes

## Code Organization Patterns

**Component Structure:**
```tsx
"use client";

import { useAgent } from "@/contexts/AgentContext";

interface QuestCardProps {
  quest: Quest;
}

export function QuestCard({ quest }: QuestCardProps) {
  // Component logic
  return <div>Card content</div>;
}
```

**Import Order (observed in codebase):**
1. Client/server directive ("use client" first if present)
2. React imports (createContext, useContext, useState, etc.)
3. Type imports (interfaces, types)
4. Context/hook imports from @/
5. Component imports from @/
6. Inline styles, constants, utility functions

**Styling Pattern:**
- Use inline style props with CSS custom properties: `style={{ color: "var(--agent-accent)" }}`
- Use Tailwind classes for layout: `className="flex items-center gap-[var(--space-3)]"`
- Spacing: Use CSS variable scale (--space-1 through --space-16, all multiples of 4px)
- Colors: Reference token variables, never hardcode hex except in AgentSelector.tsx (AGENT_COLORS mapping)

**State Management Pattern:**
- Global: Only agent selection via AgentContext
- Component-local: Use useState for UI state (quest progress calculations, streak counts)
- No Redux, Zustand, or other state libraries
- Future: Server Actions for mutations, no client-side API calls

## Dependency Structure

**Runtime Dependencies:**
- `next@16.1.6`: Framework
- `react@19.2.3`: UI library
- `react-dom@19.2.3`: DOM rendering
- `@supabase/supabase-js@2.99.0`: Supabase client
- `@supabase/ssr@0.9.0`: Supabase SSR integration

**Dev Dependencies:**
- `tailwindcss@4`: Styling framework (Tailwind v4 with PostCSS)
- `typescript@5`: Type checking
- `eslint@9`: Linting
- `supabase@2.78.1`: Supabase CLI for local dev

---

*Structure analysis: 2026-03-10*
