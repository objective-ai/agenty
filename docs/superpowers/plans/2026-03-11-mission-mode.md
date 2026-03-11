# Mission Mode Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `/bridge/lab` from a two-pane Intel Station into Mission Mode — a Holographic Briefing Board that Cooper animates via tool calls, alongside the Agent Comms panel, with an Intel Drawer slide-over for PDF uploads.

**Architecture:** Static `MissionRegistry` maps mission IDs to blueprint assets and stat configs. A `useReducer` in a `"use client"` shell component owns all mission state. `CommsPanel` intercepts Cooper's `initMission`/`updateStat` tool calls from AI SDK v6 message parts and dispatches to the shared reducer. Blueprint SVG elements are highlighted via DOM `data-*` attributes + CSS, not React re-renders.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, `motion/react` (Framer Motion v12), Vercel AI SDK v6 (`@ai-sdk/react`, `DefaultChatTransport`), `ai` server package (`streamText`, `tool`), Zod, Supabase auth.

---

## Chunk 1: Data Layer — Registry, Reducer, SVG Asset

### Task 1: Mission Registry + Dragon Bridge Config

**Files:**
- Create: `src/lib/missions/registry.ts`
- Create: `src/lib/missions/dragon-bridge.ts`

- [ ] **Step 1: Create `registry.ts` with types and registry array**

```ts
// src/lib/missions/registry.ts

export const DEFAULT_MISSION_ID = "dragon-bridge";

export type MissionStatConfig = {
  id: string;
  label: string;
  unit: string;
  goalValue?: number;
  svgHighlightId: string;
};

export type MissionConfig = {
  id: string;
  title: string;
  blueprintAsset: string;
  accentColor: string;
  isCritical?: boolean;
  stats: MissionStatConfig[];
};

// Ordered array — first entry is the default
export const MISSION_REGISTRY: MissionConfig[] = [];

export function getMissionById(id: string): MissionConfig | undefined {
  return MISSION_REGISTRY.find((m) => m.id === id);
}
```

- [ ] **Step 2: Create `dragon-bridge.ts` that pushes to the registry**

```ts
// src/lib/missions/dragon-bridge.ts
import { MISSION_REGISTRY } from "./registry";

MISSION_REGISTRY.push({
  id: "dragon-bridge",
  title: "Dragon Bridge · Da Nang",
  blueprintAsset: "dragon-bridge",
  accentColor: "#3B82F6",
  isCritical: false,
  stats: [
    {
      id: "span",
      label: "SPAN LENGTH",
      unit: "m",
      goalValue: 666,
      svgHighlightId: "span",
    },
    {
      id: "cables",
      label: "CABLE COUNT",
      unit: "cables",
      goalValue: 36,
      svgHighlightId: "cables",
    },
    {
      id: "towers",
      label: "TOWER HEIGHT",
      unit: "m",
      goalValue: 91,
      svgHighlightId: "towers",
    },
  ],
});
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors for the new files.

- [ ] **Step 4: Commit**

```bash
git add src/lib/missions/registry.ts src/lib/missions/dragon-bridge.ts
git commit -m "feat(missions): add MissionRegistry types and Dragon Bridge config"
```

---

### Task 2: Mission Reducer

**Files:**
- Create: `src/lib/missions/missionReducer.ts`

- [ ] **Step 1: Create the reducer file with all types**

```ts
// src/lib/missions/missionReducer.ts
import type { MissionConfig } from "./registry";

export type MissionStatus = "ghost" | "active" | "complete";

export type StatEntry = {
  value: number | null;
  unit: string;
  goalValue?: number;
  solved: boolean;
};

export type MissionState = {
  status: MissionStatus;
  isDrawerOpen: boolean;
  currentObjective: string;
  stats: Record<string, StatEntry>;
  activeHighlight: string | null;
};

export type MissionAction =
  | { type: "MISSION_INIT"; payload: { objective: string } }
  | { type: "STAT_UPDATE"; payload: { id: string; value: number; objective?: string } }
  | { type: "HIGHLIGHT_CLEAR" }
  | { type: "OPEN_INTEL_DRAWER" }
  | { type: "CLOSE_INTEL_DRAWER" };

export function initialState(config: MissionConfig): MissionState {
  return {
    status: "ghost",
    isDrawerOpen: false,
    currentObjective: "",
    activeHighlight: null,
    stats: Object.fromEntries(
      config.stats.map((s) => [
        s.id,
        { value: null, unit: s.unit, goalValue: s.goalValue, solved: false },
      ])
    ),
  };
}

export function missionReducer(
  state: MissionState,
  action: MissionAction
): MissionState {
  switch (action.type) {
    case "MISSION_INIT":
      return { ...state, status: "active", currentObjective: action.payload.objective };

    case "STAT_UPDATE": {
      const { id, value, objective } = action.payload;
      // Guard: ignore hallucinated stat IDs
      if (!state.stats[id]) return state;

      const entry = state.stats[id];
      const solved = entry.goalValue !== undefined ? value >= entry.goalValue : false;
      const updatedStats = {
        ...state.stats,
        [id]: { ...entry, value, solved },
      };

      const allSolved = Object.values(updatedStats)
        .filter((s) => s.goalValue !== undefined)
        .every((s) => s.solved);

      return {
        ...state,
        stats: updatedStats,
        activeHighlight: id,
        currentObjective: objective ?? state.currentObjective,
        status: allSolved ? "complete" : state.status,
      };
    }

    case "HIGHLIGHT_CLEAR":
      return { ...state, activeHighlight: null };

    case "OPEN_INTEL_DRAWER":
      return { ...state, isDrawerOpen: true };

    case "CLOSE_INTEL_DRAWER":
      return { ...state, isDrawerOpen: false };

    default:
      return state;
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/missions/missionReducer.ts
git commit -m "feat(missions): add missionReducer with all action types and initialState factory"
```

---

### Task 3: Blueprint SVG + Global CSS

**Files:**
- Create: `public/blueprints/dragon-bridge.svg`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Create the Dragon Bridge SVG**

The SVG must have exactly three elements with IDs `span`, `towers`, `cables`. All strokes default to `#3B82F6` at 50% opacity. The CSS in globals.css will control highlight/solved states.

```xml
<!-- public/blueprints/dragon-bridge.svg -->
<svg
  viewBox="0 0 280 100"
  width="100%"
  height="auto"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <!-- Water -->
  <path
    d="M16 72 Q46 68 76 72 Q106 76 136 72 Q166 68 196 72 Q226 76 256 72 Q266 70 264 72"
    stroke="#3B82F6"
    stroke-width="0.6"
    stroke-opacity="0.25"
  />

  <!-- SPAN: deck line — id="span" -->
  <line
    id="span"
    x1="16" y1="62" x2="264" y2="62"
    stroke="#3B82F6"
    stroke-width="2"
    stroke-opacity="0.5"
  />

  <!-- TOWERS: both towers as a group — id="towers" -->
  <g id="towers" stroke="#3B82F6" stroke-width="2" stroke-opacity="0.6">
    <!-- Left tower -->
    <line x1="80" y1="15" x2="80" y2="62" />
    <!-- Right tower -->
    <line x1="200" y1="15" x2="200" y2="62" />
  </g>

  <!-- CABLES: all cable lines — id="cables" -->
  <g id="cables" stroke="#3B82F6" stroke-width="0.9" stroke-opacity="0.4">
    <!-- Left tower cables -->
    <line x1="80" y1="17" x2="20" y2="62" />
    <line x1="80" y1="17" x2="44" y2="62" />
    <line x1="80" y1="17" x2="62" y2="62" />
    <line x1="80" y1="17" x2="98" y2="62" />
    <line x1="80" y1="17" x2="116" y2="62" />
    <!-- Right tower cables -->
    <line x1="200" y1="17" x2="260" y2="62" />
    <line x1="200" y1="17" x2="236" y2="62" />
    <line x1="200" y1="17" x2="218" y2="62" />
    <line x1="200" y1="17" x2="182" y2="62" />
    <line x1="200" y1="17" x2="164" y2="62" />
  </g>

  <!-- Label -->
  <text
    x="140"
    y="94"
    text-anchor="middle"
    font-size="8"
    fill="#3B82F644"
    font-family="monospace"
    letter-spacing="2"
  >DRAGON BRIDGE · DA NANG</text>
</svg>
```

- [ ] **Step 2: Add CSS rules to `src/app/globals.css`**

Append after the last existing block (before the closing of the file):

```css
/* ═══════════════════════════════════════════
   Mission Mode — Blueprint SVG Highlight States
   ═══════════════════════════════════════════ */

/* Ghost state pulsing dots */
@keyframes ghostPulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.6; }
}
.animate-ghost-pulse {
  animation: ghostPulse 2s ease-in-out infinite;
}

/* Active highlight — 900ms, removed by BlueprintDiagram useEffect */
[data-highlight="true"] {
  filter: drop-shadow(0 0 10px #00f0ff);
  stroke-opacity: 1 !important;
  transition: filter 0.15s, stroke-opacity 0.15s;
}

/* Permanent solved glow */
[data-solved="true"] {
  filter: drop-shadow(0 0 5px #10B981);
  stroke-opacity: 0.85 !important;
  transition: filter 0.3s, stroke-opacity 0.3s;
}
```

- [ ] **Step 3: Start dev server and visually verify SVG renders**

Run: `npm run dev`
Open: `http://localhost:3000`

Navigate to any page and temporarily place `<img src="/blueprints/dragon-bridge.svg" />` in any component to confirm the SVG loads. Remove after verification.

- [ ] **Step 4: Commit**

```bash
git add public/blueprints/dragon-bridge.svg src/app/globals.css
git commit -m "feat(missions): add Dragon Bridge SVG blueprint and highlight CSS rules"
```

---

## Chunk 2: UI Components — Leaf Components

### Task 4: `StatGauge` Component

**Files:**
- Create: `src/components/StatGauge.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/StatGauge.tsx
"use client";

import { motion } from "motion/react";

type StatGaugeProps = {
  label: string;
  value: number | null;
  unit: string;
  solved: boolean;
};

export function StatGauge({ label, value, unit, solved }: StatGaugeProps) {
  const displayValue = value !== null ? String(value) : "—";

  return (
    <div
      className="flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-300"
      style={{
        background: "#0A1423",
        border: solved ? "2px solid #10B981" : "1px solid #3B82F633",
        boxShadow: solved ? "0 0 12px #10B98144" : "none",
      }}
    >
      <span
        className="font-mono text-[9px] uppercase tracking-widest"
        style={{ color: "#A8977E" }}
      >
        {label}
      </span>

      <div className="flex items-baseline gap-1.5">
        {/* key={value ?? 'unset'} — using the numeric value avoids all-null gauges
            sharing key "—" on initial render, which would cause React key collision */}
        <motion.span
          key={value !== null ? String(value) : "unset"}
          className="font-mono text-sm font-black"
          style={{
            color: solved ? "#10B981" : "#3B82F6",
            textShadow: solved ? "0 0 8px #10B98188" : "0 0 8px #3B82F688",
          }}
          initial={{ scale: 1, opacity: 1 }}
          animate={
            value !== null
              ? { scale: [1, 1.06, 1], opacity: [0.5, 1, 1] }
              : {}
          }
          transition={{ duration: 0.4 }}
        >
          {displayValue}
        </motion.span>

        {value !== null && (
          <span
            className="font-mono text-[9px]"
            style={{ color: "#3B82F666" }}
          >
            {unit}
          </span>
        )}

        {/* Badge: ▲ while active, ✓ when solved */}
        {value !== null && (
          <span
            className="ml-1 text-[9px]"
            style={{ color: "#10B981" }}
          >
            {solved ? "✓" : "▲"}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/StatGauge.tsx
git commit -m "feat(missions): add StatGauge component with scale-bounce and solved state"
```

---

### Task 5: `ObjectiveCard` Component

**Files:**
- Create: `src/components/ObjectiveCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/ObjectiveCard.tsx
"use client";

import { AnimatePresence, motion } from "motion/react";

type ObjectiveCardProps = {
  objective: string;
};

export function ObjectiveCard({ objective }: ObjectiveCardProps) {
  return (
    <div
      className="rounded-xl p-3 mt-auto"
      style={{
        background: "#0A1423",
        border: "2px solid #3B82F644",
      }}
    >
      <p
        className="mb-1 font-mono text-[8px] uppercase tracking-[3px]"
        style={{ color: "#A8977E" }}
      >
        CURRENT OBJECTIVE
      </p>
      {/* AnimatePresence keyed on objective text — slides in new text on change */}
      <AnimatePresence mode="wait">
        <motion.p
          key={objective || "empty"}
          className="text-[10px] font-bold leading-relaxed"
          style={{ color: "#F0E6D3" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          {objective || "Awaiting mission data…"}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ObjectiveCard.tsx
git commit -m "feat(missions): add ObjectiveCard with AnimatePresence slideUp on text change"
```

---

### Task 6: `BlueprintDiagram` Component

**Files:**
- Create: `src/components/BlueprintDiagram.tsx`

- [ ] **Step 1: Create the component**

This component renders the inline SVG from a `<img>` tag is NOT an option here — we need DOM access to set `data-*` attributes on individual SVG elements. Use an inline SVG rendered from a React component that mirrors `dragon-bridge.svg`. The SVG content is hardcoded for Dragon Bridge v1 (other missions would need their own component or a dynamic import strategy — out of scope for v1).

```tsx
// src/components/BlueprintDiagram.tsx
"use client";

import { useRef, useEffect } from "react";
import type { Dispatch } from "react";
import type { MissionAction } from "@/lib/missions/missionReducer";

type BlueprintDiagramProps = {
  highlightId: string | null;
  solvedIds: string[];
  dispatchMission: Dispatch<MissionAction>;
};

export function BlueprintDiagram({
  highlightId,
  solvedIds,
  dispatchMission,
}: BlueprintDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  // useRef for timer — ensures rapid successive tool calls (Kai answers two questions
  // quickly) clear the previous timer immediately, preventing premature HIGHLIGHT_CLEAR
  // from flickering off the second highlight before its 900ms window is up.
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply and clear the active highlight
  useEffect(() => {
    // Always clear any in-flight timer first
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }

    if (!highlightId || !svgRef.current) return;
    const el = svgRef.current.querySelector(`#${highlightId}`);
    if (!el) return;

    el.setAttribute("data-highlight", "true");
    highlightTimerRef.current = setTimeout(() => {
      el.removeAttribute("data-highlight");
      highlightTimerRef.current = null;
      dispatchMission({ type: "HIGHLIGHT_CLEAR" });
    }, 900);
    // Cleanup: cancel the timer only — do NOT call removeAttribute here.
    // Removing the attribute in cleanup breaks the highlight in React Strict Mode
    // (dev-only double-invocation clears the attribute before 900ms).
    // The setTimeout callback is the sole authority for removing data-highlight.
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = null;
      }
    };
  }, [highlightId, dispatchMission]);

  // Apply permanent solved state — re-run whenever solvedIds changes
  useEffect(() => {
    if (!svgRef.current) return;
    solvedIds.forEach((id) => {
      svgRef.current!.querySelector(`#${id}`)?.setAttribute("data-solved", "true");
    });
  }, [solvedIds]);

  return (
    <div
      className="relative rounded-xl p-3"
      style={{
        background:
          "repeating-linear-gradient(0deg,transparent,transparent 14px,#3B82F60A 14px,#3B82F60A 15px)," +
          "repeating-linear-gradient(90deg,transparent,transparent 14px,#3B82F60A 14px,#3B82F60A 15px)",
        border: "1px solid #3B82F644",
      }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 280 100"
        width="100%"
        height="auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Water */}
        <path
          d="M16 72 Q46 68 76 72 Q106 76 136 72 Q166 68 196 72 Q226 76 256 72 Q266 70 264 72"
          stroke="#3B82F6"
          strokeWidth="0.6"
          strokeOpacity="0.25"
        />
        {/* SPAN */}
        <line
          id="span"
          x1="16" y1="62" x2="264" y2="62"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeOpacity="0.5"
        />
        {/* TOWERS */}
        <g id="towers" stroke="#3B82F6" strokeWidth="2" strokeOpacity="0.6">
          <line x1="80" y1="15" x2="80" y2="62" />
          <line x1="200" y1="15" x2="200" y2="62" />
        </g>
        {/* CABLES */}
        <g id="cables" stroke="#3B82F6" strokeWidth="0.9" strokeOpacity="0.4">
          <line x1="80" y1="17" x2="20" y2="62" />
          <line x1="80" y1="17" x2="44" y2="62" />
          <line x1="80" y1="17" x2="62" y2="62" />
          <line x1="80" y1="17" x2="98" y2="62" />
          <line x1="80" y1="17" x2="116" y2="62" />
          <line x1="200" y1="17" x2="260" y2="62" />
          <line x1="200" y1="17" x2="236" y2="62" />
          <line x1="200" y1="17" x2="218" y2="62" />
          <line x1="200" y1="17" x2="182" y2="62" />
          <line x1="200" y1="17" x2="164" y2="62" />
        </g>
        {/* Label */}
        <text
          x="140"
          y="94"
          textAnchor="middle"
          fontSize="8"
          fill="#3B82F644"
          fontFamily="monospace"
          letterSpacing="2"
        >
          DRAGON BRIDGE · DA NANG
        </text>
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/BlueprintDiagram.tsx
git commit -m "feat(missions): add BlueprintDiagram with data-highlight/data-solved DOM effects"
```

---

### Task 7: `MissionBriefingBoard` Component

**Files:**
- Create: `src/components/MissionBriefingBoard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/MissionBriefingBoard.tsx
"use client";

import type { Dispatch } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { MissionConfig } from "@/lib/missions/registry";
import type { MissionState, MissionAction } from "@/lib/missions/missionReducer";
import { BlueprintDiagram } from "./BlueprintDiagram";
import { StatGauge } from "./StatGauge";
import { ObjectiveCard } from "./ObjectiveCard";

type MissionBriefingBoardProps = {
  config: MissionConfig;
  state: MissionState;
  dispatch: Dispatch<MissionAction>;
  signalLost: boolean;
};

export function MissionBriefingBoard({
  config,
  state,
  dispatch,
  signalLost,
}: MissionBriefingBoardProps) {
  const isGhost = state.status === "ghost";
  const isComplete = state.status === "complete";

  // Derive solvedIds from state for BlueprintDiagram
  const solvedIds = Object.entries(state.stats)
    .filter(([, s]) => s.solved)
    .map(([id]) => id);

  // NOTE: width/sizing is controlled by the parent container (MissionModeShell),
  // not by this component. MissionModeShell wraps this in w-[40%] shrink-0.
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border-2 p-4 transition-all duration-500"
      style={{
        background: "#050B14",
        borderColor: isComplete ? "#10B981" : "#3B82F6",
        boxShadow: isComplete
          ? "0 0 32px #10B98133"
          : "0 0 24px #3B82F622",
      }}
    >
      {/* Board header */}
      <div
        className="text-center font-mono text-[9px] uppercase tracking-[3px]"
        style={{ color: isComplete ? "#10B981" : "#3B82F6" }}
      >
        MISSION BRIEFING BOARD
      </div>

      {/* Blueprint area — ghost vs active */}
      <AnimatePresence mode="wait">
        {isGhost ? (
          <motion.div
            key="ghost"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="flex flex-col items-center justify-center gap-3 rounded-xl py-6"
            style={{
              background:
                "repeating-linear-gradient(0deg,transparent,transparent 18px,#3B82F608 18px,#3B82F608 19px)," +
                "repeating-linear-gradient(90deg,transparent,transparent 18px,#3B82F608 18px,#3B82F608 19px)",
              border: "1px solid #3B82F622",
              minHeight: "80px",
            }}
          >
            <p
              className="font-mono text-[10px] uppercase tracking-[2px]"
              style={{ color: "#3B82F633" }}
            >
              {signalLost ? "SIGNAL LOST — retrying…" : "TACTICAL SCAN"}
            </p>
            <p
              className="font-mono text-[10px] animate-ghost-pulse"
              style={{ color: "#3B82F622" }}
            >
              ● ● ●
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0, 1] }}
            transition={{ duration: 0.6, times: [0, 0.3, 0.6, 1] }}
          >
            <BlueprintDiagram
              highlightId={state.activeHighlight}
              solvedIds={solvedIds}
              dispatchMission={dispatch}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat gauges */}
      <div className="flex flex-col gap-1.5">
        {isGhost
          ? // Skeleton bars
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-8 rounded-lg"
                style={{ background: "#0A1423", border: "1px solid #1F2937" }}
              />
            ))
          : config.stats.map((stat) => {
              const entry = state.stats[stat.id];
              return (
                <StatGauge
                  key={stat.id}
                  label={stat.label}
                  value={entry?.value ?? null}
                  unit={stat.unit}
                  solved={entry?.solved ?? false}
                />
              );
            })}
      </div>

      {/* Objective card */}
      {isGhost ? (
        <div
          className="mt-auto h-10 rounded-xl"
          style={{ background: "#0A1423", border: "1px solid #1F2937" }}
        />
      ) : (
        <ObjectiveCard objective={state.currentObjective} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/MissionBriefingBoard.tsx
git commit -m "feat(missions): add MissionBriefingBoard with ghost/active/complete states"
```

---

## Chunk 3: Intel Drawer + KnowledgeDropzone Patch

### Task 8: Patch `KnowledgeDropzone` with `onSuccess` Prop

**Files:**
- Modify: `src/components/KnowledgeDropzone.tsx`

The `KnowledgeDropzone` component currently has no way to notify a parent when upload succeeds. Add an optional `onSuccess` callback called after the Server Action resolves.

- [ ] **Step 1: Add `onSuccess` to props and wire it into `processFile`**

Change the function signature at line 19:
```tsx
// Before:
export function KnowledgeDropzone() {

// After:
export function KnowledgeDropzone({ onSuccess }: { onSuccess?: () => void } = {}) {
```

In `processFile`, after `setUploadState({ status: "success", ... })`, add the callback call AND update the `useCallback` deps array:

Search for the `if (result.success)` block inside `processFile`:
```tsx
// Before:
if (result.success) {
  setUploadState({
    status: "success",
    chunkCount: result.data.chunkCount,
    fileName: result.data.fileName,
  });
}
// ...
},
[]   // ← useCallback deps array
```

```tsx
// After:
if (result.success) {
  setUploadState({
    status: "success",
    chunkCount: result.data.chunkCount,
    fileName: result.data.fileName,
  });
  onSuccess?.();   // ← add this line
}
// ...
},
[onSuccess]   // ← add onSuccess to deps (required to avoid react-hooks/exhaustive-deps build error)
```

> **Important:** `eslint-config-next/core-web-vitals` enforces `react-hooks/exhaustive-deps` as an error. `npm run build` runs ESLint — missing this dep causes a build failure in Task 15.

- [ ] **Step 2: Verify TypeScript compiles and no existing call sites are broken**

Run: `npx tsc --noEmit`
Expected: No errors. Existing `<KnowledgeDropzone />` call sites pass no props and still work (default `= {}` makes the prop optional with no change needed at call sites).

- [ ] **Step 3: Commit**

```bash
git add src/components/KnowledgeDropzone.tsx
git commit -m "feat(missions): add onSuccess callback prop to KnowledgeDropzone"
```

---

### Task 9: `IntelDrawer` Component

**Files:**
- Create: `src/components/IntelDrawer.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/IntelDrawer.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { KnowledgeDropzone } from "./KnowledgeDropzone";

type IntelDrawerProps = {
  onClose: () => void;
};

export function IntelDrawer({ onClose }: IntelDrawerProps) {
  const [scanComplete, setScanComplete] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleUploadSuccess() {
    setScanComplete(true);
    setTimeout(() => {
      setScanComplete(false);
      onClose();
    }, 600); // 500ms bar + 100ms buffer
  }

  return (
    <motion.div
      className="fixed right-0 top-0 z-50 flex h-screen flex-col overflow-hidden bg-[#050B14]"
      style={{ width: "65vw", borderLeft: "2px solid #3B82F633" }}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Drawer header */}
      <div
        className="flex items-center justify-between border-b-2 px-5 py-4"
        style={{ borderColor: "#3B82F633" }}
      >
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-widest text-[#3B82F6]">
            INTEL VAULT
          </p>
          <p className="font-mono text-[10px] text-[#A8977E]">
            Upload classified documents
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 font-mono text-sm text-[#A8977E] transition-colors hover:border-[#3B82F6] hover:text-[#3B82F6]"
          aria-label="Close Intel Vault"
        >
          ×
        </button>
      </div>

      {/* Scrollable content */}
      <div className="relative flex-1 overflow-y-auto p-5">
        <KnowledgeDropzone onSuccess={handleUploadSuccess} />
      </div>

      {/* SCAN COMPLETE bar — renders when scanComplete is true */}
      {scanComplete && (
        <motion.div
          className="absolute bottom-0 left-0 z-10 flex h-8 items-center justify-center bg-[#10B981]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="font-mono text-xs font-black tracking-widest text-[#050B14]">
            SCAN COMPLETE
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/IntelDrawer.tsx
git commit -m "feat(missions): add IntelDrawer with slide-over animation and SCAN COMPLETE bar"
```

---

## Chunk 4: Shell, Page, and Backend Wiring

### Task 10: Patch `CommsPanel` for Mission Mode

**Files:**
- Modify: `src/components/CommsPanel.tsx`

The existing `CommsPanel` takes zero props. Add optional `missionConfig` and `dispatchMission` props with message-ID deduplication to prevent duplicate reducer dispatches. **This task must be completed before Task 11 (`MissionModeShell`)** so the shell compiles cleanly.

- [ ] **Step 1: Verify no other call sites exist**

Run:
```bash
grep -r "CommsPanel" src/ --include="*.tsx" --include="*.ts" -l
```
Expected: Only `src/app/bridge/lab/page.tsx` (which Task 14 replaces) and `src/components/CommsPanel.tsx` itself. If any other file imports `CommsPanel`, check whether it passes props — the `= {}` default keeps it backward-compatible regardless.

- [ ] **Step 2: Add imports and prop types**

At the top of the file, after the existing imports, add:
```tsx
import type { Dispatch } from "react";
import type { MissionConfig } from "@/lib/missions/registry";
import type { MissionAction } from "@/lib/missions/missionReducer";
```

- [ ] **Step 3: Update the function signature**

```tsx
// Before:
export function CommsPanel() {
  const { agent, activeAgent } = useAgent();

// After:
type CommsPanelProps = {
  missionConfig?: MissionConfig;
  dispatchMission?: Dispatch<MissionAction>;
};

export function CommsPanel({ missionConfig, dispatchMission }: CommsPanelProps = {}) {
  const { agent, activeAgent } = useAgent();
```

- [ ] **Step 4: Update `DefaultChatTransport` to include `missionId`**

Find the `useMemo` block (lines 29-36) and update:
```tsx
// Before:
const transport = useMemo(
  () =>
    new DefaultChatTransport({
      api: "/api/chat",
      body: { agentId: activeAgent },
    }),
  [activeAgent]
);

// After:
const transport = useMemo(
  () =>
    new DefaultChatTransport({
      api: "/api/chat",
      body: { agentId: activeAgent, missionId: missionConfig?.id ?? null },
    }),
  [activeAgent, missionConfig?.id]
);
```

- [ ] **Step 5: Add tool call interception `useEffect` with message-ID deduplication**

After the existing auto-scroll `useEffect` (around line 47), add:
```tsx
// Track processed message IDs to prevent duplicate dispatches when messages array
// appends new entries (user text after tool call) and re-triggers the effect
const processedMsgIds = useRef<Set<string>>(new Set());

// Intercept Cooper's tool calls from AI SDK v6 message parts
useEffect(() => {
  if (!dispatchMission) return;
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== "assistant") return;
  // Skip if we've already processed this message
  if (processedMsgIds.current.has(lastMsg.id)) return;
  processedMsgIds.current.add(lastMsg.id);

  for (const part of lastMsg.parts) {
    if (part.type === "tool-call") {
      const toolPart = part as { type: "tool-call"; toolName: string; args: unknown };
      if (toolPart.toolName === "initMission") {
        dispatchMission({
          type: "MISSION_INIT",
          payload: toolPart.args as { objective: string },
        });
      } else if (toolPart.toolName === "updateStat") {
        dispatchMission({
          type: "STAT_UPDATE",
          payload: toolPart.args as { id: string; value: number; objective?: string },
        });
      }
    }
  }
}, [messages, dispatchMission]);
```

Also add `useRef` to the existing React import: change `import { useRef, useEffect, useState, useMemo } from "react";` — `useRef` is already imported (line 9), so no import change needed.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/CommsPanel.tsx
git commit -m "feat(missions): add optional missionConfig/dispatchMission props to CommsPanel with tool call interception"
```

---

### Task 11: `MissionModeShell` Client Component

**Files:**
- Create: `src/components/MissionModeShell.tsx`

**Prerequisite:** Task 10 (CommsPanel patch) must be complete — `MissionModeShell` passes `missionConfig` and `dispatchMission` to `CommsPanel` and will fail TypeScript without those props defined first.

- [ ] **Step 1: Create the shell**

```tsx
// src/components/MissionModeShell.tsx
"use client";

import { useReducer, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { MissionConfig } from "@/lib/missions/registry";
import { missionReducer, initialState } from "@/lib/missions/missionReducer";
import { MissionBriefingBoard } from "./MissionBriefingBoard";
import { CommsPanel } from "./CommsPanel";
import { IntelDrawer } from "./IntelDrawer";

type MissionModeShellProps = {
  config: MissionConfig;
};

export function MissionModeShell({ config }: MissionModeShellProps) {
  const [state, dispatch] = useReducer(missionReducer, initialState(config));
  const [signalLost, setSignalLost] = useState(false);

  // Show SIGNAL LOST if Cooper never calls initMission within 15s
  useEffect(() => {
    const t = setTimeout(() => {
      if (state.status === "ghost") setSignalLost(true);
    }, 15_000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear signalLost once mission becomes active
  useEffect(() => {
    if (state.status !== "ghost") setSignalLost(false);
  }, [state.status]);

  const intelButtonDisabled =
    (config.isCritical ?? false) && state.status === "active";

  return (
    <div className="flex h-screen flex-col bg-[#050B14]">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b-2 px-6 py-3 transition-colors duration-500"
        style={{
          borderColor: state.status === "complete" ? "#10B981" : "#3B82F633",
        }}
      >
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-black tracking-tight text-[#F0E6D3]">
            {config.title.toUpperCase()}
          </h1>
          <span className="font-mono text-xs text-[#A8977E]">
            // mission mode active
          </span>
        </div>
        <button
          onClick={() => dispatch({ type: "OPEN_INTEL_DRAWER" })}
          disabled={intelButtonDisabled}
          title={
            intelButtonDisabled
              ? "MISSION CRITICAL — complete current objective first"
              : "Load Intel"
          }
          className={[
            "rounded-xl border-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-widest transition-all duration-200",
            intelButtonDisabled
              ? "cursor-not-allowed opacity-40"
              : "hover:scale-105 hover:shadow-[0_0_12px_#3B82F644] active:scale-95",
          ].join(" ")}
          style={{
            borderColor: "#3B82F6",
            backgroundColor: "#3B82F622",
            color: "#3B82F6",
          }}
        >
          LOAD INTEL
        </button>
      </div>

      {/* Main two-panel layout */}
      <div className="flex min-h-0 flex-1 gap-4 p-4">
        {/* Board: w-[40%] shrink-0 — sizing lives here, NOT inside MissionBriefingBoard */}
        <div className="w-[40%] min-w-[280px] shrink-0 min-h-0">
          <MissionBriefingBoard
            config={config}
            state={state}
            dispatch={dispatch}
            signalLost={signalLost}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <CommsPanel
            missionConfig={config}
            dispatchMission={dispatch}
          />
        </div>
      </div>

      {/* Intel Drawer + Backdrop — AnimatePresence requires DIRECT children with keys.
          Do NOT wrap in a fragment — fragments cannot be animated by AnimatePresence. */}
      <AnimatePresence>
        {state.isDrawerOpen && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-[#050B14]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
          />
        )}
        {state.isDrawerOpen && (
          <IntelDrawer
            key="drawer"
            onClose={() => dispatch({ type: "CLOSE_INTEL_DRAWER" })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/MissionModeShell.tsx
git commit -m "feat(missions): add MissionModeShell client component with reducer and drawer wiring"
```

---

### Task 12: Update `/api/chat` Route for Mission Mode Tools

**Files:**
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Add `tool` and `z` imports**

At the top of the file, modify the `ai` import line:
```ts
// Before:
import { streamText, convertToModelMessages, type UIMessage } from "ai";

// After:
import { streamText, tool, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
```

- [ ] **Step 2: Add `missionId` to body destructure**

Find line 36:
```ts
// Before:
const { messages, agentId = "cooper" } = body;

// After:
const { messages, agentId = "cooper", missionId } = body;
```

Also update the type assertion on line 30-34:
```ts
// Before:
const body = await req.json() as {
  messages: UIMessage[];
  agentId?: string;
  id?: string;
};

// After:
const body = await req.json() as {
  messages: UIMessage[];
  agentId?: string;
  id?: string;
  missionId?: string | null;
};
```

- [ ] **Step 3: Define mission tools and append Mission Mode prompt**

After the RAG retrieval block (after line 66, before `const result = streamText`), add:
```ts
// Mission Mode: append tool instructions to system prompt and register tools
const missionTools = missionId
  ? {
      initMission: tool({
        description: "Initialize the mission briefing board with the opening objective.",
        parameters: z.object({
          objective: z
            .string()
            .describe("The first objective shown on the briefing board."),
        }),
      }),
      updateStat: tool({
        description:
          "Update a stat gauge on the briefing board and highlight the corresponding blueprint element.",
        parameters: z.object({
          id: z
            .string()
            .describe(
              'Stat ID from mission config. For Dragon Bridge: "span", "cables", or "towers".'
            ),
          value: z.number().describe("The numeric value to display."),
          objective: z
            .string()
            .optional()
            .describe("Updated objective text. Omit if unchanged."),
        }),
      }),
    }
  : undefined;

if (missionId) {
  systemPrompt += `\n\n## Mission Mode Instructions\nYou are running in Mission Mode for mission "${missionId}". On your very first response, call the \`initMission\` tool with a one-sentence opening objective. As the student correctly identifies values, call \`updateStat\` with the matching stat id ("span", "cables", or "towers"), the confirmed numeric value, and an optional updated objective. Do not call \`updateStat\` until the student's answer is confirmed correct.`;
}
```

- [ ] **Step 4: Update `streamText` call to include tools when present**

```ts
// Before:
const result = streamText({
  model: anthropic("claude-sonnet-4-20250514"),
  system: systemPrompt,
  messages: modelMessages,
});

// After:
const result = streamText({
  model: anthropic("claude-sonnet-4-20250514"),
  system: systemPrompt,
  messages: modelMessages,
  ...(missionTools
    ? { tools: missionTools, toolChoice: "auto", maxSteps: 2 }
    : {}),
});
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat(missions): register initMission/updateStat tools in chat route when missionId present"
```

---

### Task 13: Update `AGENTS.md` Tool Definitions

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Update the `# TOOL DEFINITIONS (JSON)` block in Cooper's section**

Search `AGENTS.md` for the exact three-line block (use grep or text search, not line numbers):
```
  # TOOL DEFINITIONS (JSON)
  - initMission: { bigQuestion: string, stats: [{ label: string, unit: string, value: number }] }
  - updateStat: { label: string, newValue: number, animate: boolean }
```

Replace ONLY those three lines with:
```
  # TOOL DEFINITIONS (JSON)
  - initMission: { objective: string }
  - updateStat: { id: string, value: number, objective?: string }
```

Also find the **Mission Protocol** prose in Cooper's section and update to match the new tool behavior:
- `initMission` now accepts `{ objective }` (one-sentence opening objective, no stats array)
- `updateStat` now accepts `{ id, value, objective? }` where `id` matches the SVG element ID (`"span"`, `"cables"`, or `"towers"`)

Do NOT touch character lore, voice/tone, or any other sections.

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs(agents): update Cooper tool schemas to match Mission Mode implementation"
```

---

### Task 14: Rewrite `/bridge/lab` Page

**Files:**
- Modify: `src/app/bridge/lab/page.tsx`

The existing page is a sync Server Component with a two-panel layout. Replace it entirely with the new async Server Component that resolves the mission config and renders `MissionModeShell`. Note: `dragon-bridge.ts` must be imported to ensure it pushes to `MISSION_REGISTRY` before `getMissionById` is called.

- [ ] **Step 1: Replace `page.tsx`**

```tsx
// src/app/bridge/lab/page.tsx
// ═══════════════════════════════════════════════════════════════════
// /bridge/lab — Mission Mode: Holographic Briefing Board + Agent Comms
// ═══════════════════════════════════════════════════════════════════
import "@/lib/missions/dragon-bridge"; // ensures dragon-bridge is pushed to MISSION_REGISTRY
import { getMissionById, DEFAULT_MISSION_ID } from "@/lib/missions/registry";
import { MissionModeShell } from "@/components/MissionModeShell";

export default async function LabPage({
  searchParams,
}: {
  searchParams: Promise<{ mission?: string }>;
}) {
  const { mission } = await searchParams;
  const missionId = mission ?? DEFAULT_MISSION_ID;
  // dragon-bridge.ts pushes to MISSION_REGISTRY at module import, so non-null assert is safe
  const config = getMissionById(missionId) ?? getMissionById(DEFAULT_MISSION_ID)!;
  return <MissionModeShell config={config} />;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Run the dev server and manually test**

Run: `npm run dev`
Open: `http://localhost:3000/bridge/lab`

Verify:
- [ ] Page loads showing the Mission Mode layout (not the old two-panel Intel Station)
- [ ] Header shows "DRAGON BRIDGE · DA NANG" and "LOAD INTEL" button
- [ ] Left pane shows ghost state: blue grid + "TACTICAL SCAN" text + pulsing dots
- [ ] Right pane shows `CommsPanel` with Cooper's styling
- [ ] Typing a message and sending shows Cooper's response in the chat panel
- [ ] After Cooper's first response, the briefing board should transition from ghost to active with flickerIn animation (requires `initMission` tool call to fire)
- [ ] Clicking "LOAD INTEL" opens the `IntelDrawer` from the right with slide-over animation
- [ ] Pressing Escape or clicking × closes the drawer
- [ ] Uploading a PDF shows the SCAN COMPLETE bar then auto-closes the drawer

- [ ] **Step 4: Commit**

```bash
git add src/app/bridge/lab/page.tsx
git commit -m "feat(missions): rewrite /bridge/lab as Mission Mode with MissionModeShell"
```

---

## Chunk 5: Build Verification

### Task 15: Full Build Check

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: Build completes with no TypeScript errors. Warnings about `@next/font` or image optimization are acceptable. Any `Type error:` lines are not acceptable.

- [ ] **Step 2: Fix any build errors before proceeding**

If TypeScript errors appear, trace them to the file, fix, re-run `npx tsc --noEmit` to verify, then re-run `npm run build`.

- [ ] **Step 3: Final end-to-end smoke test**

Run: `npm run dev`
Open: `http://localhost:3000/bridge/lab`

Complete flow:
- [ ] Ghost state renders correctly
- [ ] Cooper's first response triggers `initMission` → board flickers to active state
- [ ] Answering a question triggers `updateStat` → stat bounces, SVG element glows
- [ ] When stat hits `goalValue`, gauge shows checkmark + green glow, SVG gets permanent green glow
- [ ] When all 3 stats solved, header border turns green
- [ ] Intel Drawer opens/closes with spring animation and backdrop
- [ ] PDF upload triggers SCAN COMPLETE bar and auto-closes drawer

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: verified Mission Mode end-to-end build and smoke test"
```
