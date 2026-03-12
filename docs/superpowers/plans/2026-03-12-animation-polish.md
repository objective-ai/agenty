# Phase 4: Animation Polish — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add page transitions, tap feedback, touch targets, mount animations, and reduced-motion support to make the UI feel like a AAA game.

**Architecture:** Enter-only page transitions via `PageTransition` wrapper (App Router constraint — no exit animations). Per-component `whileTap` scale+glow using CSS variable `--agent-accent-rgb`. Server Component pages get thin client wrappers for stagger animations.

**Tech Stack:** Next.js 15 App Router, TypeScript, Framer Motion (`motion/react`), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-12-animation-polish-design.md`

**Key rules for Cline:**
- Import from `"motion/react"`, never `"framer-motion"` (React 19 hydration fix)
- Every file importing `motion/react` must have `'use client'` at top
- Use `--agent-accent-rgb` CSS variable for glow colors, never hardcode agent colors
- Spring physics: `type: "spring", stiffness: 400, damping: 17` for tap feedback
- Do NOT modify existing working animations (confetti, floating numbers, portal warp, drawer springs)

---

## Chunk 1: Foundation — New Components + Layout Integration

### Task 1: Create `PageTransition` component

**Files:**
- Create: `src/components/PageTransition.tsx`

- [ ] **Step 1: Create the PageTransition component**

```tsx
"use client";

import { usePathname } from "next/navigation";
import { useRef, useMemo } from "react";
import { motion } from "motion/react";

// Route depth map for transition direction
function getDepth(path: string): number {
  if (path === "/bridge") return 0;
  const segments = path.replace("/bridge/", "").split("/").filter(Boolean);
  // /bridge/lab is depth 2 (mission mode = deeper)
  if (segments[0] === "lab") return 2;
  return segments.length;
}

const crossfade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
};

const slideFromRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const slideFromLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

function getVariant(prevDepth: number | null, currDepth: number) {
  if (prevDepth === null) return crossfade; // first mount
  if (currDepth > prevDepth) return slideFromRight; // going deeper
  if (currDepth < prevDepth) return slideFromLeft; // going back
  return crossfade; // same depth (lateral)
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevDepthRef = useRef<number | null>(null);

  const prefersReduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const currDepth = getDepth(pathname);
  const variant = prefersReduced
    ? { initial: {}, animate: {} }
    : getVariant(prevDepthRef.current, currDepth);

  // Update ref AFTER computing variant (so we compare old vs new)
  prevDepthRef.current = currDepth;

  return (
    <motion.div
      key={pathname}
      initial={variant.initial}
      animate={variant.animate}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: No errors. `PageTransition` is not yet integrated — just compiles.

- [ ] **Step 3: Commit**

```bash
git add src/components/PageTransition.tsx
git commit -m "feat(ui): add PageTransition enter-only route transition component"
```

---

### Task 2: Create `DashboardStagger` component

**Files:**
- Create: `src/components/DashboardStagger.tsx`

- [ ] **Step 1: Create the DashboardStagger component**

```tsx
"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

const portalWarp = {
  initial: { opacity: 0, scale: 0.8, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function DashboardStagger({ children }: { children: React.ReactNode }) {
  const prefersReduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // Portal warp on first visit after login (one-time)
  const isPortal = useMemo(() => {
    if (typeof window === "undefined" || prefersReduced) return false;
    if (sessionStorage.getItem("portalPlayed")) return false;
    sessionStorage.setItem("portalPlayed", "1");
    return true;
  }, [prefersReduced]);

  if (prefersReduced) {
    return <>{children}</>;
  }

  if (isPortal) {
    return (
      <motion.div initial={portalWarp.initial} animate={portalWarp.animate}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DashboardStagger.tsx
git commit -m "feat(ui): add DashboardStagger with portal warp + stagger mount"
```

---

### Task 3: Create `MissionBoardGrid` component

**Files:**
- Create: `src/components/MissionBoardGrid.tsx`

This component is data-driven — it receives the missions array and renders the card grid internally.

- [ ] **Step 1: Read `src/app/bridge/missions/page.tsx`** to see the current mission card grid markup (around lines 95-154). Extract the card grid JSX into this new component.

- [ ] **Step 2: Create the MissionBoardGrid component**

The component should:
- Accept `missions` prop (array of mission objects matching what `getAllActiveMissions()` returns)
- Import `Link` from `next/link`
- Wrap the grid in `motion.div` with `staggerChildren: 0.08`
- Each card is a `motion.div` with stagger child variants + `whileHover={{ y: -4, boxShadow }}` + `whileTap={{ scale: 0.95, boxShadow }}` using `--agent-accent-rgb`
- Respect `prefers-reduced-motion`
- Have `'use client'` directive

```tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type { MissionConfig } from "@/lib/missions/registry";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function MissionBoardGrid({ missions }: { missions: MissionConfig[] }) {
  const prefersReduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  return (
    <motion.div
      className="grid grid-cols-3 gap-4"
      initial={prefersReduced ? undefined : "hidden"}
      animate={prefersReduced ? undefined : "visible"}
      variants={prefersReduced ? undefined : staggerContainer}
    >
      {missions.map((m) => (
        <motion.div
          key={m.id}
          variants={prefersReduced ? undefined : staggerChild}
          whileHover={
            prefersReduced
              ? undefined
              : {
                  y: -4,
                  boxShadow: `0 8px 32px -4px rgba(var(--agent-accent-rgb), 0.15)`,
                }
          }
          whileTap={
            prefersReduced
              ? undefined
              : {
                  scale: 0.95,
                  boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
                }
          }
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link href={`/bridge/lab?mission=${m.id}`}>
            {/* Copy the exact card inner markup from missions/page.tsx.
                The card accesses m.title, m.stats.length, m.xpReward,
                m.goldReward, m.accentColor, m.description.
                Remove CSS hover classes (hover:-translate-y-1,
                hover:shadow-*) since Framer Motion handles hover now.
                Keep all other Tailwind classes unchanged. */}
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
```

**Critical:** When implementing, read the actual card markup from `src/app/bridge/missions/page.tsx` and move it into this component verbatim. The skeleton above shows the motion wrapper — fill in the card content from the existing page. The `MissionConfig` type comes from `@/lib/missions/registry` and has properties: `id`, `title`, `description`, `stats`, `xpReward`, `goldReward`, `accentColor`, `blueprintAsset`, `defaultObjective`. The link uses `m.id` (not slug).

**Note:** The original page also renders ghost placeholder slots (lines 112-124) to fill up to 3 total items. Leave those ghost slots in the Server Component page — they don't need animation. Only the real mission cards move to `MissionBoardGrid`.

- [ ] **Step 3: Update `src/app/bridge/missions/page.tsx`** to import and use `MissionBoardGrid`

Remove the inline card grid and replace with:
```tsx
import { MissionBoardGrid } from "@/components/MissionBoardGrid";
// ... in JSX:
<MissionBoardGrid missions={activeMissions} />
```

- [ ] **Step 4: Verify build**

Run: `npx next build`
Expected: No errors. Missions page should render identically but with hover/tap/stagger animations.

- [ ] **Step 5: Commit**

```bash
git add src/components/MissionBoardGrid.tsx src/app/bridge/missions/page.tsx
git commit -m "feat(ui): extract MissionBoardGrid client component with stagger + hover + tap"
```

---

### Task 4: Integrate PageTransition into bridge layout

**Files:**
- Modify: `src/app/bridge/layout.tsx`

- [ ] **Step 1: Add PageTransition wrapper**

Add import and wrap `{children}`:

```tsx
import { PageTransition } from "@/components/PageTransition";

// In the return JSX, wrap {children}:
<AgentProvider initialAgent={(profile?.agent_id as AgentId) ?? "cooper"}>
  <EconomyProvider
    initialGold={profile?.gold ?? 0}
    initialXp={profile?.xp ?? 0}
    initialEnergy={profile?.energy ?? 100}
    initialLevel={profile?.level ?? 1}
    initialStreakDays={profile?.streak_days ?? 0}
  >
    <PageTransition>
      {children}
    </PageTransition>
  </EconomyProvider>
</AgentProvider>
```

- [ ] **Step 2: Integrate DashboardStagger into bridge/page.tsx**

Read `src/app/bridge/page.tsx`. Wrap the main content in `<DashboardStagger>`:

```tsx
import { DashboardStagger } from "@/components/DashboardStagger";

// Wrap the main return JSX:
return (
  <DashboardStagger>
    {/* existing dashboard content */}
  </DashboardStagger>
);
```

**Important:** `bridge/page.tsx` is a Server Component (async, fetches data). Do NOT add `motion.div` or import `motion/react` here — it will break the build. Keep it as a Server Component. `DashboardStagger` animates the container as a whole (fade-in or portal warp). Individual child stagger would require converting the page to `'use client'` which breaks auth/data fetching — not worth the tradeoff. The exported `staggerChild` from `DashboardStagger.tsx` is available for future use in client-side pages only.

- [ ] **Step 3: Verify with dev server**

Run: `npm run dev`
Navigate between `/bridge`, `/bridge/missions`, `/bridge/lab`
Expected: Pages fade/slide in on navigation. First visit after login shows portal warp.

- [ ] **Step 4: Commit**

```bash
git add src/app/bridge/layout.tsx src/app/bridge/page.tsx
git commit -m "feat(ui): integrate PageTransition + DashboardStagger into bridge layout"
```

---

## Chunk 2: Tap Feedback + Touch Targets (Per-Component)

Each task below modifies one component. Apply tap feedback (WS-2), touch target fix (WS-3), and mount animation (WS-4) together per file to minimize context switching.

**Reduced-motion note (WS-5):** For `whileTap` across all components below, reduced-motion handling is a deliberate simplification — the `boxShadow` snap-on/snap-off with spring physics is not a continuous animation and is acceptable even with `prefers-reduced-motion`. The scale press feedback is physical/functional, not decorative. Only `PageTransition`, `DashboardStagger`, and `MissionBoardGrid` (continuous/mount animations) include explicit `prefersReduced` checks.

### Task 5: DailyClaim — upgrade whileTap

**Files:**
- Modify: `src/components/DailyClaim.tsx`

- [ ] **Step 1: Update existing whileTap**

Find the `motion.button` with `whileTap={{ scale: 0.97 }}` (around line 70).
Change to:

```tsx
whileTap={{
  scale: 0.95,
  boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
}}
whileHover={{
  scale: 1.02,
  boxShadow: `0 0 12px rgba(var(--agent-accent-rgb), 0.3)`,
}}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DailyClaim.tsx
git commit -m "feat(ui): add agent glow to DailyClaim tap feedback"
```

---

### Task 6: StartQuestButton — add whileTap + mount animation

**Files:**
- Modify: `src/components/StartQuestButton.tsx`

- [ ] **Step 1: Add tap feedback and entrance animation**

The button already has `motion.button` with an infinite `animate` glow pulse (lines 12-19). Add `whileTap` and `whileHover` alongside the existing animation:

```tsx
whileTap={{
  scale: 0.95,
  boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
}}
whileHover={{
  scale: 1.02,
  boxShadow: `0 0 16px rgba(var(--agent-accent-rgb), 0.4)`,
}}
```

Add entrance animation (fade-in + scale):
```tsx
initial={{ opacity: 0, scale: 0.95 }}
animate={{
  opacity: 1,
  scale: 1,
  // keep existing boxShadow pulse animation
  boxShadow: [/* existing values */],
}}
```

**Important:** Merge with the existing infinite boxShadow pulse — don't replace it.

- [ ] **Step 2: Commit**

```bash
git add src/components/StartQuestButton.tsx
git commit -m "feat(ui): add tap feedback + entrance animation to StartQuestButton"
```

---

### Task 7: HudStatusRail — add whileTap + touch target fix

**Files:**
- Modify: `src/components/HudStatusRail.tsx`

- [ ] **Step 1: Find the avatar button** (the element that triggers agent switch). Add:

```tsx
whileTap={{
  scale: 0.95,
  boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
}}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

- [ ] **Step 2: Fix touch target**

The avatar circle is ~36px. Add `min-w-[44px] min-h-[44px]` to ensure iPad compliance. Use padding to expand tap area without changing visual size:

```tsx
className="... min-w-[44px] min-h-[44px] flex items-center justify-center"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/HudStatusRail.tsx
git commit -m "feat(ui): add tap feedback + 44px touch target to HUD avatar"
```

---

### Task 8: AgentSwitchOverlay — add whileTap to agent cards

**Files:**
- Modify: `src/components/AgentSwitchOverlay.tsx`

- [ ] **Step 1: Find the agent selection buttons/cards** inside the overlay. Add to each:

```tsx
whileTap={{
  scale: 0.95,
  boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
}}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

The agent cards are plain `<button>` elements (not `motion.div`). Convert each `<button>` to `<motion.button>` — `motion` is already imported in this file. Add the `whileTap` and `transition` props to each `<motion.button>`.

- [ ] **Step 2: Commit**

```bash
git add src/components/AgentSwitchOverlay.tsx
git commit -m "feat(ui): add tap feedback to AgentSwitchOverlay cards"
```

---

### Task 9: MissionCompleteOverlay — add whileTap to CTAs

**Files:**
- Modify: `src/components/MissionCompleteOverlay.tsx`

- [ ] **Step 1: Update the CTA buttons** ("COLLECT REWARDS", "RETURN TO BASE"). These are already `<motion.button>` elements with CSS `active:scale-95` and `hover:scale-[1.02]` in their className. Make these changes:

1. Remove `active:scale-95` from className (Framer `whileTap` replaces it)
2. Remove `hover:scale-[1.02]` from className (Framer `whileHover` replaces it)
3. Add these props to each `<motion.button>`:

```tsx
whileTap={{
  scale: 0.95,
  boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
}}
whileHover={{
  scale: 1.02,
  boxShadow: `0 0 12px rgba(var(--agent-accent-rgb), 0.3)`,
}}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MissionCompleteOverlay.tsx
git commit -m "feat(ui): add tap feedback to MissionCompleteOverlay CTA buttons"
```

---

### Task 10: Training page — upgrade whileTap + add stagger

**Files:**
- Modify: `src/app/bridge/missions/training/page.tsx`

- [ ] **Step 1: Upgrade existing whileTap** on the "COMPLETE TRAINING" CTA button (around line 268) and station header buttons (around lines 156-179, plain `<button>` — convert to `<motion.button>`).

For the CTA at line 268, change `whileTap={{ scale: 0.97 }}` to:
For station header buttons, convert `<button>` to `<motion.button>` and add:
```tsx
whileTap={{
  scale: 0.95,
  boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
}}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

- [ ] **Step 2: Add stagger mount animation**

This file is already `'use client'`. Wrap the 3 station cards in a stagger container:

```tsx
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Wrap station grid:
<motion.div initial="hidden" animate="visible" variants={staggerContainer}>
  {stations.map(station => (
    <motion.div key={station.id} variants={staggerChild}>
      {/* existing station card */}
    </motion.div>
  ))}
</motion.div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/bridge/missions/training/page.tsx
git commit -m "feat(ui): upgrade training buttons tap glow + add stagger mount"
```

---

### Task 11: IntelDrawer — add whileTap + touch target fix

**Files:**
- Modify: `src/components/IntelDrawer.tsx`

- [ ] **Step 1: Find the close button** (`h-8 w-8`, around line 76-82). `motion` is already imported in this file. Convert `<button>` to `<motion.button>` and add:

```tsx
whileTap={{
  scale: 0.95,
  boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
}}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

- [ ] **Step 2: Fix touch target** — change `h-8 w-8` to `min-w-[44px] min-h-[44px]` with centered content:

```tsx
className="min-w-[44px] min-h-[44px] flex items-center justify-center ..."
```

- [ ] **Step 3: Commit**

```bash
git add src/components/IntelDrawer.tsx
git commit -m "feat(ui): add tap feedback + 44px touch target to IntelDrawer close"
```

---

### Task 12: CommsPanel — add whileTap + touch target fix

**Files:**
- Modify: `src/components/CommsPanel.tsx`

- [ ] **Step 1: Add motion import** — this file does not currently use `motion/react`. Add:

```tsx
"use client"; // should already be present
import { motion } from "motion/react";
```

- [ ] **Step 2: Find the send button** (around line 306, has `active:scale-95`). Convert from `<button>` to `<motion.button>`. Remove `active:scale-95` from className. Add:

```tsx
whileTap={{
  scale: 0.95,
  boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
}}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

- [ ] **Step 3: Fix touch target** — ensure send button has `min-w-[44px] min-h-[44px]`.

- [ ] **Step 4: Commit**

```bash
git add src/components/CommsPanel.tsx
git commit -m "feat(ui): add tap feedback + touch target to CommsPanel send button"
```

---

### Task 13: MiniCalculator — add whileTap + touch target check

**Files:**
- Modify: `src/components/MiniCalculator.tsx`

- [ ] **Step 1: Add motion import** — this file does not currently use `motion/react`. Add:

```tsx
import { motion } from "motion/react";
```

- [ ] **Step 2: Find calculator key buttons** (around lines 95, 168, with `active:scale-95`). Convert each `<button>` to `<motion.button>`. Remove `active:scale-95` from className. Add:

```tsx
whileTap={{
  scale: 0.95,
  boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
}}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

- [ ] **Step 3: Fix touch targets** — calculator keys currently use `h-10` (40px), which is below the 44px minimum. Change `h-10` to `h-11` (44px) on all number/operator keys. The toggle button is `h-[38px] w-[38px]` — change to `h-[44px] w-[44px]`.

- [ ] **Step 4: Commit**

```bash
git add src/components/MiniCalculator.tsx
git commit -m "feat(ui): add tap feedback to MiniCalculator keys"
```

---

### Task 14: BlueprintDiagram — CSS tap + touch target check

**Files:**
- Modify: `src/components/BlueprintDiagram.tsx`

- [ ] **Step 1: Add CSS active state for SVG zones**

BlueprintDiagram renders SVG via `dangerouslySetInnerHTML` — cannot use Framer Motion on inner elements. Instead, add CSS to `globals.css` or inline styles:

Find where zone click handlers are attached. Add CSS for the clickable zone elements:

```css
/* In globals.css or via the component's style injection: */
.blueprint-zone:active {
  transform: scale(0.97);
  transition: transform 0.1s ease;
}
```

Or if zones have a specific selector, target that.

- [ ] **Step 2: Verify zone touch targets** — check that SVG zone click areas are ≥44px. If zones are small, add invisible hit area expansion via larger transparent SVG rects behind each zone.

- [ ] **Step 3: Commit**

```bash
git add src/components/BlueprintDiagram.tsx src/app/globals.css
git commit -m "feat(ui): add CSS tap feedback + touch target check to BlueprintDiagram zones"
```

---

### Task 15: PIN pad — convert to motion.button

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add motion import**

```tsx
import { motion } from "motion/react";
```

- [ ] **Step 2: Find the `KeyButton` component** (around line 85-103, renders number pad buttons with `active:scale-95`). Convert from `<button>` to `<motion.button>`. Remove `active:scale-95` from className. Add:

```tsx
whileTap={{
  scale: 0.95,
  boxShadow: `0 0 20px rgba(245, 197, 66, 0.6)`,
}}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

**Note:** Use hardcoded gold RGB `245, 197, 66` here, NOT `var(--agent-accent-rgb)`. This page is outside the `AgentProvider` — the CSS variable might not resolve to an agent color. Gold is the `:root` default and appropriate for the login screen.

- [ ] **Step 3: PIN keys are already 64px (min-h-[64px] min-w-[64px])** — no touch target fix needed. Verify visually.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(ui): convert PIN pad to motion.button with gold tap glow"
```

---

## Chunk 3: Final Verification + Docs

### Task 16: Build verification

- [ ] **Step 1: Run full build**

```bash
npx next build
```

Expected: Zero errors. Watch for:
- Missing `'use client'` directives on files importing `motion/react`
- Hydration warnings from SSR mismatches
- Type errors from motion prop types

- [ ] **Step 2: Run existing E2E tests**

```bash
npm run test:e2e
```

Expected: All existing tests pass. Animations don't affect functionality.

- [ ] **Step 3: Manual smoke test**

With `npm run dev` running:
1. Navigate to `/` (login) — tap PIN keys, confirm gold glow
2. Login → `/bridge` — confirm portal warp plays (first time only)
3. Navigate `/bridge` → `/bridge/missions` — confirm crossfade
4. Navigate `/bridge/missions` → `/bridge/lab?mission=dragon-bridge` — confirm slide-from-right
5. Navigate back — confirm slide-from-left
6. Tap DailyClaim, StartQuest, training buttons — confirm scale+glow
7. Open IntelDrawer — tap close button, confirm glow
8. Check send button in CommsPanel — confirm glow + 44px target
9. Enable `prefers-reduced-motion: reduce` in devtools → confirm instant transitions, no glow

---

### Task 17: Update project docs

**Files:**
- Modify: `.planning/REQUIREMENTS.md` — Mark UI-03, UI-04, UI-05 as complete
- Modify: `.planning/ROADMAP.md` — Mark Phase 4 as complete
- Modify: `.planning/STATE.md` — Update current position
- Modify: `PLAN.md` — Update to reflect Phase 4 completion

- [ ] **Step 1: Mark requirements complete**

In `.planning/REQUIREMENTS.md`, change:
```markdown
- [ ] **UI-03**: ...
- [ ] **UI-04**: ...
- [ ] **UI-05**: ...
```
to:
```markdown
- [x] **UI-03**: ...
- [x] **UI-04**: ...
- [x] **UI-05**: ...
```

Update traceability table: UI-03, UI-04, UI-05 status → Complete.

- [ ] **Step 2: Update ROADMAP.md**

Mark Phase 4 as complete with today's date.

- [ ] **Step 3: Update STATE.md**

Update current position, progress percentage to 100%.

- [ ] **Step 4: Commit all doc updates**

```bash
git add .planning/REQUIREMENTS.md .planning/ROADMAP.md .planning/STATE.md PLAN.md
git commit -m "docs: mark Phase 4 Animation Polish complete, update project state"
```
