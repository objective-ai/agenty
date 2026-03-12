# Phase 3: Expanded Reward Loop - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning
**Source:** Plan file (ticklish-watching-snowglobe.md) — derived from user discussion

<domain>
## Phase Boundary

Phase 3 expands the original "Reward Loop" scope to include 5 workstreams:
- **3a: Kill the Mocks** — Wire XPProgress, DailyStreak, StatsBar, RecentLoot to live Supabase data
- **3b: Rank Map** — Level-to-title lookup (Technical Scout → Agenty Commander)
- **3c: Shields Mechanic** — Wrong answers drain shields, "Damaged Mode" at 0% with 50% reward penalty
- **3d: Command Deck Upgrades** — 4 new generation inputs (problem count, difficulty, narrative theme, time estimate)
- **3e: AI Mission Banners** — Gemini Nano Banana 2 image generation per mission

This phase does NOT include campaigns/operations (deferred to future phases).

</domain>

<decisions>
## Implementation Decisions

### Live Data Wiring (3a)
- EconomyContext gets `setXp`, `setLevel`, `setStreakDays` setters + `refreshProfile()` method
- BridgeLayout adds `streak_days` to Supabase `.select()` call
- New Server Actions: `getProfile()`, `getRecentLoot(limit=10)`, `claimDaily()`
- `claimDaily()` uses quest_id format `"daily_claim_YYYY-MM-DD"` for idempotency
- XP_PER_LEVEL = 500. Level computed as `Math.floor(xp / 500) + 1`
- DailyClaim replaces direct `awardLoot(25, "daily_bonus")` with `claimDaily()` Server Action

### Rank Map (3b)
- 4 rank tiers: Level 1-5 "Technical Scout", 6-10 "Field Engineer", 11-15 "Tactical Architect", 16+ "Agenty Commander"
- New file `src/lib/ranks.ts` with pure function `getRankTitle(level)`
- Displayed in XPProgress (replace "Apprentice Explorer") and StatsBar

### Shields Mechanic (3c)
- Shields = 0-100 percentage, starts at 100, -10% per wrong answer
- At 0%: "Damaged Mode" — subtle red-shift CSS flicker (accessibility-safe), Cooper text italic with "[SIGNAL DEGRADED]" prefix, 50% reward penalty
- NOT a mission failure — mission always completes
- New `reportWrongAnswer` tool in chat API (static tool with `execute: async () => ({ ok: true })`)
- CommsPanel intercepts `tool-reportWrongAnswer`, calls `spendEnergy(10, "shield_damage")`, dispatches `SHIELD_HIT`
- MissionReducer gets `shields`, `isDamaged` state + `SHIELD_HIT`, `SET_SHIELDS` actions
- MissionCompleteOverlay accepts `isDamaged` prop, halves reward amounts

### Command Deck Upgrades (3d)
- 4 new inputs: Problem Count (3/5/10), Difficulty (Easy/Medium/Hard), Narrative Theme (Space/Nature/History/Fantasy), Time Estimate (Short 10min/Medium 20min/Long 30min)
- DB migration adds 4 columns to `missions` table with defaults
- Validator relaxes zone coverage: allow zone reuse when problemCount > zones, partial coverage when problemCount < zones
- System prompt injection: difficulty adjusts goalValue ranges, theme adds narrative flavor, problemCount sets target stat count

### AI Mission Banners (3e)
- Google Gemini Nano Banana 2 for image generation (user's explicit choice)
- One banner image per mission, generated during creation flow
- Store in Supabase Storage `mission-banners` bucket (public read)
- Non-blocking: if banner gen fails, mission saves without banner (no error)
- Display on MissionPreview, MissionList (48px thumbnail), MissionBriefingBoard

### Claude's Discretion
- Exact CSS keyframe implementation for shield-flicker animation
- Specific Gemini API configuration and prompt engineering
- RecentLoot row-to-component mapping details
- Form layout/styling for new Command Deck inputs (must follow Adventure Navy aesthetic)

</decisions>

<specifics>
## Specific Ideas

- Shield bar: horizontal, blue gradient when healthy, transitions to red at <30%, flickers at 0%
- Damaged Mode CSS: `filter: hue-rotate(...)` to shift Adventure Navy toward red + `@keyframes shield-flicker` pulsing every 2s
- Cooper's degraded text: `font-style: italic` + "[SIGNAL DEGRADED]" prefix (visual only, no AI prompt change)
- MissionCompleteOverlay in damaged mode: strikethrough on original rewards + "50% SIGNAL PENALTY" label
- Daily claim amount: 25 gold (hardcoded server-side, client does NOT supply amount)
- Banner prompt template: "Dramatic cinematic illustration for a children's educational mission titled '{title}' about {topic}, {theme} setting, digital art, dark navy teal palette, no text."

</specifics>

<deferred>
## Deferred Ideas

- Campaign/Operation system (multi-mission narrative arcs) — future phase
- Multi-stage chained problems (Step A feeds Step B) — future phase, prompt engineering only
- Level-up celebration screen — Phase 4 (Animation Polish)
- Energy spend animation feedback — Phase 4
- Agent-specific rank titles — not planned

</deferred>

---

*Phase: 03-expanded-reward-loop*
*Context gathered: 2026-03-11 via Plan File Express Path*
