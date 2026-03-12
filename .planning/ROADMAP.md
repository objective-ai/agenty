# Roadmap: Agenty — Your AI Quest for Knowledge

## Overview

Four phases that build strictly on each other: lock down authentication first so there is a valid session and a profiles row before anything else; establish the dashboard shell and economy contexts second so all components read real Supabase data synchronously; wire the full reward loop — daily claim, demo quest, celebrations — third; and finish with animation polish that makes the UI feel like a AAA game. Every v1 requirement maps to exactly one phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Auth Foundation** - Parent magic-link setup + kid PIN login with brute-force protection and session middleware
- [x] **Phase 2: Dashboard Shell** - The Bridge renders with real Supabase data, agent theming active, and AnimatedNumber primitive ready
- [x] **Phase 2.5: Intelligence Core** (INSERTED) - Claude AI chat, vector embeddings, PDF upload + RAG, Mission Mode with briefing board
- [ ] **Phase 3: Expanded Reward Loop** - Wire live data (kill mocks), rank titles, shields/damaged mode, Command Deck upgrades (4 new inputs), AI mission banners via Gemini
- [ ] **Phase 4: Animation Polish** - Page transitions, iPad touch targets, and haptic-style tap feedback across every interactive element

## Phase Details

### Phase 1: Auth Foundation
**Goal**: A parent can set up their child's account via magic link, and the kid can log in daily with a 6-digit PIN — with rate limiting, PKCE session handling, and a guaranteed profiles row.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. Parent receives a magic link email, clicks it, and their child's account is created with a profiles row in Supabase
  2. Kid can enter a 6-digit PIN on the login screen and land on The Bridge dashboard
  3. After 5 wrong PIN attempts within 15 minutes the input locks and shows a lockout message
  4. Visiting `/bridge` without a session redirects to the login page; visiting it with a valid session passes through
**Plans**: 4 plans

Plans:
- [ ] 01-00-PLAN.md — Wave 0: Vitest setup and test stub files
- [ ] 01-01-PLAN.md — Auth infrastructure: middleware, PKCE callback, pin_attempts migration, 24h session config
- [ ] 01-02-PLAN.md — Auth server actions: magic link, child account setup, PIN login with rate limiting, logout
- [ ] 01-03-PLAN.md — Auth UI: PIN login page, parent setup page, bridge shell

### Phase 2: Dashboard Shell
**Goal**: The Bridge dashboard renders with live gold, XP, and energy from Supabase, the chosen agent's neon theme is applied throughout, and the AnimatedNumber primitive is available for all subsequent reward animations.
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, UI-01, UI-02, UI-06
**Success Criteria** (what must be TRUE):
  1. The Bridge landing shows the four agent cards (Cooper, Arlo, Minh, Maya); selecting one visibly changes the neon accent color across the entire dashboard
  2. Gold, XP, and energy values shown on screen match the live values in Supabase — no hardcoded numbers
  3. The daily reward claim button and quest start button are present and wired to their Server Actions (no client-side Supabase calls)
  4. Agent selection survives navigating between pages within the same session
  5. All motion-importing components carry `'use client'` and cause zero hydration warnings in `next build`
**Plans**: TBD

### Phase 3: Expanded Reward Loop
**Goal**: Wire all dashboard components to live Supabase data (kill mocks), add rank titles, implement shields/damaged mode during missions, expand Command Deck with 4 new generation inputs, and generate AI mission banners via Gemini Nano Banana 2.
**Depends on**: Phase 2.5
**Requirements**: ECON-01, ECON-02, ECON-03, ECON-04, ECON-05, ECON-06, QUEST-01, QUEST-02, QUEST-03
**Success Criteria** (what must be TRUE):
  1. XPProgress, DailyStreak, StatsBar, and RecentLoot display live data from Supabase — zero hardcoded values
  2. Daily claim is idempotent (quest_id = "daily_claim_YYYY-MM-DD"), double-tap produces only one ledger entry
  3. Rank titles (Technical Scout → Field Engineer → Tactical Architect → Agenty Commander) display based on level
  4. Wrong answers during missions drain shields (-10%); at 0% "Damaged Mode" activates with visual effects and 50% reward penalty
  5. Command Deck collects problem count (3/5/10), difficulty (Easy/Medium/Hard), narrative theme (Space/Nature/History/Fantasy), and time estimate (Short/Medium/Long)
  6. Mission generation produces the correct number of stats matching problemCount and adjusts difficulty accordingly
  7. Each generated mission includes an AI-generated banner image (Gemini); missing API key degrades gracefully (no banner, no error)
**Plans**: 5 plans

Plans:
- [ ] 03-01-PLAN.md — Server Actions (claimDaily, getProfile, getRecentLoot), EconomyContext expansion, rank titles
- [ ] 03-02-PLAN.md — Wire dashboard components to live data (XPProgress, DailyStreak, StatsBar, RecentLoot, DailyClaim)
- [ ] 03-03-PLAN.md — Shields mechanic (missionReducer, reportWrongAnswer tool, Damaged Mode visuals)
- [ ] 03-04-PLAN.md — Command Deck upgrades (4 new inputs, DB migration, validator relaxation)
- [ ] 03-05-PLAN.md — AI mission banners (Gemini integration, Supabase Storage, banner display)

### Phase 2.5: Intelligence Core (INSERTED)
**Goal**: Claude AI streaming chat works with agent personas, PDFs can be uploaded and queried via RAG, and Mission Mode provides a structured learning flow with real-time stat tracking.
**Depends on**: Phase 2
**Requirements**: Chat with AI agents, knowledge upload, structured missions
**Success Criteria** (what must be TRUE):
  1. Cooper responds in-character via streaming chat at `/bridge` using Claude Sonnet 4 via AI SDK v6
  2. Uploading a PDF in the Intel Drawer chunks it, embeds via OpenAI, and stores in `knowledge_base` table
  3. Cooper's responses incorporate relevant knowledge from uploaded PDFs when available
  4. Mission Mode at `/bridge/lab?mission=dragon-bridge` shows briefing board with blueprint, stat gauges, and objective
  5. Board activates immediately on mount (client-side, no AI dependency)
  6. Student answering correctly triggers `updateStat` tool call, updating the stat gauge with a checkmark
**Plans**: Executed manually (not via GSD phases)

### Phase 4: Animation Polish
**Goal**: Every interactive element feels like a game control — Framer Motion page transitions between routes, minimum 44×44 px touch targets on all buttons, and a visible scale-bounce or glow-pulse on every tap.
**Depends on**: Phase 3
**Requirements**: UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. Navigating between the login page, agent selection, and quest screens plays a smooth Framer Motion page transition (no jarring cuts)
  2. Every button and interactive card on an iPad has a tap target of at least 44×44 px (verified with browser devtools)
  3. Tapping any button produces an immediate visible response (scale bounce or glow pulse) before the Server Action resolves
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth Foundation | 4/4 | Complete | 2026-03-10 |
| 2. Dashboard Shell | 7/7 | Complete | 2026-03-11 |
| 2.5. Intelligence Core | manual | Complete | 2026-03-12 |
| 3. Reward Loop | 0/5 | Not started | - |
| 4. Animation Polish | 0/TBD | Not started | - |
