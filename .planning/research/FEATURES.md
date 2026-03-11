# Feature Research

**Domain:** Gamified kids' learning OS — game-style dashboard, economy, and quest system for a 9-year-old
**Researched:** 2026-03-10
**Confidence:** HIGH (core gamification patterns), MEDIUM (age-specific UX specifics), LOW (single-product companion character retention data)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features the child assumes exist after seeing any game-like learning app. Missing any of these and the product feels broken or "babyish."

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Visible currency balance (Gold) | Every game shows score/currency in the HUD at all times | LOW | Must update animatedly — static number feels dead. Backend RPC exists. |
| XP bar with level progress | RPG literacy is near-universal at age 9; kids know XP bars | LOW | Should show current level, XP to next level. Framer Motion fill animation on change. |
| Daily streak indicator | Duolingo, Prodigy, and every mobile game uses streaks; kids expect them | LOW | Flame icon + day count. Loss aversion keeps retention up 2.3x after 7-day streak. |
| Quest / task cards | "What do I do?" — kids need clear, bounded missions | MEDIUM | Must show quest name, energy cost, reward preview, and host agent. |
| Agent companion presence | Character-driven apps outperform blank dashboards for under-12s | MEDIUM | Agent must be visible on the main screen with a distinct color identity. Not just a logo. |
| Animated reward feedback | Prodigy, Duolingo, and Habitica all use confetti/sound/counter animation; kids expect dopamine hits | MEDIUM | Gold counter must visibly count up. Quest completion needs a celebration state. |
| Daily reward claim | Login bonus is table stakes in every mobile game aimed at kids | LOW | One-tap "Claim Daily Gold" button. Disable after claimed; reset at midnight. |
| Energy system display | Prodigy's energy-for-actions model is familiar to Minecraft/Roblox players | LOW | Show current energy / max energy. Spend on quests, replenish over time or on login. |
| Safe, frictionless login | Kids cannot manage passwords; PIN or equivalent is the norm | MEDIUM | 4-digit PIN for daily login. Magic link via parent email for setup/recovery only. |
| Player profile / stats page | "My character" is expected in any RPG-flavored app | LOW | Shows avatar/agent, name, gold, XP, level, streak. No social profile needed. |
| Clear quest completion state | Kids need unambiguous "you won" feedback — ambiguity kills motivation | LOW | Full-screen or modal overlay. Shows loot awarded. Return-to-dashboard CTA. |

### Differentiators (Competitive Advantage)

Features that make Agenty feel like a premium, bespoke adventure rather than a template edtech app.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Agent selection as the primary landing ritual | Prodigy and Duolingo have one mascot; Agenty lets the kid choose their companion, making the relationship feel personal | HIGH | Four agents (Cooper/Arlo/Minh/Maya) each with unique neon color, personality, and subject domain. The Bridge dashboard must be built around this selection. |
| Agent-tinted UI (neon accent glows per agent) | Most apps have one color scheme; Agenty's UI changes personality based on chosen agent | MEDIUM | CSS `[data-agent]` selectors already exist. The entire dashboard's glow, border accent, and button color shifts. |
| AAA game feel (dark theme, chunky borders, deep shadows) | Edtech dashboards look like corporate SaaS; kids aged 9+ find them embarrassing. Agenty looks like a game menu | MEDIUM | Adventure Navy (#050B14) base, 2px chunky borders, deep shadows, neon glows. No default component libraries. |
| Loot narrative framing ("you earned 50 Gold") | Most apps say "+50 points"; Agenty frames rewards as loot drops, embedding the RPG metaphor consistently | LOW | Language and copy matter. "Quest Complete — Coach Cooper awards you 50 Gold" not "Score +50". |
| Dual-loop economy (daily claim + quest rewards) | Small loop = daily reward; large loop = quest completion loot. Dual loops create both daily retention AND session depth | MEDIUM | Daily claim (small, always available) + quest reward (larger, requires effort). Prodigy uses this; most edtech does not. |
| Animated gold counter (count-up on reward) | Most apps flash "+X"; a visible count-up makes the reward feel earned and satisfying | LOW | Framer Motion number animation. Target: ~800ms count-up on gold increase. |
| Energy as the "fuel for adventure" mechanic | Energy systems give kids a reason to return (energy replenishes) and create scarcity that makes quests feel valuable | MEDIUM | Spend energy to start a quest. Energy shown in HUD. Replenish on daily login or over time. |
| Quest hosted by a specific agent | Duolingo's Duo is generic. In Agenty, the quest is literally run by Cooper/Arlo/Minh/Maya, deepening the companion bond | LOW | Quest card and completion screen show the host agent's avatar and color. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem appealing but would hurt the product, increase scope, or create ethical/technical problems for this specific user.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Leaderboards / social comparison | "Kids love competition" — true in some contexts | At age 9, social humiliation risk is high. Leaderboards in single-player learning apps create shame for struggling kids, documented in dark pattern research. This is a single-user product; leaderboards have no peers to compare against anyway. | Personal bests only — "Your best streak: 7 days." Self-competition, not social competition. |
| FOMO timers / countdown urgency | Increases short-term engagement metrics | Exploits anxiety in children; classified as a dark pattern in the FairPlay for Kids research. Builds negative association with the app over time. | Gentle "come back tomorrow" framing with streak preservation incentive instead. |
| In-app purchases / premium currency | Monetization path | Ethically inappropriate for a single-kid home tool. Adds IAP complexity, store submission requirements, parental consent flows. Not the product goal. | All content unlocked by learning progress. Gold is earned by doing quests, not bought. |
| Real-time notifications / push alerts | "Reminds kids to learn" | For a 9-year-old, push notifications require parent management, can create anxiety, and are outside the Next.js web-app model anyway. | Daily streak visibility on dashboard, parent-controlled session scheduling in a future phase. |
| Social feed / activity sharing | "Kids like to show off" | Requires moderation infrastructure, COPPA compliance complications, PII risk for minors. Enormous scope increase for zero validated need in a single-user product. | Quest completion celebration screen is the sharing moment — no external audience needed. |
| Adaptive difficulty AI (per-session) | "Personalized learning" | At this milestone, there is no real curriculum content yet — it's a demo quest. Building adaptive AI before content exists is premature optimization. | Static difficulty for demo quest. Flag for v2+ when real quests exist. |
| Offline mode | "Works without internet" | Supabase backend economy requires server validation. Offline loot claims create sync conflicts and bypass the Loot Guard security model. | Fast loading states + skeleton screens give the feel of responsiveness without the complexity. |
| Password recovery for the kid | "What if they forget?" | Kids cannot manage email; a child-controlled password recovery flow is a security antipattern. | PIN reset via parent magic link — the parent flow already handles recovery. |
| Multiple agent use in one session | "Switch agents mid-quest" | Agent context is the UI theme system. Switching mid-session breaks color theming state and complicates the quest-host relationship. | Agent selection locked for the session. Can change on next login / next Bridge visit. |

---

## Feature Dependencies

```
[PIN Auth] ──creates──> [Profile Row in Supabase]
    └──requires──> [Magic Link Setup (parent)]

[Profile Row]
    └──enables──> [Gold Balance Display]
    └──enables──> [XP Bar / Level Display]
    └──enables──> [Energy Display]
    └──enables──> [Streak Counter]

[Agent Selection (The Bridge)]
    └──requires──> [Profile Row]
    └──sets──> [Agent Context / UI Theme]
    └──enables──> [Quest Card (host-specific)]

[Daily Reward Claim Button]
    └──requires──> [Profile Row]
    └──calls──> [awardLoot() Server Action] (exists)
    └──triggers──> [Animated Gold Counter]

[Quest Card]
    └──requires──> [Energy Display]
    └──requires──> [Agent Selection]
    └──calls──> [spendEnergy() Server Action] (exists) on Start
    └──calls──> [awardLoot() Server Action] (exists) on Complete
    └──triggers──> [Quest Completion Celebration Screen]

[Quest Completion Celebration Screen]
    └──requires──> [Animated Gold Counter]
    └──requires──> [Agent Context] (agent shown in celebration)
    └──updates──> [XP Bar / Level Display]
    └──updates──> [Streak Counter]

[Animated Gold Counter] ──enhances──> [Daily Reward Claim Button]
[Animated Gold Counter] ──enhances──> [Quest Completion Celebration Screen]

[Magic Link Setup] ──conflicts──> [PIN Auth] (they are sequential, not concurrent — setup first, PIN daily after)
```

### Dependency Notes

- **Profile Row requires Auth:** No Supabase profile = no economy data. Auth must come before any dashboard feature.
- **Agent Selection gates UI Theme:** The `[data-agent]` CSS attribute must be set before rendering the dashboard; rendering first and selecting later causes flash-of-wrong-theme.
- **awardLoot / spendEnergy already exist:** These Server Actions are complete. Dashboard features wire up to them — do not rebuild them.
- **Animated Gold Counter is a shared primitive:** Both the Daily Reward Claim and Quest Completion use the same count-up animation component. Build once, reuse.
- **Quest requires energy AND agent selection:** A quest card without a selected agent has no host identity. Energy check must happen server-side to prevent UI bypasses.

---

## MVP Definition

### Launch With (v1) — This Milestone

Minimum set to validate the full reward loop: login → choose agent → claim daily reward → do demo quest → watch gold go up.

- [ ] PIN auth flow — kid types 4-digit PIN, lands on The Bridge
- [ ] Magic link setup — parent receives email, creates profile on first login
- [ ] Profile creation on first login — inserts row in `profiles` table
- [ ] The Bridge dashboard — agent selection as primary landing UI, agent-tinted theme
- [ ] Live gold / XP / energy stats pulled from Supabase (not hardcoded)
- [ ] Daily reward claim button wired to `awardLoot()` — disabled after claim
- [ ] Animated gold counter — counts up visually after any loot award
- [ ] Quest card for "Daily Check-in" hosted by Coach Cooper
- [ ] Energy spend on quest start wired to `spendEnergy()`
- [ ] Quest completion triggers `awardLoot()` for 50 Gold
- [ ] Quest completion celebration screen with Cooper's agent branding
- [ ] Streak counter display (read-only for now; increment logic in v1.x)
- [ ] Adventure Navy dark theme with agent neon glows (design system exists, needs wiring)
- [ ] Framer Motion animations on quest completion, loot award, and UI transitions

### Add After Validation (v1.x)

Features to add once the reward loop is confirmed working and the child is using the app daily.

- [ ] Streak increment logic — server-side increment on daily login, reset on miss
- [ ] Streak protection / "freeze" mechanic — if engagement drops add one grace day
- [ ] Second demo quest (Arlo / Minh / Maya hosts) — validates multi-agent quest flow
- [ ] XP level-up celebration — separate from loot award, triggers when level threshold crossed
- [ ] Energy replenishment timer — show countdown to next energy tick
- [ ] Quest history / recent loot log — read from `loot_ledger` table (schema exists)

### Future Consideration (v2+)

Defer until real learning content exists and child engagement patterns are validated.

- [ ] Real curriculum quests (math, reading, etc.) — requires content design, not just UI
- [ ] Adaptive difficulty — premature without real quest library
- [ ] Parent dashboard — monitor progress, set energy limits, assign quests
- [ ] Loot shop — spend Gold on cosmetic avatar unlocks
- [ ] Multiple concurrent agents / agent switching between sessions
- [ ] Achievement badges system — requires badge taxonomy, not just display

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| PIN auth + profile creation | HIGH | MEDIUM | P1 |
| The Bridge — agent selection + themed dashboard | HIGH | HIGH | P1 |
| Live economy stats (gold/XP/energy) | HIGH | LOW | P1 |
| Daily reward claim → animated gold counter | HIGH | LOW | P1 |
| Demo quest card + spendEnergy + awardLoot wiring | HIGH | MEDIUM | P1 |
| Quest completion celebration screen | HIGH | MEDIUM | P1 |
| Framer Motion transitions (quest, loot, UI) | MEDIUM | MEDIUM | P1 — reward feel depends on it |
| Streak counter display | MEDIUM | LOW | P1 — table stakes |
| Magic link parent setup | HIGH | MEDIUM | P1 — required for first login |
| XP level-up celebration | MEDIUM | MEDIUM | P2 |
| Streak increment server logic | MEDIUM | LOW | P2 |
| Energy replenish timer | LOW | LOW | P2 |
| Quest history / loot log | LOW | LOW | P2 |
| Real curriculum quests | HIGH | HIGH | P3 |
| Parent dashboard | MEDIUM | HIGH | P3 |
| Loot shop / cosmetics | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, add after core loop validated
- P3: Future milestone — do not scope now

---

## Competitor Feature Analysis

| Feature | Duolingo (kids-facing) | Prodigy Math | Khan Academy | Agenty Approach |
|---------|----------------------|--------------|--------------|-----------------|
| Currency | Lingots (gems) | Game-world coins | Energy points | Gold — RPG-framed, visible in HUD always |
| Mascot / companion | Duo the owl (single, fixed) | Player character (created) | Khanmigo (AI tutor, adult-facing) | 4 agents, kid picks one — personal relationship |
| Daily habit mechanic | Streak with notification | Daily quests | Mastery goals | Daily reward claim + streak display |
| UI aesthetic | Corporate-bright, SaaS-clean | Colorful fantasy but dated | Very clean / educational | AAA dark game menu — Adventure Navy, neon glows |
| Quest / mission framing | "Lesson" | "Battle" with math | "Exercise" | "Quest" hosted by a named agent |
| Reward animation | Hearts, XP pop, confetti | Battle win animation | Badge pop | Animated gold counter + celebration screen |
| Auth model | Password / SSO | Teacher-assigned / parent | Google / parent | 4-digit PIN (kid) + magic link (parent setup) |
| Energy system | Lives (hearts) — lose on error | Energy earned by answering | None | Energy spent to start quests, replenished daily |

---

## Sources

- [Gamification in EdTech — Duolingo, Khan Academy, IXL, Kahoot (Prodwrks)](https://prodwrks.com/gamification-in-edtech-lessons-from-duolingo-khan-academy-ixl-and-kahoot/)
- [What is Prodigy Math? Pets, Quests and More (Prodigy Blog)](https://www.prodigygame.com/main-en/blog/what-is-prodigy-math-game)
- [UX Design for Kids: The Ultimate Guide (Gapsy)](https://gapsystudio.com/blog/ux-design-for-kids/)
- [Top 10 UI/UX Design Tips for Child-Friendly Interfaces (AufaitUX)](https://www.aufaitux.com/blog/ui-ux-designing-for-children/)
- [Streaks and Milestones for Gamification in Mobile Apps (Plotline)](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)
- [Dark Patterns of Cuteness: Popular Learning App Design as a Risk to Children's Autonomy (ResearchGate)](https://www.researchgate.net/publication/378448656_Dark_Patterns_of_Cuteness_Popular_Learning_App_Design_as_a_Risk_to_Children's_Autonomy)
- [Dark Patterns in Children's Games — FairPlay for Kids (PDF)](https://fairplayforkids.org/wp-content/uploads/2021/05/darkpatterns.pdf)
- [How Streaks Leverages Gamification to Boost Retention — Trophy.so](https://trophy.so/blog/streaks-gamification-case-study)
- [Kids Mobile Games 2025: Playbook for Growth — CAS.AI](https://cas.ai/2025/10/15/kids-mobile-games-2025-how-to-win-tough-developer-challenges/)
- [Educational Agents: Definitions, Features, Roles — Science Insights Education Frontiers](https://bonoi.org/index.php/sief/article/view/1590)
- [Gamification in Product Design 2025 — Arounda Agency](https://arounda.agency/blog/gamification-in-product-design-in-2024-ui-ux)

---
*Feature research for: Agenty — gamified learning OS, 9-year-old single user*
*Researched: 2026-03-10*
