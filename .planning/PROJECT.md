# Agenty: Your AI Quest for Knowledge

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

### Active (v1 Sprint)

#### Authentication
- [ ] **AUTH-01**: Parent account setup via magic link to parent email.
- [ ] **AUTH-02**: PKCE callback route handler for session/cookie management.
- [ ] **AUTH-03**: Profile row auto-upsert on first login.
- [ ] **AUTH-04**: Kid-friendly daily 6-digit PIN login.
- [ ] **AUTH-05**: PIN rate limiting (5 attempts per 15min).
- [ ] **AUTH-06**: Auth middleware protecting `/bridge` routes.

#### The Bridge Dashboard
- [ ] **DASH-01**: Agent selection landing (Cooper, Arlo, Minh, Maya).
- [ ] **DASH-02**: Real-time player stats pulled from Supabase.
- [ ] **DASH-03**: EconomyContext hydration via Server Component layout.
- [ ] **DASH-04**: Daily reward claim button wired to `awardLoot()`.
- [ ] **DASH-05**: Quest start button wired to `spendEnergy()`.
- [ ] **DASH-06**: Persistent agent selection within the session.

#### Economy & Reward Loop
- [ ] **ECON-01**: Quest completion triggers `awardLoot()` for 50 Gold.
- [ ] **ECON-02**: Quest start triggers `spendEnergy()`.
- [ ] **ECON-03**: Idempotent reward claims (unique `quest_id` check).
- [ ] **ECON-04**: Animated gold counter (~800ms count-up).
- [ ] **ECON-05**: Celebration screen with Framer Motion burst.
- [ ] **ECON-06**: Optimistic UI updates for immediate feedback.

#### Demo Quest
- [ ] **QUEST-01**: Daily Check-in / Trivia hosted by **Cooper**.
- [ ] **QUEST-02**: Simple touch interaction to prove the loop.
- [ ] **QUEST-03**: End-to-end verification of the data flow.

#### UI & Polish
- [ ] **UI-01**: Adventure Navy theme, chunky borders, deep shadows.
- [ ] **UI-02**: Agent-specific neon accent glows (Cobalt, Orange, Green, Violet).
- [ ] **UI-03**: Framer Motion page transitions.
- [ ] **UI-04**: iPad touch targets (min 44x44px).
- [ ] **UI-05**: Haptic-style visual tap feedback.
- [ ] **UI-06**: Consistent `'use client'` usage on motion imports.


#### Phase 2.5 — The Intelligence Core
- [ ] **INTEL-01**: Install `ai` + `@ai-sdk/anthropic`, configure Claude 3.5 Sonnet.
- [ ] **INTEL-02**: Chat route/action wired to Vercel AI SDK + Anthropic provider.
- [ ] **INTEL-03**: Cooper dialogue with tactical persona from AGENTS.md.
- [ ] **INTEL-04**: Supabase migration: `create extension vector` + `knowledge_base` table (1536-dim).
- [ ] **INTEL-05**: HNSW index + `match_knowledge` RPC for top-k retrieval.
- [ ] **INTEL-06**: Knowledge Dropzone UI (drag-and-drop PDF, Adventure Navy styling).
- [ ] **INTEL-07**: `uploadIntel` Server Action (parse PDF → chunk → embed → store).
- [ ] **INTEL-08**: RAG-augmented chat — Cooper retrieves from Knowledge Vault.
- [ ] **INTEL-09**: Cooper in-character upload acknowledgment.

### Out of Scope

- Rebuilding Supabase schema or RPCs — already complete
- Rebuilding server actions (economy.ts, admin.ts) — already complete
- Full curriculum / real learning content — future phase (Mission Ledger deferred to Phase 3)
- Multiple quests or quest progression system — future phase
- Parent dashboard or admin panel — future phase
- Mobile app — web-first
- Real-time multiplayer or social features — not in scope
- OAuth providers (Google, etc.) — PIN + magic link is sufficient for a kid
- Gemini 1.5 Flash integration — deferred until document scale demands it
- Image generation (agent portraits) — static assets sufficient for now

## Context

- The Supabase "Loot Guard" backend is 100% complete: `economy_rpcs.sql` defines the RPCs, `economy.ts` and `admin.ts` contain the Server Actions. These must not be rebuilt.
- The Next.js app is scaffolded with a working agent selector, quest cards, stats bar, XP progress, daily streak, and recent loot components — all currently using hardcoded data.
- The CSS design system is fully defined in `globals.css` with Adventure Navy theme, agent color overrides via `[data-agent]` selectors, and a complete spacing/shadow/border token system.
- The four agents each have a subject domain AND a distinct teaching personality:
  - **Cooper** (Blue #3B82F6): Hosts the demo quest
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
| Cooper hosts demo quest | Proves the full reward loop with one specific agent before expanding | — Pending |
| Framer Motion for animations | Reward loop needs satisfying visual feedback; Framer is the React standard | — Pending |
| No component libraries (no shadcn, etc.) | "Adventure game" aesthetic can't be achieved with default UI kits | — Pending |
| Claude 3.5 Sonnet via Vercel AI SDK | Precision and personality for agent dialogue; `@ai-sdk/anthropic` keeps provider-swap easy | — Phase 2.5a |
| OpenAI `text-embedding-3-small` (1536 dims) | Cheap, fast, battle-tested; Anthropic has no embedding model | — Phase 2.5b |
| HNSW index over IVFFlat | Better recall at small scale; no retraining as rows grow | — Phase 2.5b |
| Server Action for vectorization (not Edge Function) | Matches existing Loot Guard pattern; single security model | — Phase 2.5c |
| Defer Gemini + Mission Ledger | Ship Claude + RAG first to unblock Phase 3; add Gemini when scale demands it | — Phase 2.5 |
| `generateObject` + Zod for mission generation | Structured output with type-safe validation; retry on failure | — Phase 2.6 |
| 11-rule deterministic validator for LLM output | Catches hallucinated zones, out-of-range values, bad slugs before DB save | — Phase 2.6 |
| SVG template manifests with zone metadata | Guides LLM generation + powers BlueprintDiagram highlighting | — Phase 2.6 |
| missions.created_by as text (not uuid FK) | Supports "dev-user" string in dev mode; simpler than uuid casting | — Phase 2.6 |
| Loot Guard: server-side amount constants | `awardLoot(25, "daily_bonus")` — amount hardcoded on server, client cannot supply | — Phase 2.7 |
| Math-First Rule in system prompt | Enforces calculation-based answers, prevents rote lookup cheating | — Phase 2.7 |
| Anti-Cheat Protocol 07 | Sends students back to Intel Drawer on "I don't know" instead of giving answers | — Phase 2.7 |
| Tool call deduplication on `toolCallId` | AI SDK v6 fires multiple part events per tool call; prevents duplicate stat updates | — Phase 2.7 |

---
*Last updated: 2026-03-12 — Phase 2.6 (Command Deck) and 2.7 (Economy & Dashboard) documented*
