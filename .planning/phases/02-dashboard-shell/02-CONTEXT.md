# Phase 2: Dashboard Shell - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

The Bridge dashboard renders with live gold, XP, and energy from Supabase, the chosen agent's neon theme is applied throughout, and the AnimatedNumber primitive is available for all subsequent reward animations. Agent selection persists across sessions via Supabase. No quest gameplay — that's Phase 3. No page transitions or tap feedback polish — that's Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Agent Selection Landing
- Full-page RPG-style agent picker for first-time visitors (like an Overwatch character select screen)
- All 4 agents (Cooper, Arlo, Minh, Maya) are fully unlocked and selectable from day one
- Each agent card shows: holographic portrait, specialty label (e.g., "Science & Logic"), Level badge, and "Ready" status
- Glow intensify + subtle lift on card hover/touch (consistent with `.loot-card` hover pattern)
- Subtle animated holographic grid background on the picker screen (command center ambiance)
- Portal/warp transition when selecting: card scales up and "unmasks" to reveal The Bridge, with digital static/particle overlay, ~800ms duration
- Returning users land directly on The Bridge with their last-used agent active
- "Switch Agent" triggered by tapping the mini agent avatar in the top-left of the status rail
- Switch overlay: full-screen blurred overlay with portal-out animation for current view
- Switch overlay shows agent-specific stats (quests completed per agent, shared economy)
- Holographic dissolve for avatar swap (old agent particles out, new agent particles in)
- Visual only in v1 — no sound effects (deferred)

### Dashboard Layout (The HUD)
- Top status rail: mini agent avatar (left, tappable for switch), XP progress bar spanning center in agent accent color, gold and energy counters (right)
- Left sidebar: navigation to Missions, Inventory, Lab — each navigates to an empty shell page with agent-themed header and empty state message
- Central quest area: Daily Claim banner at top, Start Quest hero card below, stacked vertically
- Daily Claim button: 64px chunky, high-contrast — after claiming, transforms into a countdown timer ("Next reward in 23h 14m")
- Start Quest button: 64px chunky, pulses slightly with a glow animation to draw the eye
- Level up: XP bar flashes in agent color + level number badge increments (contained — big celebration screen saved for Phase 3)

### Agent Theme Persistence
- Agent selection saved to `agent_id` column in Supabase `profiles` table for cross-device persistence
- On agent switch: 800ms theatrical full-screen glitch effect (scan lines, color distortion, brief noise overlay across entire viewport)
- All neon accent elements (borders, button glows, progress bars, text accents) animate their color shift to new agent's palette
- Mini avatar in top bar does a holographic dissolve: old agent dissolves into particles, new agent materializes from particles
- On Supabase save failure: theme changes optimistically, subtle non-intrusive toast appears ("Couldn't save your choice — it'll reset on reload")

### AnimatedNumber Primitive
- Smooth count-up animation with easeOutExpo easing (starts fast, slows at end)
- Scale bounce at conclusion: number physically grows ~110% then settles back to 100% (satisfying "thunk")
- Duration scales with gain amount: ~500ms for small changes (+5 gold), ~1200ms for large payouts (+50 gold)
- On gain: floating "+50 Gold" badge rises and fades out (RPG damage numbers style) AND counter background pulses with glow
- On spend (energy): agent-colored drain effect (uses active agent's accent, NOT red — not alarming for a 9-year-old)
- Slot machine roll effect explicitly reserved for Phase 3 loot box reveals — do not use here

### Comms Patch — Agent Dialogue Rules
- **No "Agent Name says:" prefixes** — remove all "Cooper says:" style headers from dialogue
- **Replace emojis with holographic agent portraits** — wherever an emoji represents an AGENT avatar (not a mechanic icon like ⚡ for energy), use the agent's holographic portrait instead. Each agent gets an `avatar` path in the AGENTS record. Cooper has `/cooper-hologram.png`; others use a `HolographicAvatar` component that renders a styled initial letter inside an agent-colored glowing circle
- **All system messages are 1st-person tactical** — dialogue from agents is always 1st person ("I'm scanning the grid..." not "Cooper is scanning..."). It should feel like a tactical transmission patching through to the Bridge
- **Mechanic emojis stay** — ⚡ for energy, 🪙 for gold, ✨ for XP are mechanic icons, not agent avatars. These remain as-is
- **Nav emojis stay** — 🎯 for Missions, 🎒 for Inventory, 🔬 for Lab represent pages, not agents

### Comms Ripple — Voice Pulse Effect
- **Visual**: 3–4 vertical bars of varying heights that "dance" next to the agent's holographic portrait during dialogue
- **Color**: Active agent's theme color (var(--agent-accent))
- **Trigger**: Animates while text is "typing" out on screen, then settles into a low steady pulse once message is fully displayed
- **Implementation**: Pure CSS @keyframes — lightweight, no JS audio analysis. Create a `CommsRipple` component with 4 `<span>` bars using staggered animation-delay
- **Usage**: Placed next to HolographicAvatar wherever an agent is "speaking" (Mission Control briefing, Training Room station content, shell page empty states)

### Claude's Discretion
- Exact sidebar icon set and navigation labels
- Empty shell page layout and empty state message copy
- Toast component implementation approach
- Exact particle count and physics for holographic dissolve
- XP bar width and height proportions in the status rail
- Grid animation speed and line spacing on agent picker background

</decisions>

<specifics>
## Specific Ideas

- Agent picker should feel like picking a character in an RPG — "Choose Your Companion" energy
- The HUD top bar should feel like a game's heads-up display, not a SaaS dashboard header
- "Digital glitch" on agent switch should feel like the entire system is reconfiguring for the new agent — theatrical, 800ms
- The portal/warp transition from agent selection should feel like stepping through a gateway into the command center
- Numbers going up should feel like a slot machine payout — the "juice" of the app
- Spending energy should feel effortless, not punishing — agent-colored drain keeps it on-brand
- Countdown timer after Daily Claim builds anticipation for returning tomorrow

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AgentSelector.tsx`: Sidebar agent toggle — needs redesign into full-page picker, but agent data structure reusable
- `StatsBar.tsx`: Gold/energy/prestige display — refactor to pull live Supabase data, reposition into top rail
- `XPProgress.tsx`: XP bar component — adapt to span center of status rail with agent accent color
- `DailyStreak.tsx`: Weekly streak tracker — may integrate into the HUD or sidebar
- `RecentLoot.tsx`: Loot history list — can populate from Supabase `loot_ledger`
- `QuestCard.tsx`: Quest card component with status variants — reuse for Start Quest hero card
- `AgentContext.tsx`: Agent selection state with `data-agent` document attribute — extend with Supabase persistence
- `globals.css`: Full Adventure Navy design token system with `.loot-card` class, agent accent overrides via `[data-agent]`
- `economy.ts`: Server Actions for `awardLoot()` and `spendEnergy()` — wire Daily Claim and Start Quest buttons
- `client.ts` / `server.ts`: Supabase clients — use for real-time data fetching

### Established Patterns
- `data-agent` attribute selector pattern for theming — extend to all new components
- CSS custom properties for spacing/shadows/borders — continue using for consistency
- `@/` path alias for all imports — no relative paths
- `"use client"` directive on all interactive components
- Named exports for components, default export for page components
- Import from `motion/react` not `framer-motion` to avoid React 19 hydration errors

### Integration Points
- `/bridge` route — becomes The Bridge dashboard (currently page.tsx serves as quest hub)
- `/bridge/missions`, `/bridge/inventory`, `/bridge/lab` — new empty shell routes
- `AgentProvider` wrapper in layout — extend to persist agent choice to Supabase
- EconomyContext (DASH-03) — new context for hydrating gold/XP/energy from Supabase via Server Component layout
- `profiles` table in Supabase — add `agent_id` column for persistence
- Middleware from Phase 1 — protects all `/bridge/*` routes

</code_context>

<deferred>
## Deferred Ideas

- Sound effects for agent selection and UI interactions — future polish phase
- Slot machine animation for loot reveals — Phase 3

</deferred>

---

*Phase: 02-dashboard-shell*
*Context gathered: 2026-03-11*
