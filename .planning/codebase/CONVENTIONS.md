# Coding Conventions

**Analysis Date:** 2026-03-10

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension
  - Example: `AgentSelector.tsx`, `QuestCard.tsx`, `DailyStreak.tsx`
- Utility/library files: camelCase with `.ts` extension
  - Example: `client.ts`, `server.ts`
- Context providers: PascalCase with `.tsx` extension
  - Example: `AgentContext.tsx`
- CSS files: kebab-case with `.css` extension
  - Example: `globals.css`

**Functions:**
- Component functions: PascalCase (React convention)
  - Export: `export function AgentSelector() { ... }`
  - Example: `AgentProvider`, `QuestCard`, `TheBridge`
- Helper/utility functions: camelCase
  - Example: `createClient()`, `hexToRgb()`, `setActiveAgent()`
- Hooks: camelCase with `use` prefix
  - Example: `useAgent()`, `useCallback`

**Variables:**
- Constants (uppercase): SCREAMING_SNAKE_CASE
  - Example: `AGENTS`, `DAYS`, `STREAK`, `LOOT_ICONS`
- Regular variables: camelCase
  - Example: `activeAgent`, `isActive`, `streakCount`, `currentXP`
- Boolean flags: `is`/`has` prefix in camelCase
  - Example: `isLocked`, `isCompleted`, `isActive`, `isToday`, `hasErrors`

**Types:**
- Interfaces: PascalCase
  - Example: `interface Agent`, `interface StatProps`, `interface LootItem`, `interface Quest`
- Type aliases: PascalCase
  - Example: `type AgentId = "cooper" | "arlo" | "minh" | "maya"`
- Type imports: `import type`
  - Example: `import type { Metadata } from "next"`

**Constants & Data:**
- Lookup objects: SCREAMING_SNAKE_CASE
  - Example: `AGENT_COLORS`, `DIFFICULTY_BADGE`, `LOOT_ICONS`, `LOOT_COLORS`
- Data records: SCREAMING_SNAKE_CASE
  - Example: `AGENTS: Record<AgentId, Agent>`, `RECENT_LOOT: LootItem[]`

## Code Style

**Formatting:**
- Tool: Tailwind CSS v4 with PostCSS
- ESLint enabled with `eslint-config-next` (v9)
- No Prettier config detected; using Next.js ESLint defaults
- Line endings: Unix-style
- Indentation: 2 spaces (via ESLint config)

**Linting:**
- Framework: ESLint v9
- Config: `eslint.config.mjs`
- Rules: Next.js Core Web Vitals + TypeScript recommended
- Run: `npm run lint`
- Ignored files: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

**String quotes:**
- Double quotes for JSX attributes and string literals
  - Example: `className="flex items-center"`

## Import Organization

**Order:**
1. React/Next.js framework imports
2. Third-party library imports (Supabase, etc.)
3. Local component imports (with `@/` alias)
4. Local type imports (with `import type`)

**Example pattern from `src/app/page.tsx`:**
```typescript
import { AgentProvider } from "@/contexts/AgentContext";
import { AgentSelector } from "@/components/AgentSelector";
import { StatsBar } from "@/components/StatsBar";
import { QuestCard, type Quest } from "@/components/QuestCard";
```

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `tsconfig.json`)
- All local imports use `@/` prefix, not relative paths
- Example: `@/contexts/AgentContext`, `@/components/QuestCard`, `@/lib/supabase/client`

## Error Handling

**Patterns:**
- Guard clauses for context hooks
  - Pattern from `src/contexts/AgentContext.tsx`:
    ```typescript
    export function useAgent() {
      const ctx = useContext(AgentContext);
      if (!ctx) throw new Error("useAgent must be used within AgentProvider");
      return ctx;
    }
    ```
- Graceful degradation in try-catch (server-side)
  - Pattern from `src/lib/supabase/server.ts`:
    ```typescript
    try {
      cookiesToSet.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)
      );
    } catch {
      // Swallowed when called from a Server Component (read-only cookies).
      // Middleware will handle the refresh instead.
    }
    ```

## Logging

**Framework:** No formal logging framework; uses browser `console` when needed

**Patterns:**
- Code does not currently implement systematic logging
- Error context is communicated through error messages (e.g., guard clause errors)
- Comments explain expected behavior in catch blocks

## Comments

**When to Comment:**
- Clarify business logic or non-obvious intent
- Example: `const isToday = i === 4; // Friday`
- Example: `const done = STREAK[i]; // M-Th completed`
- Document catch blocks that swallow errors
- Explain CSS layout with section markers (see globals.css)

**Comment Style:**
- Single-line comments: `// comment`
- Inline comments for specific values: `variable = value; // why`
- Section headers: Use `/* ─── Section Name ─── */` with visual separator

**JSDoc/TSDoc:**
- Not currently used in codebase
- No @param, @returns, or @throws documentation observed
- Focus is on type safety through TypeScript interfaces instead

## Function Design

**Size:** Functions are typically small (10-30 lines)
- Components render UI or delegate to helpers
- Helper functions handle single concerns
- Example: `hexToRgb()` does color conversion only

**Parameters:**
- Destructured in function signatures
  - Example: `export function AgentSelector() { ... }`
  - Example: `function Stat({ icon, label, value, color, glowColor }: StatProps) { ... }`
- Type annotations required (strict TypeScript mode)
- Inline type definitions in parameters when simple
  - Example: `{ children }: { children: ReactNode }`

**Return Values:**
- React components return JSX.Element (implicit)
- Helper functions explicitly type return values
  - Example: `function hexToRgb(hex: string): string`
- No null/undefined returns; validation happens at boundaries

## Module Design

**Exports:**
- Named exports for components and utilities
  - Example: `export function AgentProvider(...) { ... }`
  - Example: `export const AGENTS: Record<AgentId, Agent> = { ... }`
- Default export for page components only
  - Example: `export default function TheBridge() { ... }`
  - Example: `export default function RootLayout() { ... }`

**Barrel Files:**
- Not currently used
- Components are imported directly: `import { AgentSelector } from "@/components/AgentSelector"`

## Client vs Server

**Directive Usage:**
- `"use client"` at top of component files for client-side React components
  - All component files in `src/components/` have `"use client"`
  - All context files have `"use client"` (React Context API requirement)
- Server-side utility functions in `src/lib/supabase/server.ts` (no directive)
- Root layout is a Server Component by default

**Server Actions:**
- Not yet implemented in codebase
- Per CLAUDE.md guidelines: "Prioritize Server Actions over heavy client-side logic"
- Pattern to follow: Create `src/app/actions/*.ts` files with `"use server"` directive

## CSS & Styling

**Framework:** Tailwind CSS v4 (PostCSS integration)

**Pattern:**
- All styling via Tailwind utility classes
- Custom CSS variables defined in `:root` in `src/app/globals.css`
- Named color/spacing variables referenced in markup
  - Example: `className="p-[var(--space-5)]"`, `style={{ color: "var(--gold)" }}`

**Theme System:**
- CSS variables for design tokens in globals.css
- Agent-based CSS overrides via `[data-agent="X"]` selectors
  - Example: `[data-agent="cooper"]` sets blue tones
  - Dynamic agent switching updates document attribute

**Card Component Class:**
- `.loot-card` base class for consistent styling
  - Defined in globals.css with border, shadow, hover effects
  - Used: `className="loot-card p-[var(--space-5)]"`

## State Management

**React Hooks:**
- `useState` for local component state
  - Example: `const [activeAgent, setActiveAgentState] = useState<AgentId>("cooper")`
- `useContext` for global state (AgentContext)
- `useCallback` for stable function references
  - Example: `const setActiveAgent = useCallback((id: AgentId) => { ... }, [])`

**Context API:**
- AgentContext provides active agent to entire app
- Located in `src/contexts/AgentContext.tsx`
- Consumed via custom hook: `const { activeAgent, setActiveAgent, agent } = useAgent()`

## TypeScript Patterns

**Strict Mode:** Enabled (`"strict": true` in tsconfig.json)

**Type Safety:**
- Interface definitions for props (StatProps, LootItem)
- Record types for lookups: `Record<AgentId, Agent>`
- Union types for enums: `type AgentId = "cooper" | "arlo" | "minh" | "maya"`
- Non-null assertion for env vars: `process.env.NEXT_PUBLIC_SUPABASE_URL!`

---

*Convention analysis: 2026-03-10*
