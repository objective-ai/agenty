# Phase 3: Expanded Reward Loop - Research

**Researched:** 2026-03-11
**Domain:** Supabase live data wiring, game mechanics (shields/ranks), Gemini image generation, AI SDK v6 tool expansion
**Confidence:** HIGH

## Summary

Phase 3 has five workstreams across two categories: (1) wiring existing mock components to live Supabase data and adding game mechanics (3a-3c), and (2) expanding the mission generation system (3d-3e). The codebase is well-structured for this work -- EconomyContext already has `setGold`/`setEnergy` and BridgeLayout already fetches profile data. The main gaps are: EconomyContext lacks `setXp`/`setLevel`/`setStreakDays` setters and `refreshProfile()`, components use hardcoded values, the missionReducer has no shields state, and there is no Gemini integration.

The Gemini image generation API uses `@google/genai` package with `generateContent()` on model `"gemini-3.1-flash-image-preview"` (Nano Banana 2). Images return as base64 inline data, stored to Supabase Storage. The existing `awardLoot()` already accepts `amount` as a parameter (contrary to the concern in STATE.md), but `claimDaily()` will hardcode 25 server-side. The `loot_ledger` already has a unique index on `quest_id` via `idx_loot_ledger_quest_unique`.

**Primary recommendation:** Build bottom-up: Server Actions and DB migrations first, then EconomyContext expansion, then component wiring, then shields mechanic, then Command Deck inputs, and finally Gemini banners (most independent workstream).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- EconomyContext gets `setXp`, `setLevel`, `setStreakDays` setters + `refreshProfile()` method
- BridgeLayout adds `streak_days` to Supabase `.select()` call
- New Server Actions: `getProfile()`, `getRecentLoot(limit=10)`, `claimDaily()`
- `claimDaily()` uses quest_id format `"daily_claim_YYYY-MM-DD"` for idempotency
- XP_PER_LEVEL = 500. Level computed as `Math.floor(xp / 500) + 1`
- DailyClaim replaces direct `awardLoot(25, "daily_bonus")` with `claimDaily()` Server Action
- 4 rank tiers: Level 1-5 "Technical Scout", 6-10 "Field Engineer", 11-15 "Tactical Architect", 16+ "Agenty Commander"
- New file `src/lib/ranks.ts` with pure function `getRankTitle(level)`
- Displayed in XPProgress (replace "Apprentice Explorer") and StatsBar
- Shields = 0-100 percentage, starts at 100, -10% per wrong answer
- At 0%: "Damaged Mode" -- subtle red-shift CSS flicker (accessibility-safe), Cooper text italic with "[SIGNAL DEGRADED]" prefix, 50% reward penalty
- NOT a mission failure -- mission always completes
- New `reportWrongAnswer` tool in chat API (static tool with `execute: async () => ({ ok: true })`)
- CommsPanel intercepts `tool-reportWrongAnswer`, calls `spendEnergy(10, "shield_damage")`, dispatches `SHIELD_HIT`
- MissionReducer gets `shields`, `isDamaged` state + `SHIELD_HIT`, `SET_SHIELDS` actions
- MissionCompleteOverlay accepts `isDamaged` prop, halves reward amounts
- 4 new inputs: Problem Count (3/5/10), Difficulty (Easy/Medium/Hard), Narrative Theme (Space/Nature/History/Fantasy), Time Estimate (Short 10min/Medium 20min/Long 30min)
- DB migration adds 4 columns to `missions` table with defaults
- Validator relaxes zone coverage: allow zone reuse when problemCount > zones, partial coverage when problemCount < zones
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

### Deferred Ideas (OUT OF SCOPE)
- Campaign/Operation system (multi-mission narrative arcs) -- future phase
- Multi-stage chained problems (Step A feeds Step B) -- future phase, prompt engineering only
- Level-up celebration screen -- Phase 4 (Animation Polish)
- Energy spend animation feedback -- Phase 4
- Agent-specific rank titles -- not planned

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ECON-01 | Completing demo quest triggers `awardLoot()` granting 50 Gold (server-authoritative amount) | MissionCompleteOverlay already calls `awardLoot(config.goldReward, ...)` -- works. Shields mechanic adds `isDamaged` halving. |
| ECON-02 | Starting demo quest triggers `spendEnergy()` to deduct energy | `spendEnergy()` RPC exists. Wire into mission start flow (MissionModeShell mount or lab page). |
| ECON-03 | Reward claims are idempotent -- no double-claiming | `idx_loot_ledger_quest_unique` already enforces this at DB level. `claimDaily()` uses `"daily_claim_YYYY-MM-DD"` quest_id. |
| ECON-04 | Gold balance animates with slot-machine style count-up (~800ms) | EconomyContext `setGold` triggers re-render; AnimatedNumber component needed or inline animation. |
| ECON-05 | Quest completion triggers Framer Motion celebration screen | MissionCompleteOverlay exists with animations. Add `isDamaged` mode for reduced rewards display. |
| ECON-06 | Optimistic UI update -- gold count-up fires immediately | EconomyContext `setGold` fires before server resolves. Pattern already used in DailyClaim. |
| QUEST-01 | Daily Check-in available, hosted by Coach Cooper | `claimDaily()` Server Action + DailyClaim component wiring. Already partially built. |
| QUEST-02 | Quest has simple interaction (answer question or click "check in") | DailyClaim button already exists. Wire to `claimDaily()` instead of direct `awardLoot()`. |
| QUEST-03 | Completing quest visually proves full loop: agent -> start -> complete -> gold up | Live data wiring (3a) + shields (3c) + overlay fixes complete this end-to-end. |

</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.99.0 | DB queries, Storage uploads | Already in use, handles all data ops |
| `ai` (AI SDK v6) | ^6.0.116 | Tool definitions for `reportWrongAnswer` | Already in use for `updateStat` tool |
| `@ai-sdk/anthropic` | ^3.0.58 | Mission generation via `generateObject` | Already in use |
| `motion` | ^12.35.2 | Celebration animations, AnimatePresence | Already in use (import from `motion/react`) |
| `react` | 19.2.3 | Context, useReducer, useTransition | Already in use |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@google/genai` | latest | Gemini Nano Banana 2 image generation | Workstream 3e only -- banner generation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@google/genai` | Replicate / DALL-E | User explicitly chose Gemini Nano Banana 2 -- locked decision |
| Supabase Storage | Cloudinary / S3 | Supabase already in stack, public bucket is simplest |

**Installation:**
```bash
npm install @google/genai
```

## Architecture Patterns

### Recommended Project Structure (new/modified files)
```
src/
  lib/
    ranks.ts                    # NEW: getRankTitle(level) pure function
    actions/
      economy.ts                # MODIFY: add getProfile(), getRecentLoot(), claimDaily()
      missions.ts               # MODIFY: add banner_url to MissionRow/MissionInsertData
    missions/
      missionReducer.ts         # MODIFY: add shields, isDamaged, SHIELD_HIT, SET_SHIELDS
      validator.ts              # MODIFY: relax zone coverage for problemCount != zones
  contexts/
    EconomyContext.tsx           # MODIFY: add setXp, setLevel, setStreakDays, refreshProfile()
  components/
    XPProgress.tsx              # MODIFY: wire to useEconomy + getRankTitle
    DailyStreak.tsx             # MODIFY: wire to useEconomy streakDays
    StatsBar.tsx                # MODIFY: wire to useEconomy + getRankTitle
    RecentLoot.tsx              # MODIFY: wire to getRecentLoot Server Action
    DailyClaim.tsx              # MODIFY: switch to claimDaily()
    MissionCompleteOverlay.tsx  # MODIFY: isDamaged prop, halved rewards
    MissionModeShell.tsx        # MODIFY: pass shields/isDamaged state
    CommsPanel.tsx              # MODIFY: intercept tool-reportWrongAnswer
    MissionGeneratorForm.tsx    # MODIFY: add 4 new inputs
    CommandDeckShell.tsx        # MODIFY: pass new fields through generation flow
    MissionPreview.tsx          # MODIFY: display banner image
    MissionList.tsx             # MODIFY: display banner thumbnail
    MissionBriefingBoard.tsx    # MODIFY: display banner + shield bar
  app/
    api/
      chat/route.ts             # MODIFY: add reportWrongAnswer tool
      generate-mission/route.ts # MODIFY: pass new fields, call Gemini for banner
    bridge/
      layout.tsx                # MODIFY: add streak_days to select
supabase/
  migrations/
    20260313000000_phase3_*.sql  # NEW: add columns to missions, create storage bucket
```

### Pattern 1: Server Action for Daily Claim
**What:** New `claimDaily()` action that hardcodes the 25 gold amount server-side
**When to use:** Replacing client-supplied amount in DailyClaim component
**Example:**
```typescript
// src/lib/actions/economy.ts
export async function claimDaily(): Promise<ActionResult<AwardLootResult>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const questId = `daily_claim_${today}`;

  // Amount is server-side constant -- Loot Guard
  return awardLoot(25, "daily_bonus", questId);
}
```

### Pattern 2: Shields in MissionReducer
**What:** Add `shields` (0-100) and `isDamaged` (boolean) to MissionState
**When to use:** Tracking wrong answers during missions
**Example:**
```typescript
// Added to MissionState
shields: number;     // 0-100, starts at 100
isDamaged: boolean;  // true when shields === 0

// New action types
| { type: "SHIELD_HIT" }
| { type: "SET_SHIELDS"; payload: { shields: number } }

// Reducer case
case "SHIELD_HIT": {
  const newShields = Math.max(0, state.shields - 10);
  return {
    ...state,
    shields: newShields,
    isDamaged: newShields === 0,
  };
}
```

### Pattern 3: reportWrongAnswer Tool (AI SDK v6 Static Tool)
**What:** New tool in `/api/chat` for Mission Mode -- reports wrong answers
**When to use:** When student gives incorrect answer during mission
**Example:**
```typescript
// In /api/chat/route.ts, alongside updateStat
reportWrongAnswer: tool({
  description: "Report that the student gave a wrong answer. This drains their shields.",
  inputSchema: z.object({
    statId: z.string().describe("The stat the student was trying to solve."),
    wrongValue: z.number().describe("The incorrect value the student provided."),
  }),
  execute: async () => ({ ok: true }), // Static tool -- must have execute
}),
```

### Pattern 4: Gemini Image Generation (Non-blocking)
**What:** Generate banner image during mission creation, store to Supabase Storage
**When to use:** After mission config is validated, before returning response
**Example:**
```typescript
// Server-side only
import { GoogleGenAI } from "@google/genai";

async function generateBanner(title: string, topic: string, theme: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null; // Graceful degradation

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: `Dramatic cinematic illustration for a children's educational mission titled '${title}' about ${topic}, ${theme} setting, digital art, dark navy teal palette, no text.`,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "16:9" },
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: unknown }) => p.inlineData
    );
    if (!imagePart?.inlineData?.data) return null;

    // Upload to Supabase Storage
    const buffer = Buffer.from(imagePart.inlineData.data, "base64");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    const { error } = await supabaseAdmin.storage
      .from("mission-banners")
      .upload(filename, buffer, { contentType: "image/png", upsert: false });

    if (error) return null;

    const { data: urlData } = supabaseAdmin.storage
      .from("mission-banners")
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch {
    return null; // Non-blocking -- mission saves without banner
  }
}
```

### Pattern 5: EconomyContext Expansion
**What:** Add setXp, setLevel, setStreakDays setters + refreshProfile() method
**When to use:** After any economy mutation that changes XP/level/streak
**Example:**
```typescript
// EconomyContext.tsx additions
interface EconomyContextValue extends EconomyState {
  setGold: (v: number) => void;
  setEnergy: (v: number) => void;
  setXp: (v: number) => void;
  setLevel: (v: number) => void;
  setStreakDays: (v: number) => void;
  refreshProfile: () => Promise<void>;
}

// refreshProfile fetches latest from Supabase and updates all state
async function refreshProfile() {
  const result = await getProfile();
  if (result.success) {
    setGold(result.data.gold);
    setXp(result.data.xp);
    setLevel(result.data.level);
    setEnergy(result.data.energy);
    setStreakDays(result.data.streak_days);
  }
}
```

### Anti-Patterns to Avoid
- **Client-supplied gold amounts:** Never pass reward amounts from client. `claimDaily()` hardcodes 25 server-side.
- **Coupling UI to tool calls for state transitions:** Shields drain via `SHIELD_HIT` dispatch from CommsPanel tool interception, NOT by waiting for AI to decide.
- **Blocking on banner generation:** If Gemini fails, mission still saves. Never let banner gen prevent mission creation.
- **Forgetting tool deduplication:** CommsPanel fires effects multiple times per message state change. Always deduplicate on `toolCallId`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotent daily claims | Custom lock/flag system | `quest_id` unique index on `loot_ledger` | DB-level uniqueness is race-condition-proof |
| Image storage + CDN | File system / custom upload | Supabase Storage public bucket | Built-in CDN, already in stack |
| Date formatting for quest_id | Manual date string building | `new Date().toISOString().slice(0, 10)` | Standard ISO format, timezone-safe on server |
| Gold animation | Custom setInterval counter | Framer Motion `animate` or CSS `@property` counter | Smoother, handles interruption |

**Key insight:** The existing RPC functions (`award_loot`, `spend_energy`) with their `FOR UPDATE` row locking handle all concurrency. Don't add application-level locks.

## Common Pitfalls

### Pitfall 1: awardLoot Amount from Client
**What goes wrong:** DailyClaim currently passes `25` from client to `awardLoot(25, "daily_bonus")`. A savvy kid could modify the call.
**Why it happens:** Phase 2 built DailyClaim with direct awardLoot call.
**How to avoid:** `claimDaily()` Server Action hardcodes amount=25 internally. Client never supplies amount.
**Warning signs:** Any `awardLoot()` call where the first arg comes from client-side state or props.

### Pitfall 2: Shield Drain Race Condition
**What goes wrong:** Multiple `reportWrongAnswer` tool calls in rapid succession could drain shields below 0 or fire `spendEnergy` multiple times for the same wrong answer.
**Why it happens:** AI SDK fires tool call effects multiple times as state progresses.
**How to avoid:** Deduplicate on `toolCallId` in CommsPanel (same pattern as `updateStat`). Use `Math.max(0, shields - 10)` in reducer.
**Warning signs:** `spendEnergy` called more than once per wrong answer in energy_logs.

### Pitfall 3: Validator Zone Coverage After problemCount Changes
**What goes wrong:** Current validator requires exactly 1 stat per zone. With problemCount > zones, multiple stats need the same zone. With problemCount < zones, some zones are unused.
**Why it happens:** Validator was built for 1:1 zone-to-stat mapping.
**How to avoid:** Relax validation: when problemCount > zones, allow zone reuse. When problemCount < zones, allow partial coverage. Always validate that every stat references a valid zone.
**Warning signs:** Validation errors on missions with non-default problemCount.

### Pitfall 4: Supabase Storage Bucket Not Created
**What goes wrong:** `upload()` fails silently because `mission-banners` bucket doesn't exist.
**Why it happens:** Bucket creation is a one-time setup step, not handled by SQL migrations.
**How to avoid:** Create bucket via Supabase dashboard or use admin client: `supabaseAdmin.storage.createBucket('mission-banners', { public: true })`. Can also be done in a migration SQL using `storage.buckets` insert.
**Warning signs:** Banner URLs are always null despite Gemini API key being set.

### Pitfall 5: EconomyContext refreshProfile During Server Rendering
**What goes wrong:** `refreshProfile()` calls a Server Action which can't be called during server-side rendering.
**Why it happens:** EconomyContext is a client component, but might be accessed during hydration.
**How to avoid:** `refreshProfile()` should only be called from event handlers or effects, never during render. The initial values come from BridgeLayout's server-side fetch.
**Warning signs:** "Server Actions can only be called from client components" errors.

### Pitfall 6: Gemini API Key Missing in Dev
**What goes wrong:** Banner generation silently fails, but developer doesn't know why banners are never appearing.
**Why it happens:** `GOOGLE_AI_API_KEY` not in `.env.local`.
**How to avoid:** Log a warning (not error) when API key is missing. Return null gracefully with a console.warn.
**Warning signs:** All missions have `banner_url: null`.

## Code Examples

### RecentLoot Data Mapping (from loot_ledger rows)
```typescript
// Server Action
export async function getRecentLoot(
  limit = 10
): Promise<ActionResult<LootEntry[]>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabaseAdmin
    .from("loot_ledger")
    .select("id, amount, source, description, created_at")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { success: false, error: "Failed to fetch loot" };
  return { success: true, data: data ?? [] };
}

// Component mapping: source string -> LootItem type
// "quest_complete" | "daily_bonus" | "mission:*" -> gold
// All loot_ledger entries are gold transactions (that's what the table stores)
```

### Rank Title Function
```typescript
// src/lib/ranks.ts
const RANK_TIERS = [
  { maxLevel: 5,  title: "Technical Scout" },
  { maxLevel: 10, title: "Field Engineer" },
  { maxLevel: 15, title: "Tactical Architect" },
  { maxLevel: Infinity, title: "Agenty Commander" },
] as const;

export function getRankTitle(level: number): string {
  const tier = RANK_TIERS.find(t => level <= t.maxLevel);
  return tier?.title ?? "Agenty Commander";
}
```

### Shield Bar CSS Animation
```css
/* Damaged Mode: red-shift flicker */
@keyframes shield-flicker {
  0%, 100% { filter: hue-rotate(0deg) brightness(1); }
  50% { filter: hue-rotate(-30deg) brightness(0.85); }
}

.damaged-mode {
  animation: shield-flicker 2s ease-in-out infinite;
}

/* Accessibility: respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .damaged-mode {
    animation: none;
    filter: hue-rotate(-15deg) brightness(0.9);
  }
}
```

### DB Migration: Add Columns to Missions Table
```sql
-- Add 4 new generation parameters with defaults
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS problem_count int NOT NULL DEFAULT 3
    CHECK (problem_count IN (3, 5, 10)),
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  ADD COLUMN IF NOT EXISTS narrative_theme text NOT NULL DEFAULT 'space'
    CHECK (narrative_theme IN ('space', 'nature', 'history', 'fantasy')),
  ADD COLUMN IF NOT EXISTS time_estimate text NOT NULL DEFAULT 'medium'
    CHECK (time_estimate IN ('short', 'medium', 'long')),
  ADD COLUMN IF NOT EXISTS banner_url text;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded mock data in components | Live Supabase queries via Server Actions | This phase | Components show real player data |
| No shields mechanic | Shields + Damaged Mode | This phase | Wrong answers have consequence (not failure) |
| 3 generation inputs (topic, skill, template) | 7 inputs (+ count, difficulty, theme, time) | This phase | More varied mission generation |
| No mission banner images | Gemini Nano Banana 2 generated banners | This phase | Visual identity per mission |
| `awardLoot(25, ...)` from client | `claimDaily()` server-hardcoded | This phase | Loot Guard compliance |

**Deprecated/outdated:**
- DailyClaim calling `awardLoot(25, "daily_bonus")` directly -- replaced by `claimDaily()`
- "Apprentice Explorer" hardcoded rank text -- replaced by `getRankTitle(level)`
- Validator requiring exact 1:1 zone coverage -- relaxed for variable problemCount

## Open Questions

1. **XP Award on Mission Complete**
   - What we know: `MissionCompleteOverlay` calls `awardLoot()` for gold but does NOT award XP currently
   - What's unclear: Should XP be awarded via a separate Server Action, or should `award_loot` RPC be extended to also increment XP?
   - Recommendation: Create a new `completeMission()` Server Action that awards both gold and XP atomically, using a new RPC or sequential calls. This is more robust than two separate calls.

2. **Streak Days Calculation**
   - What we know: `profiles.streak_days` column exists, BridgeLayout will select it
   - What's unclear: Who increments streak_days? Should `claimDaily()` also update streak?
   - Recommendation: `claimDaily()` should increment `streak_days` in the same transaction. Check if the previous daily claim was yesterday to maintain streak, otherwise reset to 1.

3. **Supabase Storage Bucket Creation**
   - What we know: Need `mission-banners` public bucket
   - What's unclear: SQL migrations can insert into `storage.buckets` but this is an internal Supabase table
   - Recommendation: Use `supabaseAdmin.storage.createBucket()` in a one-time setup script, or document manual dashboard creation. SQL migration for storage policies is safer.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ECON-01 | awardLoot fires on mission complete | unit | `npx vitest run src/__tests__/dashboard/mission-complete.test.ts -x` | No -- Wave 0 |
| ECON-02 | spendEnergy fires on mission start | unit | `npx vitest run src/__tests__/dashboard/mission-start-energy.test.ts -x` | No -- Wave 0 |
| ECON-03 | claimDaily idempotent (quest_id unique) | unit | `npx vitest run src/__tests__/dashboard/daily-claim.test.ts -x` | Yes (needs update) |
| ECON-04 | Gold count-up animation | manual-only | N/A (visual) | N/A |
| ECON-05 | Celebration screen renders | unit | `npx vitest run src/__tests__/dashboard/mission-complete.test.ts -x` | No -- Wave 0 |
| ECON-06 | Optimistic UI update fires before server | unit | `npx vitest run src/__tests__/dashboard/daily-claim.test.ts -x` | Yes (needs update) |
| QUEST-01 | claimDaily Server Action works | unit | `npx vitest run src/__tests__/dashboard/daily-claim.test.ts -x` | Yes (needs update) |
| QUEST-02 | DailyClaim button calls claimDaily | unit | `npx vitest run src/__tests__/dashboard/daily-claim.test.ts -x` | Yes (needs update) |
| QUEST-03 | End-to-end data flow | e2e | `npm run test:e2e` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/dashboard/mission-complete.test.ts` -- covers ECON-01, ECON-05
- [ ] `src/__tests__/dashboard/mission-start-energy.test.ts` -- covers ECON-02
- [ ] Update `src/__tests__/dashboard/daily-claim.test.ts` -- covers ECON-03, QUEST-01, QUEST-02
- [ ] `src/__tests__/missions/shields.test.ts` -- covers shield mechanic (missionReducer)
- [ ] `src/__tests__/missions/ranks.test.ts` -- covers getRankTitle function
- [ ] `src/__tests__/missions/validator-relaxed.test.ts` -- covers relaxed zone coverage

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/lib/actions/economy.ts`, `src/lib/missions/missionReducer.ts`, `src/components/*.tsx` -- all existing patterns verified
- Codebase inspection: `supabase/migrations/` -- DB schema and RPC functions verified
- Codebase inspection: `src/contexts/EconomyContext.tsx` -- current interface verified
- [Gemini API Image Generation docs](https://ai.google.dev/gemini-api/docs/image-generation) -- `@google/genai` package, model name, API shape

### Secondary (MEDIUM confidence)
- [Supabase Storage docs](https://supabase.com/docs/reference/javascript/storage-from-upload) -- upload API, bucket creation
- [Google AI Developers Forum](https://discuss.ai.google.dev/t/imagen-3-via-the-google-generative-ai-in-node-js/47021) -- Node.js usage patterns

### Tertiary (LOW confidence)
- Gemini Nano Banana 2 specific pricing and rate limits -- not verified, may vary by account tier

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project except @google/genai
- Architecture: HIGH -- patterns well-established in codebase (Server Actions, Context, Reducer)
- Pitfalls: HIGH -- identified from direct codebase inspection (awardLoot amount, tool dedup, validator rules)
- Gemini integration: MEDIUM -- API docs verified but real-world Node.js usage of Nano Banana 2 specifically has limited examples

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (stable stack, only Gemini API might change)
