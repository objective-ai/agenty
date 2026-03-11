# Requirements: Agenty

**Defined:** 2026-03-10
**Core Value:** A kid picks an agent, completes a quest, and watches their gold go up. The reward loop must feel immediate and satisfying.

## v1 Requirements

Requirements for Phase 2 milestone. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: Parent can set up child account via magic link sent to parent's email
- [ ] **AUTH-02**: PKCE callback route handler exchanges code for session and sets cookie
- [ ] **AUTH-03**: Profile row is upserted in `profiles` table on first login (not reliant on DB trigger alone)
- [ ] **AUTH-04**: Kid can log in daily with a 6-digit PIN (mapped to `signInWithPassword`)
- [ ] **AUTH-05**: PIN input locks after 5 failed attempts per 15-minute window
- [ ] **AUTH-06**: Auth middleware protects `/bridge` routes, redirects unauthenticated users to login

### The Bridge Dashboard

- [ ] **DASH-01**: Agent selection (Cooper, Arlo, Minh, Maya) is the primary landing experience on The Bridge
- [ ] **DASH-02**: Player stats (gold, XP, energy) are fetched from Supabase via Server Component layout, not hardcoded
- [ ] **DASH-03**: EconomyContext hydrates from server-fetched data — no client-side loading waterfall
- [ ] **DASH-04**: Daily reward claim button wired to `awardLoot()` Server Action
- [ ] **DASH-05**: Quest start button wired to `spendEnergy()` Server Action
- [ ] **DASH-06**: Agent selection persists across page navigations within the session

### Economy & Reward Loop

- [ ] **ECON-01**: Completing the demo quest triggers `awardLoot()` granting 50 Gold (server-authoritative amount)
- [ ] **ECON-02**: Starting the demo quest triggers `spendEnergy()` to deduct energy
- [ ] **ECON-03**: Reward claims are idempotent — no double-claiming on the same quest completion
- [ ] **ECON-04**: Gold balance animates with a slot-machine style count-up (~800ms) after award
- [ ] **ECON-05**: Quest completion triggers a Framer Motion celebration screen (particle burst / confetti)
- [ ] **ECON-06**: Optimistic UI update — gold count-up fires immediately, syncs with server response

### Demo Quest

- [ ] **QUEST-01**: "Daily Check-in" or "Dummy Trivia Challenge" is available, hosted by Coach Cooper
- [ ] **QUEST-02**: Quest has a simple interaction (answer trivial question or click "check in")
- [ ] **QUEST-03**: Completing the quest visually proves the full loop: select agent → start quest → complete → see gold go up

### UI & Polish

- [ ] **UI-01**: Adventure Navy (#050B14) dark theme with chunky 2px borders and deep shadows throughout
- [ ] **UI-02**: Agent-specific neon accent glows (Cooper: Blue, Arlo: Orange, Minh: Green, Maya: Violet)
- [ ] **UI-03**: Framer Motion page transitions and component mount animations
- [ ] **UI-04**: All interactive elements sized for iPad touch targets (min 44x44px)
- [ ] **UI-05**: Subtle haptic-style visual feedback on tap (scale bounce / glow pulse via Framer Motion)
- [ ] **UI-06**: `'use client'` directive on every file importing `motion/react` (App Router requirement)

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
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| AUTH-05 | — | Pending |
| AUTH-06 | — | Pending |
| DASH-01 | — | Pending |
| DASH-02 | — | Pending |
| DASH-03 | — | Pending |
| DASH-04 | — | Pending |
| DASH-05 | — | Pending |
| DASH-06 | — | Pending |
| ECON-01 | — | Pending |
| ECON-02 | — | Pending |
| ECON-03 | — | Pending |
| ECON-04 | — | Pending |
| ECON-05 | — | Pending |
| ECON-06 | — | Pending |
| QUEST-01 | — | Pending |
| QUEST-02 | — | Pending |
| QUEST-03 | — | Pending |
| UI-01 | — | Pending |
| UI-02 | — | Pending |
| UI-03 | — | Pending |
| UI-04 | — | Pending |
| UI-05 | — | Pending |
| UI-06 | — | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 0
- Unmapped: 27 ⚠️

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after initial definition*
