# Agenty — Quest for Knowledge

## What This Is

A gamified learning OS for a 9-year-old, built as a dark-mode "adventure game" UI. Kids pick an AI agent companion (Cooper, Arlo, Minh, or Maya), take on learning quests, and earn loot. The entire experience should feel like a AAA game menu — chunky borders, neon agent glows, animated rewards — not a corporate edtech dashboard.

## Core Value

A kid picks an agent, completes a quest, and watches their gold go up. The reward loop must feel immediate and satisfying.

## Requirements

### Validated

- ✓ Supabase backend economy (profiles, loot_ledger, energy_logs, RLS, RPCs) — existing
- ✓ Server Actions for awardLoot and spendEnergy — existing (`src/app/actions/economy.ts`)
- ✓ Admin Server Actions — existing (`src/app/actions/admin.ts`)
- ✓ Next.js 15 App Router scaffolded — existing
- ✓ Agent context system (Cooper/Arlo/Minh/Maya with color theming) — existing
- ✓ CSS design system with Adventure Navy theme and agent accent overrides — existing

### Active

- [ ] Kid-friendly auth flow: PIN for daily login, magic link (to parent email) for first-time setup / recovery
- [ ] Auth creates a row in the `profiles` table on first login
- [ ] "The Bridge" dashboard: agent selection as the primary landing experience
- [ ] Bridge shows player stats (gold, XP, energy) pulled from Supabase, not hardcoded
- [ ] Bridge provides a daily reward claim button wired to `awardLoot()`
- [ ] Bridge provides an energy-spend action (e.g., "Start Quest") wired to `spendEnergy()`
- [ ] One demo quest: "Daily Check-in" or "Dummy Trivia Challenge" hosted by Coach Cooper
- [ ] Completing the demo quest triggers `awardLoot()` granting 50 Gold
- [ ] Animated gold balance update — the number visually counts up after reward
- [ ] Adventure Navy (#050B14) dark theme with chunky 2px borders, deep shadows, neon agent glows
- [ ] Framer Motion animations on quest completion, loot award, and UI transitions

### Out of Scope

- Rebuilding Supabase schema or RPCs — already complete
- Rebuilding server actions (economy.ts, admin.ts) — already complete
- Full curriculum / real learning content — future phase
- Multiple quests or quest progression system — future phase
- Parent dashboard or admin panel — future phase
- Mobile app — web-first
- Real-time multiplayer or social features — not in scope
- OAuth providers (Google, etc.) — PIN + magic link is sufficient for a kid

## Context

- The Supabase "Loot Guard" backend is 100% complete: `economy_rpcs.sql` defines the RPCs, `economy.ts` and `admin.ts` contain the Server Actions. These must not be rebuilt.
- The Next.js app is scaffolded with a working agent selector, quest cards, stats bar, XP progress, daily streak, and recent loot components — all currently using hardcoded data.
- The CSS design system is fully defined in `globals.css` with Adventure Navy theme, agent color overrides via `[data-agent]` selectors, and a complete spacing/shadow/border token system.
- The four agents each have a subject domain AND a distinct teaching personality:
  - **Cooper** (Blue #3B82F6): The coach — hosts the demo quest
  - **Arlo** (Orange #F97316): TBD subject
  - **Minh** (Green #10B981): TBD subject
  - **Maya** (Violet #8B5CF6): TBD subject
- Target user: a single 9-year-old kid. Parent assists with initial setup (magic link email).

## Constraints

- **Tech stack**: Next.js 15 App Router, TypeScript, Tailwind CSS v4, Supabase, Framer Motion
- **UI aesthetic**: Must feel like a game, not SaaS. Chunky borders, deep shadows, neon glows. No default component libraries.
- **Security**: All `awardLoot()` / `spendEnergy()` calls happen in Server Actions only. Client requests, server validates and executes.
- **Existing code**: Do not modify `economy_rpcs.sql`, `economy.ts`, or `admin.ts`. Build on top of them.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PIN + magic link auth (not OAuth) | 9-year-olds don't have email addresses; PIN is fast for daily use, magic link via parent for setup | — Pending |
| Coach Cooper hosts demo quest | Proves the full reward loop with one specific agent before expanding | — Pending |
| Framer Motion for animations | Reward loop needs satisfying visual feedback; Framer is the React standard | — Pending |
| No component libraries (no shadcn, etc.) | "Adventure game" aesthetic can't be achieved with default UI kits | — Pending |

---
*Last updated: 2026-03-10 after initialization*
