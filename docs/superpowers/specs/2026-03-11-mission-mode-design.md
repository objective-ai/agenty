# Mission Mode — `/bridge/lab` Redesign

**Date:** 2026-03-11
**Status:** Approved for planning
**Scope:** Refactor `/bridge/lab` from the two-pane Intel Station into Mission Mode — a Holographic Briefing Board (left) + Agent Comms panel (right), with an Intel Drawer slide-over for PDF uploads.

---

## 1. Overview

The current `/bridge/lab` layout treats the PDF dropzone and chat panel as equals. Mission Mode reframes the session as a structured challenge: the Briefing Board tracks mission progress in real time, Cooper's tool calls animate it, and the Intel Drawer is a deliberate side-trip — not a primary panel.

**End-to-end flow:**

1. Kid navigates to `/bridge/lab?mission=dragon-bridge` (or defaults to `DEFAULT_MISSION_ID = "dragon-bridge"`).
2. Page loads: Briefing Board renders in **ghost state** (pulsing grid, skeleton stats, skeleton objective card).
3. Cooper sends opening message → `initMission` tool call → Board transitions to **active state** (blueprint diagram, big question, stat gauges initialized to `—`).
4. Kid answers questions → Cooper calls `updateStat` → specific SVG parts highlight + stat counter animates.
5. Each stat reaching its `goalValue` enters **success state** (permanent subtle glow on gauge + SVG element).
6. All stats solved → board enters **complete state** (green header glow, all SVG elements lit).
7. Kid can open the **Intel Drawer** via the header button to upload a PDF mid-mission. The button is disabled during timed/critical challenges.
8. If `initMission` never fires within 15 seconds of `CommsPanel` mounting, show a `"SIGNAL LOST — retrying…"` message inline in the briefing board ghost area. This prevents an indefinite ghost state on network error or model refusal.

---

## 2. Architecture

### 2.1 MissionRegistry

A static config module — no database, no AI hallucination risk for image assets.

**Location:** `src/lib/missions/registry.ts`

```ts
export const DEFAULT_MISSION_ID = "dragon-bridge";

export type MissionConfig = {
  id: string;                  // e.g. "dragon-bridge"
  title: string;               // e.g. "Dragon Bridge · Da Nang"
  blueprintAsset: string;      // filename stem in /public/blueprints/ e.g. "dragon-bridge" → /public/blueprints/dragon-bridge.svg
  accentColor: string;         // hex, Cooper's blue: "#3B82F6"
  isCritical?: boolean;        // if true, disables Intel Drawer while status is 'active'. Default: false.
  stats: MissionStatConfig[];
};

export type MissionStatConfig = {
  id: string;                  // e.g. "span" — MUST match svgHighlightId and Cooper's tool call id
  label: string;               // e.g. "SPAN LENGTH"
  unit: string;                // e.g. "m"
  goalValue?: number;          // if set, triggers success state when stat value reaches this
  svgHighlightId: string;      // MUST exactly match the `id` attribute on the SVG element in the blueprint file
};

// Ordered array so DEFAULT_MISSION_ID fallback and iteration are unambiguous
export const MISSION_REGISTRY: MissionConfig[] = [];

// Returns undefined if id not found — callers must handle
export function getMissionById(id: string): MissionConfig | undefined {
  return MISSION_REGISTRY.find((m) => m.id === id);
}
```

**v1 missions:** `dragon-bridge` only — defined in `src/lib/missions/dragon-bridge.ts` and pushed into `MISSION_REGISTRY`.

Dragon Bridge stat IDs: `"span"`, `"cables"`, `"towers"`. These strings flow through the entire system — Cooper's tool calls, the reducer, the SVG element IDs, and the CSS attribute selectors must all use exactly these values.

### 2.2 Blueprint SVG

**Location:** `public/blueprints/dragon-bridge.svg`

The SVG is a cable-stayed bridge schematic using the Adventure Navy design system:
- `viewBox="0 0 280 100"`, `width="100%"`, `height="auto"`, `fill="none"`
- Default stroke: `#3B82F6`, default `stroke-opacity="0.5"` on all elements
- Three highlightable elements with exact `id` attributes:

| `id` | Element | Contents |
|------|---------|----------|
| `span` | `<line>` | Horizontal deck: x1=16 y1=62 x2=264 y2=62 stroke-width=2 |
| `towers` | `<g>` | Left tower (x=80, y=15→62) + right tower (x=200, y=15→62), stroke-width=2 |
| `cables` | `<g>` | Cable lines from tower tops to deck, stroke-width=0.9 |

Also include a water path (no id) and label `DRAGON BRIDGE · DA NANG` at bottom: `font-size="8"`, `fill="#3B82F644"`, `font-family="monospace"`, `letter-spacing="2"`.

CSS additions in `src/app/globals.css`:
```css
/* Ghost state pulsing dots — use class="animate-ghost-pulse" */
@keyframes ghostPulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.6; }
}
.animate-ghost-pulse {
  animation: ghostPulse 2s ease-in-out infinite;
}

[data-highlight="true"] {
  filter: drop-shadow(0 0 10px #00f0ff);
  stroke-opacity: 1 !important;
  transition: filter 0.15s, stroke-opacity 0.15s;
}
[data-solved="true"] {
  filter: drop-shadow(0 0 5px #10B981);
  stroke-opacity: 0.85 !important;
  transition: filter 0.3s, stroke-opacity 0.3s;
}
```

### 2.3 State Management

**Client boundary:** `src/app/bridge/lab/page.tsx` MUST remain a Server Component to preserve Next.js 15 RSC benefits. Create `src/components/MissionModeShell.tsx` as a `"use client"` component that owns the `useReducer` and renders both `MissionBriefingBoard` and `CommsPanel` as siblings. `page.tsx` renders `<MissionModeShell config={config} />` after resolving the mission config server-side.

**Reducer location:** `src/lib/missions/missionReducer.ts`

```ts
export type MissionStatus = 'ghost' | 'active' | 'complete';

export type StatEntry = {
  value: number | null;
  unit: string;
  goalValue?: number;
  solved: boolean;
};

export type MissionState = {
  status: MissionStatus;
  isDrawerOpen: boolean;        // separate boolean, not folded into status
  currentObjective: string;
  stats: Record<string, StatEntry>;   // keyed by MissionStatConfig.id
  activeHighlight: string | null;     // clears after 900ms via BlueprintDiagram effect
};

export type MissionAction =
  | { type: 'MISSION_INIT'; payload: { objective: string } }
  | { type: 'STAT_UPDATE'; payload: { id: string; value: number; objective?: string } }
  | { type: 'HIGHLIGHT_CLEAR' }
  | { type: 'OPEN_INTEL_DRAWER' }
  | { type: 'CLOSE_INTEL_DRAWER' };
```

**`isDrawerOpen`** is a separate boolean so `status` (`'ghost' | 'active' | 'complete'`) is never clobbered. The drawer can open/close independently of mission progress. `OPEN_INTEL_DRAWER` sets `isDrawerOpen: true`. `CLOSE_INTEL_DRAWER` sets `isDrawerOpen: false`.

**`initialState(config)` factory:**
```ts
export function initialState(config: MissionConfig): MissionState {
  return {
    status: 'ghost',
    isDrawerOpen: false,
    currentObjective: '',
    activeHighlight: null,
    stats: Object.fromEntries(
      config.stats.map((s) => [
        s.id,
        { value: null, unit: s.unit, goalValue: s.goalValue, solved: false },
      ])
    ),
  };
}
```

**`MISSION_INIT`**: `status: 'ghost' → 'active'`, sets `currentObjective`.

**`STAT_UPDATE`** logic:
1. **Guard:** If `stats[id]` is `undefined` (model hallucinated an unknown stat id), return `state` unchanged — no-op.
2. Set `stats[id].value = value`.
3. If payload includes `objective`, update `currentObjective`.
4. If `stats[id].goalValue` is defined and `value >= stats[id].goalValue`, set `stats[id].solved = true`.
5. Set `activeHighlight = id`.
6. If all stats where `goalValue !== undefined` have `solved === true`, set `status = 'complete'`.

**`HIGHLIGHT_CLEAR`**: sets `activeHighlight = null`. Dispatched by `BlueprintDiagram` after 900ms.

**`MissionModeShell` wiring:**
```tsx
// src/components/MissionModeShell.tsx
'use client';
import { useReducer, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { missionReducer, initialState, MissionAction } from '@/lib/missions/missionReducer';

export function MissionModeShell({ config }: { config: MissionConfig }) {
  const [state, dispatch] = useReducer(missionReducer, initialState(config));
  const [signalLost, setSignalLost] = useState(false);

  // Ghost timeout: if initMission never fires within 15s, show SIGNAL LOST
  useEffect(() => {
    const t = setTimeout(() => {
      if (state.status === 'ghost') setSignalLost(true);
    }, 15_000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally runs once

  // Clear signalLost when mission becomes active
  useEffect(() => {
    if (state.status !== 'ghost') setSignalLost(false);
  }, [state.status]);

  // dispatchMission is stable — useReducer dispatch identity never changes
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header>
        <span>{config.title}</span>
        <button
          onClick={() => dispatch({ type: 'OPEN_INTEL_DRAWER' })}
          disabled={(config.isCritical ?? false) && state.status === 'active'}
          className={(config.isCritical ?? false) && state.status === 'active' ? 'opacity-40 cursor-not-allowed' : ''}
          title={(config.isCritical ?? false) && state.status === 'active' ? 'MISSION CRITICAL — complete current objective first' : 'Load Intel'}
        >
          Load Intel
        </button>
      </header>
      {/* Main panels */}
      <div className="flex flex-1 overflow-hidden">
        <MissionBriefingBoard config={config} state={state} dispatch={dispatch} signalLost={signalLost} />
        <CommsPanel agentId="cooper" missionConfig={config} dispatchMission={dispatch} />
      </div>
      {/* Intel Drawer + backdrop — AnimatePresence required for exit animation */}
      <AnimatePresence>
        {state.isDrawerOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-[#050B14]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
            />
            <IntelDrawer
              key="drawer"
              onClose={() => dispatch({ type: 'CLOSE_INTEL_DRAWER' })}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 2.4 Tool Call Interception — AI SDK v6 Pattern

**Important:** `useChat` in Vercel AI SDK v6 (`@ai-sdk/react`) does NOT have an `onToolCall` option. Tool calls appear as message parts of type `"tool-call"` inside `UIMessage.parts`. Intercept them in a `useEffect` inside `CommsPanel`.

```tsx
// Inside CommsPanel — add to existing component
useEffect(() => {
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'assistant') return;

  for (const part of lastMsg.parts) {
    if (part.type === 'tool-call') {
      if (part.toolName === 'initMission') {
        dispatchMission({ type: 'MISSION_INIT', payload: part.args as { objective: string } });
      } else if (part.toolName === 'updateStat') {
        dispatchMission({ type: 'STAT_UPDATE', payload: part.args as { id: string; value: number; objective?: string } });
      }
    }
  }
}, [messages, dispatchMission]);   // dispatchMission in dependency array — stable identity from useReducer, no extra memoization needed
```

**Server-side tool registration** — `src/app/api/chat/route.ts` MUST register Cooper's tools with `streamText`. Without this the model cannot emit tool calls. Add:

```ts
import { tool } from 'ai';
import { z } from 'zod';

// Inside the POST handler, when missionId is present in the request body:
const tools = missionId ? {
  initMission: tool({
    description: 'Initialize the mission briefing board with the opening objective.',
    parameters: z.object({
      objective: z.string().describe('The first objective shown on the briefing board.'),
    }),
  }),
  updateStat: tool({
    description: 'Update a stat gauge on the briefing board and highlight the corresponding blueprint element.',
    parameters: z.object({
      id: z.string().describe('Stat ID from mission config. For Dragon Bridge: "span", "cables", or "towers".'),
      value: z.number().describe('The numeric value to display.'),
      objective: z.string().optional().describe('Updated objective text. Omit if unchanged.'),
    }),
  }),
} : undefined;

const result = streamText({
  model: anthropic("claude-sonnet-4-20250514"),
  system: systemPrompt,
  messages: modelMessages,
  ...(tools ? { tools, toolChoice: 'auto', maxSteps: 2 } : {}),
  // maxSteps: 2 allows the model to emit a tool call AND a follow-up text response
  // in the same stream. Without this, a tool-call-only response produces a blank
  // assistant bubble in CommsPanel.
});
```

**Request body change — `DefaultChatTransport` pattern:** The existing `CommsPanel` uses `DefaultChatTransport` (not `useChat`'s built-in `body` option) via a `useMemo` keyed on `activeAgent`. To add `missionId`, expand the transport's `body` and add `missionConfig?.id` to the `useMemo` dependency array:

```tsx
const transport = useMemo(
  () =>
    new DefaultChatTransport({
      api: '/api/chat',    // DefaultChatTransport uses `api`, not `url`
      body: { agentId: activeAgent, missionId: missionConfig?.id ?? null },
    }),
  [activeAgent, missionConfig?.id]
);
```

The route adds `missionId` to the **existing** `req.json()` destructure — do NOT call `req.json()` a second time (the Request body stream can only be consumed once). Find the existing destructure in `route.ts` and expand it:
```ts
// Before:
const { messages, agentId = "cooper" } = body;
// After:
const { messages, agentId = "cooper", missionId } = body;
```

**Cooper's Mission Mode system prompt** is injected conditionally in `route.ts`, NOT baked into `getAgentSystemPrompt`. After loading the base system prompt, append when `missionId` is present:

```ts
if (missionId) {
  systemPrompt += `\n\n## Mission Mode Instructions\nYou are running in Mission Mode for mission "${missionId}". On your very first response, call the \`initMission\` tool with a one-sentence opening objective. As the student correctly identifies values, call \`updateStat\` with the matching stat id ("span", "cables", or "towers"), the confirmed numeric value, and an optional updated objective. Do not call \`updateStat\` until the student's answer is confirmed correct.`;
}
```

**AGENTS.md update:** Replace ONLY the `# TOOL DEFINITIONS (JSON)` block in Cooper's section (the exact heading as it appears in the file). Do not touch character lore, voice/tone, or mission protocol sections. Replace the two lines defining `initMission` and `updateStat` with:
```
- initMission: { objective: string }
- updateStat: { id: string, value: number, objective?: string }
```
The old fields (`bigQuestion`, `newValue`, `animate`) are superseded.

### 2.5 Intel Drawer

A Framer Motion `motion.div` overlay, `position: fixed`, right-anchored.

- **Positioning:** `position: fixed`, `top: 0`, `right: 0`, `height: 100vh`, `width: 65vw`, `z-index: 50`.
- **Backdrop:** Separate `motion.div`, `position: fixed`, `inset: 0`, `z-index: 40`, `background: #050B14`, `opacity: 0 → 0.65` (not 0.8 — the board must remain legible behind it).
- **Slide animation:** `initial={{ x: "100%" }}`, `animate={{ x: 0 }}`, `exit={{ x: "100%" }}`, `transition={{ type: "spring", stiffness: 300, damping: 30 }}`.
- **Contents:** `KnowledgeDropzone` (with `onSuccess` callback) + scrollable list of uploaded intel files.
- **Close:** `×` button top-right, or `Escape` key via `useEffect` listening on `keydown`. Both call `onClose()` prop (dispatches `CLOSE_INTEL_DRAWER` from `MissionModeShell`).

**Upload success sequence:**
```tsx
// Inside IntelDrawer
const [scanComplete, setScanComplete] = useState(false);

function handleUploadSuccess() {
  setScanComplete(true);
  setTimeout(() => {
    setScanComplete(false);
    onClose();          // triggers CLOSE_INTEL_DRAWER → isDrawerOpen: false
  }, 600);              // 500ms bar fill + 100ms buffer before close
}
```
The SCAN COMPLETE bar is a `motion.div` sibling to `KnowledgeDropzone`, positioned at the bottom of the drawer:
```tsx
{scanComplete && (
  <motion.div
    className="absolute bottom-0 left-0 h-8 bg-[#10B981] flex items-center justify-center"
    initial={{ width: "0%" }}
    animate={{ width: "100%" }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    <span className="text-[#050B14] font-mono font-bold text-xs tracking-widest">SCAN COMPLETE</span>
  </motion.div>
)}
```

**`KnowledgeDropzone` change:** Add `onSuccess?: () => void` prop. Call it after the Server Action resolves successfully (after setting internal `status: 'success'`). `KnowledgeDropzone` is mounted inside `IntelDrawer` — because `IntelDrawer` is conditionally rendered (`{state.isDrawerOpen && ...}`) it unmounts when the drawer closes and remounts fresh (in `idle` state) on next open. No explicit reset call is needed; the `idle` state on remount is guaranteed by component unmount/mount.

**Intel Drawer button in header:**
```tsx
const intelButtonDisabled = (config.isCritical ?? false) && state.status === 'active';

<button
  onClick={() => dispatch({ type: 'OPEN_INTEL_DRAWER' })}
  disabled={intelButtonDisabled}
  className={intelButtonDisabled ? 'opacity-40 cursor-not-allowed' : ''}
  title={intelButtonDisabled ? 'MISSION CRITICAL — complete current objective first' : 'Load Intel'}
>
  Load Intel
</button>
```
For v1 Dragon Bridge, `isCritical` is `undefined` → button always enabled.

### 2.6 Ghost State Visual Spec

When `status === 'ghost'`:
- **Blueprint area:** Repeating blue grid (`repeating-linear-gradient`), centered text `TACTICAL SCAN` at `color: #3B82F633`, three pulsing dots (`● ● ●`) below using class `animate-ghost-pulse` (defined in `globals.css`).
- **Stat gauges:** Skeleton bars — `background: #0A1423`, `border: 1px solid #1F2937`, `border-radius: 8px`, `height: 32px`, no label text.
- **Objective card:** Single skeleton bar, `height: 40px`, same styling.
- **Ghost timeout:** In `MissionModeShell`, start a 15-second timer on mount. If `state.status` is still `'ghost'` after 15s, set a local `signalLost: boolean` state to `true`. Render `"SIGNAL LOST — retrying…"` text in the ghost grid area instead of `"TACTICAL SCAN"`. This local state resets if `MISSION_INIT` fires.

### 2.7 Page Layout

**`src/app/bridge/lab/page.tsx`** (Server Component):

In Next.js 15+ App Router, `searchParams` is a `Promise` and must be awaited:
```tsx
import { getMissionById, DEFAULT_MISSION_ID } from '@/lib/missions/registry';
import { MissionModeShell } from '@/components/MissionModeShell';

export default async function LabPage({
  searchParams,
}: {
  searchParams: Promise<{ mission?: string }>;
}) {
  const { mission } = await searchParams;
  const missionId = mission ?? DEFAULT_MISSION_ID;
  // dragon-bridge.ts pushes to MISSION_REGISTRY at module load, so this non-null assert is safe
  const config = getMissionById(missionId) ?? getMissionById(DEFAULT_MISSION_ID)!;
  return <MissionModeShell config={config} />;
}
```

**`MissionModeShell` layout:**
```
┌─────────────────────────────────────────────────────┐
│  HEADER: mission title · [Load Intel] button         │
├───────────────────────┬─────────────────────────────┤
│  MissionBriefingBoard │  CommsPanel                  │
│  (left, 40% width)    │  (right, 60% width)          │
│                       │                              │
│  ghost/active/complete│  useChat + agent persona     │
│  blueprint SVG        │  tool call dispatch          │
│  stat gauges          │                              │
│  objective card       │                              │
└───────────────────────┴─────────────────────────────┘
  ↑ IntelDrawer fixed overlay, 65vw from right, z-50
  ↑ Backdrop fixed overlay, inset-0, z-40, bg #050B14 @ 65% opacity
```

---

## 3. Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `MissionModeShell` | `src/components/MissionModeShell.tsx` | `"use client"`. Owns `useReducer`. Renders `MissionBriefingBoard`, `CommsPanel`, `IntelDrawer`. Header with Load Intel button. |
| `MissionBriefingBoard` | `src/components/MissionBriefingBoard.tsx` | Receives `config`, `state`, `dispatch`, `signalLost: boolean` as props. Renders ghost/active/complete states; passes data to `BlueprintDiagram`, `StatGauge`, `ObjectiveCard`. When `signalLost`, renders `"SIGNAL LOST — retrying…"` in the ghost grid area. |
| `BlueprintDiagram` | `src/components/BlueprintDiagram.tsx` | Renders inline SVG. Uses `svgRef` + `useEffect` to set `data-highlight` / `data-solved` attributes. Props: `highlightId: string \| null`, `solvedIds: string[]`, `dispatchMission: Dispatch<MissionAction>`. Dispatches `HIGHLIGHT_CLEAR` after 900ms. |
| `StatGauge` | `src/components/StatGauge.tsx` | Single stat row. Props: `label`, `value`, `unit`, `solved`. Uses `key={value}` to retrigger `scale(1→1.06→1)` animation on value change. Permanent glow + checkmark badge when `solved`. |
| `ObjectiveCard` | `src/components/ObjectiveCard.tsx` | `AnimatePresence` with `key={currentObjective}`: `y: 8→0`, `opacity: 0→1` over 300ms on text change. |
| `IntelDrawer` | `src/components/IntelDrawer.tsx` | Fixed overlay. Framer Motion slide-over. Owns `scanComplete` local state. Passes `onSuccess={handleUploadSuccess}` to `KnowledgeDropzone`. Renders SCAN COMPLETE bar. |
| `CommsPanel` | `src/components/CommsPanel.tsx` | Existing. Gains `missionConfig?: MissionConfig` and `dispatchMission?: Dispatch<MissionAction>` as **optional** props (default: no-op). Adds `useEffect` for tool call interception when both are present. |

**Note on `CommsPanel` backward compatibility:** Both `missionConfig` and `dispatchMission` are optional (`?`). Existing call sites pass neither — the tool call `useEffect` checks `if (!dispatchMission) return` and skips silently. No existing call sites break.

---

## 4. Animations (Framer Motion)

All imports from `motion/react`.

| Trigger | Animation |
|---------|-----------|
| Ghost → Active | In `MissionBriefingBoard`, wrap the blueprint content area in `<AnimatePresence mode="wait">`. When `status === 'ghost'`, render the grid placeholder with `key="ghost"` and `exit={{ opacity: 0, transition: { duration: 0.15 } }}`. When `status !== 'ghost'`, render the blueprint with `key="active"`, `initial={{ opacity: 0 }}`, `animate={{ opacity: [0, 0.3, 0, 1] }}`, `transition={{ duration: 0.6, times: [0, 0.3, 0.6, 1] }}` — this produces the `flickerIn` effect. |
| `updateStat` received | `StatGauge` remounts via `key={value ?? 'unset'}` when value changes (using `'unset'` for null avoids all-null gauges sharing the same key on initial render). Triggers `initial={{ scale: 1, boxShadow: "none" }}` → `animate={{ scale: [1, 1.06, 1], boxShadow: "0 0 16px #3B82F644" }}` over 400ms. Do not use `layoutId` — it is for cross-position shared transitions, not per-value reanimation. |
| SVG highlight | CSS `data-highlight="true"` → `drop-shadow(0 0 10px #00f0ff)`, 900ms via `BlueprintDiagram` effect (timer resets on each new highlight). |
| Stat solved | Permanent `border: 2px solid #10B981`, `box-shadow: 0 0 12px #10B98144` on `StatGauge`. `data-solved="true"` on SVG element → `drop-shadow(0 0 5px #10B981)`. |
| All solved / complete | `MissionModeShell` header border transitions to `#10B981` when `state.status === 'complete'`. |
| Objective text change | `AnimatePresence` on `ObjectiveCard` with `key={currentObjective}`: enter `y: 8→0, opacity: 0→1` over 300ms. |
| Intel Drawer open | `motion.div`: `x: "100%"→0`, spring `{ stiffness: 300, damping: 30 }`. Backdrop: `opacity: 0→0.65`. |
| Intel Drawer close | `exit={{ x: "100%" }}`, backdrop `opacity: 0.65→0`. Wrap in `AnimatePresence`. |
| Upload success | SCAN COMPLETE bar: `width: "0%"→"100%"` over 500ms, then `onClose()` after 600ms. |

---

## 5. Tactical Details for Subagents

### 5.1 Highlight Sync — SVG ID Contract

The 900ms timer MUST be reset on each `highlightId` change. `BlueprintDiagram` also dispatches `HIGHLIGHT_CLEAR` to reset `activeHighlight` in the reducer (so a second tool call on the same stat re-triggers the animation):

```tsx
const svgRef = useRef<SVGSVGElement>(null);
// useRef for timer ID — ensures rapid successive tool calls clear the previous
// timer immediately, preventing premature HIGHLIGHT_CLEAR flickering
const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  // Clear any in-flight timer first — covers rapid double tool calls
  if (highlightTimerRef.current) {
    clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = null;
  }

  if (!highlightId || !svgRef.current) return;
  const el = svgRef.current.querySelector(`#${highlightId}`);
  if (!el) return;

  el.setAttribute('data-highlight', 'true');
  highlightTimerRef.current = setTimeout(() => {
    el.removeAttribute('data-highlight');
    highlightTimerRef.current = null;
    dispatchMission({ type: 'HIGHLIGHT_CLEAR' });
  }, 900);
  return () => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
    el.removeAttribute('data-highlight');
  };
}, [highlightId, dispatchMission]);

// Solved state is permanent — re-apply on every render to handle SVG remount
useEffect(() => {
  if (!svgRef.current) return;
  solvedIds.forEach((id) => {
    svgRef.current!.querySelector(`#${id}`)?.setAttribute('data-solved', 'true');
  });
}, [solvedIds]);
```

`BlueprintDiagram` props: `highlightId: string | null`, `solvedIds: string[]`, `dispatchMission: Dispatch<MissionAction>`.

The SVG element IDs `span`, `cables`, `towers` are the canonical identifiers shared by: blueprint SVG file, `MissionStatConfig.svgHighlightId`, Cooper's `updateStat({ id })` call, and the reducer's `activeHighlight` field.

### 5.2 Success / Solved State

`StatGauge` with `solved: true`:
- Border: `border: 2px solid #10B981`
- Shadow: `box-shadow: 0 0 12px #10B98144` (permanent)
- Badge: `✓` checkmark at `color: #10B981` (replaces `▲` triangle)
- Value color: `#10B981` (replaces `#3B82F6`)

`solvedIds` derivation — place in `MissionBriefingBoard.tsx`:
```tsx
const solvedIds = Object.entries(state.stats)
  .filter(([, s]) => s.solved)
  .map(([id]) => id);
```

### 5.3 Intel Drawer Button Disabled State

```tsx
const intelButtonDisabled = (config.isCritical ?? false) && state.status === 'active';
```

When disabled: Tailwind `opacity-40 cursor-not-allowed`. Tooltip via `title` attribute. For v1, `isCritical` is `undefined` → button always enabled.

### 5.4 KnowledgeDropzone `onSuccess` Prop

Add `onSuccess?: () => void` to `KnowledgeDropzone`'s prop interface. Call it immediately after the Server Action resolves successfully (after the component sets its internal `status: 'success'`). No other changes to `KnowledgeDropzone`.

---

## 6. Data Flow Summary

```
src/app/bridge/lab/page.tsx (Server Component)
  → reads searchParams.mission, calls getMissionById()
  → renders <MissionModeShell config={config} />

MissionModeShell (Client Component)
  → useReducer(missionReducer, initialState(config))
  → starts 15s ghost timeout
  → renders MissionBriefingBoard(config, state, dispatch)
           + CommsPanel(agentId, missionConfig, dispatchMission)
           + IntelDrawer (when state.isDrawerOpen)

CommsPanel mounts
  → useChat with body: { agentId: "cooper", missionId: "dragon-bridge" }
  → POST /api/chat

/api/chat route
  → detects missionId in body
  → appends Mission Mode instructions to Cooper's system prompt
  → streamText with tools: { initMission, updateStat }, toolChoice: 'auto'

Cooper emits tool-call part: initMission({ objective: "Calculate cable length..." })
  → CommsPanel useEffect detects in messages
  → dispatchMission({ type: 'MISSION_INIT', payload })
  → state.status: 'ghost' → 'active'
  → MissionBriefingBoard: flickerIn animation on blueprint area

Kid answers → Cooper emits: updateStat({ id: "span", value: 666, objective: "Now find cable count" })
  → dispatchMission({ type: 'STAT_UPDATE', payload })
  → state.stats["span"].value = 666, activeHighlight = "span", currentObjective updated
  → StatGauge for "span" scale-bounces (key={666} remount)
  → BlueprintDiagram sets data-highlight on #span, 900ms timer starts
  → if 666 >= goalValue(666): stats["span"].solved = true → data-solved on #span, checkmark badge
  → if all stats solved: status = 'complete' → header border turns green
```

---

## 7. Files to Create / Modify

**Create:**
- `src/lib/missions/registry.ts` — `MissionConfig` type, `MISSION_REGISTRY` array, `DEFAULT_MISSION_ID`, `getMissionById`
- `src/lib/missions/dragon-bridge.ts` — Dragon Bridge `MissionConfig` instance, pushed to `MISSION_REGISTRY`
- `src/lib/missions/missionReducer.ts` — `MissionState`, `MissionAction` types, reducer, `initialState(config)` factory
- `public/blueprints/dragon-bridge.svg` — Cable-stayed bridge SVG with IDs `span`, `cables`, `towers`
- `src/components/MissionModeShell.tsx` — `"use client"`, owns `useReducer`, renders siblings, header
- `src/components/MissionBriefingBoard.tsx` — Receives props, renders sub-components
- `src/components/BlueprintDiagram.tsx` — Inline SVG with `data-highlight` / `data-solved` effects
- `src/components/StatGauge.tsx` — Animated stat row
- `src/components/ObjectiveCard.tsx` — Animated objective text
- `src/components/IntelDrawer.tsx` — Fixed overlay, SCAN COMPLETE bar

**Modify:**
- `src/app/bridge/lab/page.tsx` — Server Component, resolves mission config, renders `MissionModeShell`
- `src/components/CommsPanel.tsx` — Add optional `missionConfig` + `dispatchMission` props, tool call `useEffect`, include `missionId` in `useChat` body
- `src/components/KnowledgeDropzone.tsx` — Add optional `onSuccess?: () => void` prop
- `src/app/api/chat/route.ts` — Read `missionId` from body, conditionally register tools with `streamText`, append Mission Mode system prompt
- `src/lib/agents/prompts.ts` — No changes needed (Mission Mode instructions injected in route, not here)
- `src/app/globals.css` — Add `[data-highlight]` and `[data-solved]` CSS rules
- `AGENTS.md` — Replace ONLY the `# TOOL DEFINITIONS (JSON)` block in Cooper's section with `initMission` and `updateStat` schemas from Section 2.4

---

## 8. Out of Scope (v1)

- Multiple simultaneous missions
- Mission progress persistence to Supabase
- Timed/critical challenge mode (`isCritical` flag wired, never triggered in v1)
- Mission selector UI
- Non-Dragon-Bridge blueprints
- Full error recovery on `/api/chat` stream failures (ghost timeout covers the common case)
