# Mission Mode — `/bridge/lab` Redesign

**Date:** 2026-03-11
**Status:** Approved for planning
**Scope:** Refactor `/bridge/lab` from the two-pane Intel Station into Mission Mode — a Holographic Briefing Board (left) + Agent Comms panel (right), with an Intel Drawer slide-over for PDF uploads.

---

## 1. Overview

The current `/bridge/lab` layout treats the PDF dropzone and chat panel as equals. Mission Mode reframes the session as a structured challenge: the Briefing Board tracks mission progress in real time, Cooper's tool calls animate it, and the Intel Drawer is a deliberate side-trip — not a primary panel.

**End-to-end flow:**

1. Kid navigates to `/bridge/lab?mission=dragon-bridge` (or defaults to the first mission in the registry).
2. Page loads: Briefing Board renders in **ghost state** (pulsing grid, skeleton stats).
3. Cooper sends opening message → `initMission` tool call → Board transitions to **active state** (blueprint diagram, big question, stat gauges).
4. Kid answers questions → Cooper calls `updateStat` → specific SVG parts highlight + stat counter animates.
5. Each stat reaching its goal value enters **success state** (permanent subtle glow).
6. Kid can open the **Intel Drawer** via the header button to upload a PDF mid-mission. The button is disabled during timed/critical challenges.

---

## 2. Architecture

### 2.1 MissionRegistry

A static config module — no database, no AI hallucination risk for image assets.

**Location:** `src/lib/missions/registry.ts`

```ts
export type MissionConfig = {
  id: string;                  // e.g. "dragon-bridge"
  title: string;               // e.g. "Dragon Bridge · Da Nang"
  blueprintAsset: string;      // key into /public/blueprints/ e.g. "dragon-bridge"
  accentColor: string;         // hex, Cooper's blue: "#3B82F6"
  stats: MissionStatConfig[];
};

export type MissionStatConfig = {
  id: string;                  // e.g. "span"
  label: string;               // e.g. "SPAN LENGTH"
  unit: string;                // e.g. "m"
  goalValue?: number;          // if set, triggers success state when reached
  svgHighlightId: string;      // maps directly to <path id="..."> or <line id="..."> in blueprint SVG
};
```

**v1 missions:** `dragon-bridge` only. Registry is the extension point for future missions.

### 2.2 Blueprint SVG

**Location:** `public/blueprints/dragon-bridge.svg`

Each highlightable element has a stable `id` attribute matching `MissionStatConfig.svgHighlightId`:

- `id="span"` — deck/span line
- `id="cables"` — all cable lines (grouped or individual)
- `id="towers"` — left and right tower lines

CSS highlight rule applied by `MissionBriefingBoard` when `activeHighlight` matches:

```css
[data-highlight="true"] {
  filter: drop-shadow(0 0 10px #00f0ff);
  stroke-opacity: 1;
}
```

The component sets `data-highlight="true"` on the SVG element whose `id === activeHighlight`. This clears after 900ms.

**Success state:** When a stat reaches `goalValue`, the corresponding SVG element receives a permanent `data-solved="true"` attribute, applying a softer persistent glow:

```css
[data-solved="true"] {
  filter: drop-shadow(0 0 5px #10B981);
  stroke-opacity: 0.85;
}
```

### 2.3 State Management

`MissionBriefingBoard` owns all mission state via `useReducer`. No prop-drilling, no external store.

```ts
type MissionStatus = 'ghost' | 'active' | 'intel-drawer-open';

type StatEntry = {
  value: number | null;
  unit: string;
  goalValue?: number;
  solved: boolean;
};

type MissionState = {
  status: MissionStatus;
  currentObjective: string;
  stats: Record<string, StatEntry>;   // keyed by MissionStatConfig.id
  activeHighlight: string | null;     // clears after 900ms
};

type MissionAction =
  | { type: 'MISSION_INIT'; payload: { objective: string } }
  | { type: 'STAT_UPDATE'; payload: { id: string; value: number; objective?: string } }
  | { type: 'HIGHLIGHT_CLEAR' }
  | { type: 'OPEN_INTEL_DRAWER' }
  | { type: 'CLOSE_INTEL_DRAWER' };
```

`STAT_UPDATE` reducer logic:
1. Sets `stats[id].value` and `stats[id].solved = value >= goalValue` (if goalValue defined).
2. Sets `activeHighlight = id`.
3. Schedules `HIGHLIGHT_CLEAR` dispatch via `setTimeout(900)` inside a `useEffect` that watches `activeHighlight`.

### 2.4 Tool Call Interception

`CommsPanel` (or a parent wrapper) intercepts Cooper's tool calls via `useChat`'s `onToolCall` callback and dispatches to the `MissionBriefingBoard` reducer via a shared `dispatchMission` ref passed as a prop.

**Cooper's tools:**

```ts
// Fires once at session start to transition from ghost → active
initMission({ objective: string })

// Fires as the kid solves each part
updateStat({ id: string; value: number; objective?: string })
```

Cooper's system prompt (in `getAgentSystemPrompt`) instructs him to:
- Call `initMission` as his first message to set the opening objective.
- Call `updateStat` whenever the kid correctly identifies a measurement or calculation, using the `id` from the mission config (e.g. `"span"`, `"cables"`, `"towers"`).
- Update `objective` when advancing to the next step.

### 2.5 Intel Drawer

A Framer Motion `motion.div` overlay anchored to the right edge of the viewport.

- **Width:** `65vw`, slides in from `x: "100%"` → `x: 0`.
- **Backdrop:** Semi-transparent dark overlay (`bg-[#050B14]/80`) covering the left briefing board — briefing board remains visible behind it.
- **Contents:** `KnowledgeDropzone` + scrollable list of previously uploaded intel files for the active session.
- **Close:** Close button (top-right) or `Escape` key.
- **Upload success sequence:** When `KnowledgeDropzone` completes vectorization, do NOT immediately close the drawer. Instead:
  1. Show a full-width green `SCAN COMPLETE` progress bar that fills over 500ms.
  2. After the bar completes, auto-slide the drawer closed (spring animation).
  This makes the system feel responsive and powerful — the kid sees the intel "loading in" before returning to mission.
- **Disabled state:** The "Load Intel" button in the page header is `disabled` and shows a `MISSION CRITICAL` tooltip when `missionState.status === 'active'` AND a `isCritical` flag is set on the mission config. For v1 Dragon Bridge, `isCritical: false` (button always enabled) — the flag is the extension point.

### 2.6 Page Layout

**File:** `src/app/bridge/lab/page.tsx`

```
┌─────────────────────────────────────────────────────┐
│  HEADER: mission title · [Load Intel] button         │
├───────────────────────┬─────────────────────────────┤
│  MissionBriefingBoard │  CommsPanel                  │
│  (left, ~40% width)   │  (right, ~60% width)         │
│                       │                              │
│  ghost/active/solved  │  useChat + agent persona     │
│  blueprint SVG        │  tool call dispatch          │
│  stat gauges          │                              │
│  objective card       │                              │
└───────────────────────┴─────────────────────────────┘
     ↑ Intel Drawer slides over from right (65vw)
```

---

## 3. Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `MissionBriefingBoard` | `src/components/MissionBriefingBoard.tsx` | Ghost/active/stat states, blueprint SVG, stat gauges, objective card. Owns `useReducer`. |
| `BlueprintDiagram` | `src/components/BlueprintDiagram.tsx` | Renders the SVG for a given mission config. Applies `data-highlight` and `data-solved` attributes. Accepts `highlightId` and `solvedIds[]` props. |
| `StatGauge` | `src/components/StatGauge.tsx` | Single stat row: label, animated value, unit, green triangle badge. Scale-bounce on update, permanent glow when solved. |
| `ObjectiveCard` | `src/components/ObjectiveCard.tsx` | Framer Motion `slideUp + fadeIn` on text change. |
| `IntelDrawer` | `src/components/IntelDrawer.tsx` | Framer Motion slide-over. Contains `KnowledgeDropzone`. |
| `CommsPanel` | `src/components/CommsPanel.tsx` | Existing. Gains `onToolCall` → `dispatchMission` wiring. |

---

## 4. Animations (Framer Motion)

All imports from `motion/react`.

| Trigger | Animation |
|---------|-----------|
| Ghost → Active | `flickerIn`: opacity `0 → 0.3 → 0 → 1` over 600ms on the blueprint area |
| `updateStat` received | `StatGauge`: `scale(1 → 1.06 → 1)` + border glow pulse over 400ms |
| SVG highlight | CSS `drop-shadow(0 0 10px #00f0ff)` applied via `data-highlight`, removed after 900ms |
| Stat solved | CSS `drop-shadow(0 0 5px #10B981)` permanent via `data-solved` |
| Objective text change | `slideUp + fadeIn`: `y: 8 → 0`, `opacity: 0 → 1` over 300ms |
| Intel Drawer open/close | `x: "100%" ↔ 0` spring animation, backdrop `opacity: 0 ↔ 0.8` |
| Upload success | Green `SCAN COMPLETE` bar: `width: 0% → 100%` over 500ms, then drawer auto-closes via spring |

---

## 5. Tactical Details for Subagents

### 5.1 Highlight Sync — SVG ID Contract

`BlueprintDiagram` MUST set attributes directly on the SVG element whose `id` matches `highlightId`:

```tsx
// Inside BlueprintDiagram
useEffect(() => {
  if (!highlightId) return;
  const el = svgRef.current?.querySelector(`#${highlightId}`);
  if (el) {
    el.setAttribute('data-highlight', 'true');
    const t = setTimeout(() => el.removeAttribute('data-highlight'), 900);
    return () => clearTimeout(t);
  }
}, [highlightId]);
```

The SVG `id` attributes in `dragon-bridge.svg` must exactly match the `svgHighlightId` values in `MissionRegistry`: `span`, `cables`, `towers`.

### 5.2 Success / Solved State

When `StatGauge` renders with `solved: true`, it applies a permanent `box-shadow: 0 0 12px #10B98144` and a checkmark badge instead of the green triangle. `BlueprintDiagram` receives `solvedIds: string[]` derived from `Object.entries(stats).filter(([,s]) => s.solved).map(([id]) => id)` and applies `data-solved="true"` to matching SVG elements — this persists for the rest of the session.

### 5.3 Intel Drawer Button Disabled State

```tsx
const intelButtonDisabled = config.isCritical && missionState.status === 'active';
```

When disabled: button renders with `opacity-40 cursor-not-allowed` and a Framer Motion tooltip `"MISSION CRITICAL — complete current objective first"` on hover. For v1, `isCritical: false` on Dragon Bridge — wire the logic but it won't trigger.

---

## 6. Data Flow Summary

```
URL param ?mission=dragon-bridge
  → load MissionConfig from registry
  → render MissionBriefingBoard (ghost state)
  → CommsPanel mounts, sends opening message to /api/chat
  → Cooper's first response includes initMission() tool call
    → dispatch MISSION_INIT → board flickers to active state
  → Kid chats, Cooper answers
  → Cooper calls updateStat({ id: "span", value: 666 })
    → dispatch STAT_UPDATE
    → StatGauge scale-bounces
    → BlueprintDiagram highlights #span for 900ms
    → if value >= goalValue → mark solved, permanent glow
```

---

## 7. Files to Create / Modify

**Create:**
- `src/lib/missions/registry.ts`
- `src/lib/missions/dragon-bridge.ts` (mission config instance)
- `public/blueprints/dragon-bridge.svg`
- `src/components/MissionBriefingBoard.tsx`
- `src/components/BlueprintDiagram.tsx`
- `src/components/StatGauge.tsx`
- `src/components/ObjectiveCard.tsx`
- `src/components/IntelDrawer.tsx`

**Modify:**
- `src/app/bridge/lab/page.tsx` — replace two-pane layout with mission mode layout
- `src/components/CommsPanel.tsx` — add `dispatchMission` prop + `onToolCall` wiring
- `src/lib/agents/prompts.ts` — add `initMission` / `updateStat` tool instructions to Cooper's system prompt

---

## 8. Out of Scope (v1)

- Multiple simultaneous missions
- Mission progress persistence to Supabase
- Timed/critical challenge mode (flag wired, never triggered)
- Mission selector UI
- Non-Dragon-Bridge blueprints
