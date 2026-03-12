# Requirements: Agenty

**Defined:** 2026-03-10
**Core Value:** A kid picks an agent, completes a quest, and watches their gold go up. The reward loop must feel immediate and satisfying.

## v1 Requirements

Requirements for Phase 2 milestone. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: Parent can set up child account via magic link sent to parent's email
- [x] **AUTH-02**: PKCE callback route handler exchanges code for session and sets cookie
- [x] **AUTH-03**: Profile row is upserted in `profiles` table on first login (not reliant on DB trigger alone)
- [x] **AUTH-04**: Kid can log in daily with a 6-digit PIN (mapped to `signInWithPassword`)
- [x] **AUTH-05**: PIN input locks after 5 failed attempts per 15-minute window
- [x] **AUTH-06**: Auth middleware protects `/bridge` routes, redirects unauthenticated users to login

### The Bridge Dashboard

- [x] **DASH-01**: Agent selection (Cooper, Arlo, Minh, Maya) is the primary landing experience on The Bridge
- [x] **DASH-02**: Player stats (gold, XP, energy) are fetched from Supabase via Server Component layout, not hardcoded
- [x] **DASH-03**: EconomyContext hydrates from server-fetched data — no client-side loading waterfall
- [x] **DASH-04**: Daily reward claim button wired to `awardLoot()` Server Action
- [x] **DASH-05**: Quest start button wired to `spendEnergy()` Server Action
- [x] **DASH-06**: Agent selection persists across page navigations within the session

### Economy & Reward Loop

- [x] **ECON-01**: Completing the demo quest triggers `awardLoot()` granting 50 Gold (server-authoritative amount)
- [x] **ECON-02**: Starting the demo quest triggers `spendEnergy()` to deduct energy
- [x] **ECON-03**: Reward claims are idempotent — no double-claiming on the same quest completion
- [x] **ECON-04**: Gold balance animates with a slot-machine style count-up (~800ms) after award
- [x] **ECON-05**: Quest completion triggers a Framer Motion celebration screen (particle burst / confetti)
- [x] **ECON-06**: Optimistic UI update — gold count-up fires immediately, syncs with server response

> Note: XP award from completeMission() is cosmetic (client-side only). XP persistence to profiles table is deferred — see TODO at src/lib/actions/missions.ts:232.

### Demo Quest

- [x] **QUEST-01**: "Daily Check-in" or "Dummy Trivia Challenge" is available, hosted by Coach Cooper
  (Satisfied by DailyClaim daily reward button on The Bridge)
- [x] **QUEST-02**: Quest has a simple interaction (answer trivial question or click "check in")
  (Satisfied by DailyClaim single-click check-in interaction)
- [x] **QUEST-03**: Completing the quest visually proves the full loop: select agent → start quest → complete → see gold go up

### UI & Polish

- [x] **UI-01**: Adventure Navy (#050B14) dark theme with chunky 2px borders and deep shadows throughout
- [x] **UI-02**: Agent-specific neon accent glows (Cooper: Blue, Arlo: Orange, Minh: Green, Maya: Violet)
- [x] **UI-03**: Framer Motion page transitions and component mount animations
- [x] **UI-04**: All interactive elements sized for iPad touch targets (min 44x44px)
- [x] **UI-05**: Subtle haptic-style visual feedback on tap (scale bounce / glow pulse via Framer Motion)
- [x] **UI-06**: `'use client'` directive on every file importing `motion/react` (App Router requirement)

## v2 Requirements

### Progression

- **PROG-01**: XP bar fills and triggers level-up animation
- **PROG-02**: Daily streak counter with streak-break warning
- **PROG-03**: Recent loot log showing history of earned rewards

### Content

- **CONT-01**: Multiple quests per agent with varying difficulty
- **CONT-02**: Subject-specific quest content per agent domain
- **CONT-03**: Quest progression system (unlock harder quests)

### Parent Features

- **PARENT-01**: Parent dashboard showing child's activity
- **PARENT-02**: Parent can reset child's PIN
- **PARENT-03**: Parent can set daily time/energy limits

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rebuilding Supabase schema or RPCs | Already complete — `economy_rpcs.sql` is locked |
| Rebuilding Server Actions (`economy.ts`, `admin.ts`) | Already complete — build on top of them |
| OAuth providers (Google, GitHub, etc.) | PIN + magic link is sufficient for a kid |
| Full curriculum / real learning content | Future phase — demo quest proves the loop |
| Multiple quests or quest progression | Future phase — one demo quest for now |
| Parent dashboard | Future phase |
| Mobile native app | Web-first |
| Real-time multiplayer / social features | Single-player product |
| Leaderboards | Anti-feature for single-user kid product (creates shame) |
| FOMO countdown timers | Anti-feature — documented dark pattern for children's apps |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Complete |
| DASH-01 | Phase 2 | Complete |
| DASH-02 | Phase 2 | Complete |
| DASH-03 | Phase 2 | Complete |
| DASH-04 | Phase 2 | Complete |
| DASH-05 | Phase 2 | Complete |
| DASH-06 | Phase 2 | Complete |
| ECON-01 | Phase 3 | Complete |
| ECON-02 | Phase 3 | Complete |
| ECON-03 | Phase 3 | Complete |
| ECON-04 | Phase 3 | Complete |
| ECON-05 | Phase 3 | Complete |
| ECON-06 | Phase 3 | Complete |
| QUEST-01 | Phase 3 | Complete |
| QUEST-02 | Phase 3 | Complete |
| QUEST-03 | Phase 3 | Complete |
| UI-01 | Phase 2 | Complete |
| UI-02 | Phase 2 | Complete |
| UI-03 | Phase 4 | Complete |
| UI-04 | Phase 4 | Complete |
| UI-05 | Phase 4 | Complete |
| UI-06 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-12 after Phase 4 Animation Polish — UI-03, UI-04, UI-05 marked complete. All v1 requirements satisfied.*
