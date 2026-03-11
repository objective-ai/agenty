# Roadmap: Agenty — Quest for Knowledge

## Overview

Four phases that build strictly on each other: lock down authentication first so there is a valid session and a profiles row before anything else; establish the dashboard shell and economy contexts second so all components read real Supabase data synchronously; wire the full reward loop — daily claim, demo quest, celebrations — third; and finish with animation polish that makes the UI feel like a AAA game. Every v1 requirement maps to exactly one phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Auth Foundation** - Parent magic-link setup + kid PIN login with brute-force protection and session middleware
- [ ] **Phase 2: Dashboard Shell** - The Bridge renders with real Supabase data, agent theming active, and AnimatedNumber primitive ready
- [ ] **Phase 3: Reward Loop** - Full playable loop: daily claim → demo quest → energy spend → celebration screen → gold goes up
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
**Plans**: TBD

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

### Phase 3: Reward Loop
**Goal**: The full v1 loop is playable: kid logs in, claims daily gold, starts the Cooper demo quest, completes it, and watches an animated celebration screen confirm that their gold went up — all server-authoritative with idempotent claims.
**Depends on**: Phase 2
**Requirements**: ECON-01, ECON-02, ECON-03, ECON-04, ECON-05, ECON-06, QUEST-01, QUEST-02, QUEST-03
**Success Criteria** (what must be TRUE):
  1. Starting the demo quest deducts energy immediately (optimistic) and confirms against Supabase
  2. Completing the demo quest awards exactly 50 Gold via `awardLoot()` — triggering a Framer Motion celebration screen with a particle burst
  3. Gold balance animates up with a slot-machine count-up (~800ms) after any award; if the Server Action fails the displayed balance reverts to the last confirmed value
  4. Claiming the same quest reward twice (rapid double-tap or page reload) results in only one ledger entry — no duplicate gold granted
  5. Select agent → start quest → complete quest → see gold go up is fully observable in one uninterrupted flow
**Plans**: TBD

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
| 1. Auth Foundation | 0/TBD | Not started | - |
| 2. Dashboard Shell | 0/TBD | Not started | - |
| 3. Reward Loop | 0/TBD | Not started | - |
| 4. Animation Polish | 0/TBD | Not started | - |
