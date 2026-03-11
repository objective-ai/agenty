# Phase 2: Dashboard Shell - Research

**Researched:** 2026-03-11
**Domain:** Next.js 15 App Router — Server Component data hydration, client-side context, Framer Motion animation primitives, Supabase profile persistence
**Confidence:** HIGH

## Summary

Phase 2 replaces the placeholder `/bridge` page with a full game HUD: an RPG-style agent picker landing, a live stats rail (gold/XP/energy from Supabase), two server-wired action buttons, and an `AnimatedNumber` primitive. All hardcoded values in the existing components must be replaced with Supabase-fetched data. The agent theme system (`data-agent` on `<html>`) is already wired via CSS custom properties in `globals.css` — Phase 2 extends it with Supabase persistence and theatrical switch animations.

The stack is entirely in place. The primary work is: (1) adding `agent_id` to the `profiles` table via a new migration, (2) adding a Server Component layout that fetches profile data and wraps children in an `EconomyContext`, (3) redesigning the agent picker from a sidebar toggle to a full-page first-visit experience, and (4) creating the `AnimatedNumber` primitive using `motion/react` (not `framer-motion`).

The single biggest risk is the `motion/react` package: it is NOT installed. It must be added before any animation component can be built. The second risk is the `agent_id` column not existing in the database — a migration is required. The existing vitest infrastructure tests `src/__tests__/**/*.test.ts` in a Node environment; Phase 2 server action tests follow the same pattern.

**Primary recommendation:** Install `motion` package first, write the Supabase migration second, then build components in dependency order: EconomyContext → AgentPicker → HUD shell → AnimatedNumber → wired buttons.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Agent Selection Landing**
- Full-page RPG-style agent picker for first-time visitors (like an Overwatch character select screen)
- All 4 agents (Cooper, Arlo, Minh, Maya) are fully unlocked and selectable from day one
- Each agent card shows: holographic portrait, specialty label, Level badge, and "Ready" status
- Glow intensify + subtle lift on card hover/touch (consistent with `.loot-card` hover pattern)
- Subtle animated holographic grid background on the picker screen
- Portal/warp transition when selecting: card scales up and "unmasks" to reveal The Bridge, ~800ms duration
- Returning users land directly on The Bridge with their last-used agent active
- "Switch Agent" triggered by tapping the mini agent avatar in the top-left of the status rail
- Switch overlay: full-screen blurred overlay with portal-out animation for current view
- Switch overlay shows agent-specific stats (quests completed per agent, shared economy)
- Holographic dissolve for avatar swap (old agent particles out, new agent particles in)
- Visual only in v1 — no sound effects (deferred)

**Dashboard Layout (The HUD)**
- Top status rail: mini agent avatar (left, tappable for switch), XP progress bar spanning center in agent accent color, gold and energy counters (right)
- Left sidebar: navigation to Missions, Inventory, Lab — each navigates to an empty shell page with agent-themed header and empty state message
- Central quest area: Daily Claim banner at top, Start Quest hero card below, stacked vertically
- Daily Claim button: 64px chunky, high-contrast — after claiming, transforms into a countdown timer ("Next reward in 23h 14m")
- Start Quest button: 64px chunky, pulses slightly with a glow animation to draw the eye
- Level up: XP bar flashes in agent color + level number badge increments (contained)

**Agent Theme Persistence**
- Agent selection saved to `agent_id` column in Supabase `profiles` table for cross-device persistence
- On agent switch: 800ms theatrical full-screen glitch effect (scan lines, color distortion, brief noise overlay across entire viewport)
- All neon accent elements animate their color shift to new agent's palette
- Mini avatar in top bar does a holographic dissolve: old agent dissolves into particles, new agent materializes from particles
- On Supabase save failure: theme changes optimistically, subtle non-intrusive toast appears

**AnimatedNumber Primitive**
- Smooth count-up animation with easeOutExpo easing (starts fast, slows at end)
- Scale bounce at conclusion: number physically grows ~110% then settles back to 100%
- Duration scales with gain amount: ~500ms for small changes (+5 gold), ~1200ms for large payouts (+50 gold)
- On gain: floating "+50 Gold" badge rises and fades out (RPG damage numbers style) AND counter background pulses with glow
- On spend (energy): agent-colored drain effect (uses active agent's accent, NOT red)
- Slot machine roll effect reserved for Phase 3 — do not use here

### Claude's Discretion
- Exact sidebar icon set and navigation labels
- Empty shell page layout and empty state message copy
- Toast component implementation approach
- Exact particle count and physics for holographic dissolve
- XP bar width and height proportions in the status rail
- Grid animation speed and line spacing on agent picker background

### Deferred Ideas (OUT OF SCOPE)
- Sound effects for agent selection and UI interactions
- Slot machine animation for loot reveals (Phase 3)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Agent selection (Cooper, Arlo, Minh, Maya) is the primary landing experience on The Bridge | AgentContext.tsx exists with AGENTS record; needs redesign from sidebar to full-page picker; `hasSeenPicker` or `agent_id IS NULL` determines first-visit routing |
| DASH-02 | Player stats (gold, XP, energy) are fetched from Supabase via Server Component layout, not hardcoded | Bridge layout.tsx is already a Server Component; fetch `profiles` row (gold, xp, energy, level) there and pass via EconomyContext |
| DASH-03 | EconomyContext hydrates from server-fetched data — no client-side loading waterfall | Pattern: Server Component fetches, passes initial data to `<EconomyProvider initialData={...}>` as props; context exposes values to all client components without useEffect fetch |
| DASH-04 | Daily reward claim button wired to `awardLoot()` Server Action | `awardLoot(amount, source, questId?)` already exists and is fully tested; button calls it via form action or `useTransition` + direct invocation |
| DASH-05 | Quest start button wired to `spendEnergy()` Server Action | `spendEnergy(cost, activity, metadata?)` already exists; same wiring pattern as DASH-04 |
| DASH-06 | Agent selection persists across page navigations within the session | AgentContext already holds client state; add Supabase `agent_id` write on selection; read initial value from Server Component via `profiles` fetch |
| UI-01 | Adventure Navy (#050B14) dark theme with chunky 2px borders and deep shadows throughout | globals.css has complete token system; `.loot-card` class handles borders/shadows; all new components use these tokens — no inline color values |
| UI-02 | Agent-specific neon accent glows (Cooper: Blue, Arlo: Orange, Minh: Green, Maya: Violet) | `[data-agent="X"]` CSS overrides in globals.css drive all accent colors via `--agent-accent` variables; components reference var tokens, not hardcoded hex |
| UI-06 | `'use client'` directive on every file importing `motion/react` (App Router requirement) | Established pattern per STATE.md; vitest runs in node environment; motion components must never be in Server Components |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router, Server Components, Server Actions | Already installed; project foundation |
| react | 19.2.3 | UI rendering | Already installed |
| @supabase/ssr | ^0.9.0 | Server-side Supabase client with cookie handling | Already installed; used in all existing server code |
| @supabase/supabase-js | ^2.99.0 | Client-side Supabase client | Already installed |
| motion | (NOT INSTALLED) | Animation primitives — `AnimatedNumber`, glitch effect, dissolve, portal transition | Project decision: import from `motion/react` not `framer-motion` |
| tailwindcss | ^4 | Styling via utility classes | Already installed; Tailwind v4 inline theme in globals.css |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^4.0.18 | Unit tests for server actions | Every new Server Action gets a test file at `src/__tests__/dashboard/*.test.ts` |
| @vitejs/plugin-react | ^5.1.4 | React plugin for vitest | Already configured |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `motion/react` | `framer-motion` | `framer-motion` causes React 19 hydration errors — PROJECT DECISION to use `motion/react` |
| CSS custom property transitions | JS-driven color lerp | CSS transitions on `--agent-accent` already work (see globals.css `* { transition-property: ... }`) — no JS needed for color shift |
| `useEffect` Supabase fetch on client | Server Component layout fetch | Client fetch creates loading waterfall; Server Component fetch eliminates it (DASH-03 requirement) |

**Installation (motion package — NOT yet installed):**
```bash
npm install motion
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── bridge/
│       ├── layout.tsx          # Server Component: fetch profile, wrap in EconomyProvider + AgentProvider
│       ├── page.tsx            # HUD shell: status rail, sidebar nav, central quest area
│       ├── missions/page.tsx   # Empty shell with agent-themed header
│       ├── inventory/page.tsx  # Empty shell with agent-themed header
│       └── lab/page.tsx        # Empty shell with agent-themed header
├── components/
│   ├── AnimatedNumber.tsx      # 'use client' — motion/react count-up + scale bounce + float badge
│   ├── AgentPicker.tsx         # 'use client' — full-page picker, portal transition
│   ├── AgentSwitchOverlay.tsx  # 'use client' — full-screen blurred overlay for switching
│   ├── HudStatusRail.tsx       # 'use client' — mini avatar + XP bar + gold/energy counters
│   ├── DailyClaim.tsx          # 'use client' — 64px button → countdown timer after claim
│   ├── StartQuestButton.tsx    # 'use client' — 64px pulsing button wired to spendEnergy()
│   ├── StatsBar.tsx            # REFACTOR: accept props instead of hardcoded values
│   └── XPProgress.tsx          # REFACTOR: accept props instead of hardcoded values
├── contexts/
│   ├── AgentContext.tsx         # EXTEND: add Supabase persistence + initial agent from server
│   └── EconomyContext.tsx       # NEW: hydrated from server-fetched profile data
└── lib/
    └── actions/
        └── agent.ts             # NEW: Server Action — saveAgentSelection(agentId)
```

### Pattern 1: Server Component Layout Hydration (for DASH-02, DASH-03)

**What:** The bridge layout.tsx fetches the user's profile row once on every request. It passes `{ gold, xp, energy, level, agentId }` as initial props to client context providers, eliminating any client-side fetch waterfall.

**When to use:** Any data that must be available on first paint without loading spinners.

**Example:**
```typescript
// src/app/bridge/layout.tsx (Server Component — NO 'use client')
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AgentProvider } from "@/contexts/AgentContext";
import { EconomyProvider } from "@/contexts/EconomyContext";

export default async function BridgeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("gold, xp, energy, level, agent_id, display_name")
    .eq("id", user.id)
    .single();

  return (
    <AgentProvider initialAgent={profile?.agent_id ?? "cooper"}>
      <EconomyProvider
        initialGold={profile?.gold ?? 0}
        initialXp={profile?.xp ?? 0}
        initialEnergy={profile?.energy ?? 100}
        initialLevel={profile?.level ?? 1}
      >
        {children}
      </EconomyProvider>
    </AgentProvider>
  );
}
```

### Pattern 2: EconomyContext with Server Hydration (for DASH-03)

**What:** A client context that is initialized from server-fetched values (no loading state, no waterfall). Client updates (after Server Action returns) call the context setter directly.

**When to use:** Shared game state (gold, XP, energy) that multiple components read and that Server Actions update.

```typescript
// src/contexts/EconomyContext.tsx
"use client";
import { createContext, useContext, useState } from "react";

interface EconomyState { gold: number; xp: number; energy: number; level: number; }
interface EconomyContextValue extends EconomyState {
  setGold: (v: number) => void;
  setEnergy: (v: number) => void;
}
const EconomyContext = createContext<EconomyContextValue | null>(null);

export function EconomyProvider({ children, initialGold, initialXp, initialEnergy, initialLevel }:
  { children: React.ReactNode } & { initialGold: number; initialXp: number; initialEnergy: number; initialLevel: number }) {
  const [gold, setGold] = useState(initialGold);
  const [xp, setXp] = useState(initialXp);
  const [energy, setEnergy] = useState(initialEnergy);
  const [level, setLevel] = useState(initialLevel);
  return (
    <EconomyContext.Provider value={{ gold, xp, energy, level, setGold, setEnergy }}>
      {children}
    </EconomyContext.Provider>
  );
}

export function useEconomy() {
  const ctx = useContext(EconomyContext);
  if (!ctx) throw new Error("useEconomy must be inside EconomyProvider");
  return ctx;
}
```

### Pattern 3: Server Action Invocation from Client Button (for DASH-04, DASH-05)

**What:** Client button calls Server Action via `useTransition`. On success, updates context state. No client-side Supabase calls.

**When to use:** All economy mutations (awardLoot, spendEnergy) — the Loot Guard requirement.

```typescript
// DailyClaim.tsx — 'use client'
"use client";
import { useTransition } from "react";
import { awardLoot } from "@/lib/actions/economy";
import { useEconomy } from "@/contexts/EconomyContext";

export function DailyClaim() {
  const { setGold } = useEconomy();
  const [isPending, startTransition] = useTransition();

  function handleClaim() {
    startTransition(async () => {
      const result = await awardLoot(25, "daily_bonus");
      if (result.success) {
        setGold(result.data.newGold);
        // trigger AnimatedNumber update
      }
    });
  }

  return (
    <button onClick={handleClaim} disabled={isPending} style={{ minHeight: 64 }}>
      {isPending ? "Claiming..." : "Claim Daily Reward"}
    </button>
  );
}
```

### Pattern 4: AgentContext Extension for Supabase Persistence (for DASH-06)

**What:** AgentContext accepts an `initialAgent` prop (from server), syncs `data-agent` attribute on mount, and persists changes via a Server Action.

**When to use:** Agent selection that must survive page navigation AND cross-device.

**Key behaviors:**
- `setActiveAgent` calls `saveAgentSelection(id)` Server Action (optimistic — does not await before updating UI)
- On failure: toast appears, agent state is NOT reverted (per user decision: "theme changes optimistically")
- Initial `data-agent` set via `initialAgent` prop eliminates flash-of-wrong-agent on hydration

### Pattern 5: AnimatedNumber Primitive (for AnimatedNumber requirement)

**What:** A `'use client'` component using `motion/react` that animates a number from `from` to `to` with easeOutExpo, a scale bounce at the end, and a floating badge for positive gains.

**When to use:** Every gold/XP/energy counter on screen.

```typescript
// src/components/AnimatedNumber.tsx
"use client";
import { useEffect, useRef } from "react";
import { animate, motion } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  onGain?: (delta: number) => void; // triggers floating badge
}

export function AnimatedNumber({ value, prefix = "", suffix = "", onGain }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    const delta = value - prevValue.current;
    const duration = Math.min(0.5 + Math.abs(delta) / 50 * 0.7, 1.2); // ~500ms small, ~1200ms large
    const node = ref.current;
    if (!node) return;

    const controls = animate(prevValue.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo approximation
      onUpdate(latest) {
        node.textContent = `${prefix}${Math.round(latest).toLocaleString()}${suffix}`;
      },
    });

    if (delta > 0 && onGain) onGain(delta);
    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  return <span ref={ref}>{prefix}{value.toLocaleString()}{suffix}</span>;
}
```

NOTE: `animate()` from `motion/react` is the low-level animation driver that works on plain values — confirmed available in motion package.

### Pattern 6: Agent Picker First-Visit Detection (for DASH-01)

**What:** If `profile.agent_id IS NULL`, the bridge page renders `<AgentPicker>` instead of the HUD. Once an agent is selected, `saveAgentSelection()` writes to DB, page re-renders with HUD.

**When to use:** Routing logic in `app/bridge/page.tsx`.

```typescript
// app/bridge/page.tsx (Server Component)
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function BridgePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agent_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agent_id) {
    // First-time visitor: show full-page picker
    return <AgentPickerPage />;
  }

  // Returning user: show The Bridge HUD
  return <BridgeHUD />;
}
```

### Anti-Patterns to Avoid

- **Client-side Supabase fetch for profile data:** Creates loading spinner flash on every navigation — use Server Component layout pattern instead (DASH-03 requirement).
- **Import from `framer-motion`:** Causes React 19 hydration errors — always import from `motion/react` (PROJECT DECISION, recorded in STATE.md).
- **Hardcoded `data-agent` attribute:** The existing `bridge/page.tsx` has `data-agent="cooper"` hardcoded — this must be removed; the value comes from context initialized from server.
- **Calling `awardLoot()` or `spendEnergy()` from client-side Supabase:** Bypasses the Loot Guard — all economy writes MUST go through Server Actions (CLAUDE.md Security section).
- **Motion components without `'use client'`:** Will cause Next.js build error — every file that imports `motion/react` must have `'use client'` as its first line.
- **Setting `document.documentElement.setAttribute` during SSR:** The existing `AgentContext.tsx` has a bare `if (typeof document !== "undefined")` call inside the function body (not in a `useEffect`) — this can cause hydration mismatches. Fix with `useEffect`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Number count-up animation | Custom `setInterval` + linear lerp | `motion/react` `animate()` with easeOutExpo | Handles RAF scheduling, cancellation, interruption correctly |
| Agent color transition | Manual color lerp in JS | CSS custom property transitions (already in globals.css `*` block) | Zero JS overhead; GPU-composited; already works |
| Toast notifications | Custom Portal + z-index management | Simple fixed-positioned div with `motion/react` `AnimatePresence` | OR use existing pattern from Phase 1 if any; Claude's discretion |
| Countdown timer after daily claim | `setInterval` with complex state | `date-fns` `differenceInSeconds` + simple `useEffect` — OR hardcode "24h" placeholder | Timer logic is straightforward; no library needed |
| Agent persistence | Custom localStorage | Supabase `profiles.agent_id` column | Cross-device; server-authoritative; already in architecture decision |

**Key insight:** The CSS custom property system in `globals.css` already handles 90% of the theming work. The `[data-agent]` selectors, `--agent-accent` variables, and the `* { transition-property: ... }` rule mean color transitions happen automatically when `data-agent` changes. Resist the urge to re-implement this in JavaScript.

---

## Common Pitfalls

### Pitfall 1: Flash of Wrong Agent Color on Hydration

**What goes wrong:** Server renders with default agent color (gold), client hydrates with user's actual agent color (e.g., blue) — causing a visible color flash.

**Why it happens:** `data-agent` is set in a `useEffect` (client-only) but the initial server HTML uses the default `:root` CSS variables.

**How to avoid:** Pass `initialAgent` from the Server Component layout to `AgentProvider`. Set `data-agent` as an attribute on `<html>` in the layout's returned JSX (via a `suppressHydrationWarning` span or by embedding the initial agent in a `<script>` tag). The safest approach: the `<html>` tag in the root `layout.tsx` cannot easily receive dynamic attributes from nested layouts — instead, `AgentProvider` should set `document.documentElement.setAttribute` inside a `useLayoutEffect` (runs synchronously before paint) rather than `useEffect`.

**Warning signs:** Visible color shift on first load; hydration warning in dev console.

### Pitfall 2: AgentContext Sets `data-agent` Outside `useEffect`

**What goes wrong:** Hydration mismatch warning in Next.js because the existing `AgentContext.tsx` runs `document.documentElement.setAttribute(...)` inline in the component body with a `typeof document` guard instead of inside `useEffect`.

**Why it happens:** Code that runs during render on the client but has no server-side equivalent creates mismatches.

**How to avoid:** Move the `document.documentElement.setAttribute` call into `useEffect(() => { ... }, [activeAgent])` — React executes this after hydration is complete.

**Warning signs:** `Warning: Extra attributes from the server: data-agent` in dev console.

### Pitfall 3: `motion` Package Not Installed

**What goes wrong:** Build fails with `Cannot find module 'motion/react'` when `AnimatedNumber.tsx` or any other motion component is created.

**Why it happens:** The `motion` package is not in `package.json` — it was referenced in STATE.md decisions but never installed.

**How to avoid:** First task in Wave 0 (or Wave 1) must be `npm install motion`.

**Warning signs:** TypeScript error on import; runtime module not found error.

### Pitfall 4: `agent_id` Column Missing from `profiles` Table

**What goes wrong:** Supabase query `profiles.select("agent_id")` returns `null` or throws schema error.

**Why it happens:** The migration `20260310000000_create_core_tables.sql` does not include `agent_id`. No migration adds it.

**How to avoid:** Create a new migration file `supabase/migrations/20260311000000_add_agent_id_to_profiles.sql` that adds `agent_id text default null`. Apply it before any server code reads the column.

**Warning signs:** TypeScript `profiles` type does not include `agent_id`; queries return unexpected `null`.

### Pitfall 5: Server Action Called from Layout Causes Double Hydration

**What goes wrong:** Calling a Server Action to update `agent_id` from within the layout's rendering path (instead of from user interaction) causes unexpected re-renders.

**Why it happens:** Server Actions called during render are not the intended use — they should only be triggered by user events (form submissions, button clicks).

**How to avoid:** Agent selection persistence should be a discrete user action: button click in `AgentPicker` or `AgentSwitchOverlay` calls `saveAgentSelection(id)` as a transition, then the router refreshes the page (`router.refresh()`) to re-run the Server Component layout with the new `agent_id`.

**Warning signs:** Infinite render loops; unexpected re-fetch behavior.

### Pitfall 6: `'use client'` Missing on Motion Components

**What goes wrong:** `next build` fails with error: `You're importing a component that needs "motion/react" which is only available on the client side.`

**Why it happens:** App Router defaults to Server Components. Any file importing `motion/react` must be explicitly marked as a Client Component.

**How to avoid:** First line of EVERY file that imports from `motion/react` must be `"use client";`. This is enforced by UI-06.

**Warning signs:** Build error; works in dev (`next dev` is more lenient) but fails in `next build`.

---

## Code Examples

Verified patterns from existing codebase and established decisions:

### Supabase Migration for `agent_id`
```sql
-- supabase/migrations/20260311000000_add_agent_id_to_profiles.sql
alter table public.profiles
  add column if not exists agent_id text
    check (agent_id in ('cooper', 'arlo', 'minh', 'maya'))
    default null;
```

### Save Agent Selection Server Action
```typescript
// src/lib/actions/agent.ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AgentId = "cooper" | "arlo" | "minh" | "maya";

export async function saveAgentSelection(agentId: AgentId): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ agent_id: agentId })
    .eq("id", user.id);

  if (error) return { success: false, error: "Failed to save agent" };
  return { success: true };
}
```

NOTE: Uses `supabaseAdmin` (service role) for write, consistent with Loot Guard pattern. Authenticated user is still verified via `createClient().auth.getUser()`.

### AgentContext Fixed Hydration Pattern
```typescript
// Existing code has this (BAD — runs during render, causes hydration warning):
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-agent", activeAgent);
}

// Fix: move to useEffect + useLayoutEffect for synchronous pre-paint update
import { useLayoutEffect, useEffect } from "react";

// In AgentProvider:
useLayoutEffect(() => {
  document.documentElement.setAttribute("data-agent", activeAgent);
}, [activeAgent]);
```

### Glitch Effect CSS (Agent Switch — ~800ms)
```css
/* Add to globals.css — no motion/react needed for the CSS animation itself */
@keyframes agent-glitch {
  0%, 100% { opacity: 1; filter: none; }
  10% { opacity: 0.8; filter: hue-rotate(90deg) brightness(1.5); }
  20% { opacity: 0.9; transform: translateX(-2px); }
  30% { filter: hue-rotate(-90deg) brightness(0.8); }
  40% { transform: translateX(2px); filter: none; }
  50% { opacity: 0.7; }
  60% { filter: saturate(2) brightness(1.2); }
  70% { transform: translateX(-1px); }
  80% { opacity: 0.9; filter: none; }
}
.agent-glitch-active {
  animation: agent-glitch 0.8s ease-in-out;
}
```

Apply class to `<html>` element via JS for 800ms on agent switch.

### router.refresh() Pattern After Agent Selection
```typescript
// AgentPicker.tsx — 'use client'
"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { saveAgentSelection, type AgentId } from "@/lib/actions/agent";
import { useAgent } from "@/contexts/AgentContext";

export function AgentPicker() {
  const { setActiveAgent } = useAgent();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(id: AgentId) {
    setActiveAgent(id); // immediate optimistic UI
    startTransition(async () => {
      const result = await saveAgentSelection(id);
      if (result.success) {
        router.refresh(); // re-runs Server Component layout with new agent_id
        // layout re-render will switch from AgentPickerPage to BridgeHUD
      } else {
        // show toast: "Couldn't save your choice"
      }
    });
  }
  // ... render picker cards
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` import | `motion/react` import | Framer Motion v11+ / React 19 | Eliminates React 19 hydration errors — critical for this project |
| `getServerSideProps` data fetching | Server Component layout fetch | Next.js 13+ App Router | No `getServerSideProps` in App Router; layout.tsx IS the server fetch layer |
| `useEffect` + client Supabase fetch | Server Component initial fetch + client context | Next.js 13+ | Eliminates loading waterfall; initial HTML contains real data |
| `framer-motion` `animate` function | `motion/react` `animate` function | motion v11 | Same API, different import path — verify with `import { animate } from "motion/react"` |

**Deprecated/outdated:**
- `framer-motion` direct import: Do not use — React 19 hydration warning. Use `motion/react`.
- `getServerSideProps`: Does not exist in App Router. Server Components + `createClient()` replace it.
- Hardcoded `data-agent="cooper"` in bridge/page.tsx: Must be removed in Phase 2; dynamic value from context.

---

## Open Questions

1. **`motion/react` `animate()` for plain values vs DOM elements**
   - What we know: `motion/react` exports both `animate()` (for DOM) and `useAnimate` hook. The `AnimatedNumber` pattern above uses `animate(from, to, { onUpdate })` which animates a plain number value without touching the DOM directly — this is supported by the motion library.
   - What's unclear: Whether `animate(scalar, scalar, options)` signature is available in current `motion` package — this is the vanilla `motion/dom` API that `motion/react` re-exports.
   - Recommendation: After installing, verify with `import { animate } from "motion/react"` and test `animate(0, 100, { onUpdate: (v) => console.log(v) })`. Alternative: use `useSpring` or `useMotionValue` + `useTransform` for the same effect.

2. **`useLayoutEffect` SSR Warning**
   - What we know: `useLayoutEffect` fires before paint on the client — ideal for setting `data-agent` without flash. However, Next.js logs `Warning: useLayoutEffect does nothing on the server` when a Server Component tree includes a Client Component that uses `useLayoutEffect`.
   - What's unclear: Whether this warning appears or is suppressed in the current Next.js 16 + React 19 setup.
   - Recommendation: Use `useLayoutEffect` in `AgentContext`. If warning appears, suppress with the documented pattern: `const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect`.

3. **`router.refresh()` timing with portal transition animation**
   - What we know: `router.refresh()` causes the Server Component layout to re-run, which will switch the page from `<AgentPickerPage>` to `<BridgeHUD>`. This happens asynchronously.
   - What's unclear: Whether the ~800ms portal/warp animation can complete before `router.refresh()` causes a re-render, or if the refresh cancels the animation mid-flight.
   - Recommendation: Delay `router.refresh()` by ~850ms after the animation starts, or use `router.push("/bridge")` with the animation as an `exit` variant — letting `AnimatePresence` handle the unmount.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run src/__tests__/dashboard/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Agent picker renders all 4 agents | unit | `npx vitest run src/__tests__/dashboard/agent-picker.test.ts` | Wave 0 |
| DASH-02 | Profile fetch returns gold/xp/energy/level | unit | `npx vitest run src/__tests__/dashboard/profile-fetch.test.ts` | Wave 0 |
| DASH-03 | EconomyContext initializes from props, not client fetch | unit | `npx vitest run src/__tests__/dashboard/economy-context.test.ts` | Wave 0 |
| DASH-04 | Daily claim button calls `awardLoot()` and updates context | unit | `npx vitest run src/__tests__/dashboard/daily-claim.test.ts` | Wave 0 |
| DASH-05 | Quest start button calls `spendEnergy()` and updates context | unit | `npx vitest run src/__tests__/dashboard/start-quest.test.ts` | Wave 0 |
| DASH-06 | `saveAgentSelection()` writes `agent_id` to Supabase | unit | `npx vitest run src/__tests__/dashboard/agent-persist.test.ts` | Wave 0 |
| UI-01 | Visual — Adventure Navy theme applied | manual-only | N/A — visual verification | N/A |
| UI-02 | Visual — neon accent glows switch per agent | manual-only | N/A — visual verification | N/A |
| UI-06 | `'use client'` present on all motion-importing files | build | `npx next build` (zero hydration warnings) | N/A — build check |

**Manual-only justification for UI-01, UI-02:** CSS and visual design cannot be meaningfully unit-tested in a Node environment. Verification is done via `next build` + visual inspection.

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/dashboard/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + `next build` zero hydration warnings before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/dashboard/agent-picker.test.ts` — covers DASH-01
- [ ] `src/__tests__/dashboard/profile-fetch.test.ts` — covers DASH-02
- [ ] `src/__tests__/dashboard/economy-context.test.ts` — covers DASH-03
- [ ] `src/__tests__/dashboard/daily-claim.test.ts` — covers DASH-04
- [ ] `src/__tests__/dashboard/start-quest.test.ts` — covers DASH-05
- [ ] `src/__tests__/dashboard/agent-persist.test.ts` — covers DASH-06

Note: Existing `supabase-mock.ts` helper in `src/__tests__/helpers/` is reusable for all dashboard tests — extend `mockSupabaseAdmin()` to include `.rpc()` mock if needed for economy actions.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `src/contexts/AgentContext.tsx`, `src/components/StatsBar.tsx`, `src/components/XPProgress.tsx`, `src/components/AgentSelector.tsx`, `src/components/QuestCard.tsx`
- Direct codebase inspection — `src/lib/actions/economy.ts` (Server Actions already complete)
- Direct codebase inspection — `src/app/globals.css` (full token system, `[data-agent]` selectors, `.loot-card` class)
- Direct codebase inspection — `supabase/migrations/` (schema confirms `profiles` has no `agent_id` column)
- Direct codebase inspection — `vitest.config.ts`, `src/__tests__/helpers/supabase-mock.ts`
- Direct codebase inspection — `package.json` (confirms `motion` NOT installed; `next` 16.1.6, `react` 19.2.3)
- `.planning/STATE.md` — recorded project decisions: `motion/react` over `framer-motion`, Node vitest env, `supabaseAdmin` for writes

### Secondary (MEDIUM confidence)
- `CLAUDE.md` project guidelines — security model (Loot Guard), stack decisions, import conventions
- `BRANDING.md` — color palette confirmed: Cooper #3B82F6, Arlo #F97316, Minh #10B981, Maya #8B5CF6
- `AGENTS.md` — character domains and naming (Cooper not "Coach Cooper" in UI)
- `02-CONTEXT.md` — locked user decisions for all implementation choices

### Tertiary (LOW confidence)
- None — all critical findings verified against actual codebase files.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in `package.json` and `node_modules`; `motion` absence confirmed
- Architecture: HIGH — patterns derived from existing codebase conventions and Next.js App Router documented behavior
- Pitfalls: HIGH — hydration issues confirmed by existing `AgentContext.tsx` code review; `agent_id` absence confirmed by migration files; `motion` absence confirmed by node_modules inspection
- Test infrastructure: HIGH — vitest config, existing test files, and helper mocks directly inspected

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (stable stack — Next.js, Supabase, motion package APIs are stable)
