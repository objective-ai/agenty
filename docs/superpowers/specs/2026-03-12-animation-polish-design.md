# Phase 4: Animation Polish — Design Spec

**Date:** 2026-03-12
**Requirements:** UI-03, UI-04, UI-05
**Executor:** Cline (surgical UI/UX edits, Framer Motion)
**Approach:** Component-by-component — no new abstractions except `PageTransition` wrapper

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Transition style | Hybrid | Crossfade lateral, slide depth, themed portal login→bridge |
| Tap feedback | Scale + glow | `whileTap={{ scale: 0.95 }}` + agent-colored `boxShadow` |
| Architecture | Per-component edits | No shared hooks; ~3 lines per file. One new component only. |
| Scope | Full polish pass | 3 requirements + mount animations + hover upgrades + reduced-motion |

## Workstream 1: Page Transitions (UI-03)

### New Component: `src/components/PageTransition.tsx`

A `'use client'` wrapper that uses `AnimatePresence` and `usePathname()` to animate route changes under `/bridge`.

**Transition logic:**

```
Route depth map:
  /bridge           → depth 0
  /bridge/missions  → depth 1
  /bridge/lab       → depth 2
  /bridge/command-deck → depth 1
  /bridge/inventory → depth 1

Transition rules:
  same depth     → crossfade (200ms, opacity 0→1)
  deeper         → slide-left (300ms, x: 100→0, opacity 0→1)
  shallower      → slide-right (300ms, x: -100→0, opacity 0→1)
  login→bridge   → portal warp (500ms, scale: 0.8→1, opacity 0→1, filter: blur(8px)→blur(0))
```

**Integration point:** `src/app/bridge/layout.tsx` wraps `{children}` with `<PageTransition>`. The layout itself stays a Server Component — `PageTransition` is a Client Component child receiving `children` as a prop.

```tsx
// bridge/layout.tsx change:
<AgentProvider ...>
  <EconomyProvider ...>
    <PageTransition>
      {children}
    </PageTransition>
  </EconomyProvider>
</AgentProvider>
```

**Key constraint:** `AnimatePresence` needs a `key` prop on the child to detect route changes. Use `usePathname()` as the key. The exiting page must have `position: absolute` during exit to avoid layout shift.

**Login → Bridge portal:** This transition lives in `src/app/page.tsx` (or `src/app/auth/page.tsx`), not in the bridge layout. After successful auth redirect, the bridge page mounts with a one-time portal entrance animation (checked via `sessionStorage` flag to avoid replaying on refresh).

### Framer Motion variants

```ts
const crossfade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const slideLeft = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: -100, transition: { duration: 0.2 } },
};

const slideRight = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: 100, transition: { duration: 0.2 } },
};

const portalWarp = {
  initial: { opacity: 0, scale: 0.8, filter: "blur(8px)" },
  animate: {
    opacity: 1, scale: 1, filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
  },
};
```

## Workstream 2: Tap Feedback (UI-05)

### Pattern

Every interactive element gets Framer Motion `whileTap` and optionally `whileHover`. The agent glow color comes from the CSS variable `--agent-accent-rgb` (already defined per agent in `globals.css`).

```tsx
// Standard tap feedback pattern:
<motion.button
  whileTap={{ scale: 0.95, boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)` }}
  whileHover={{ scale: 1.02, boxShadow: `0 0 12px rgba(var(--agent-accent-rgb), 0.3)` }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
```

**Note on CSS variables in Framer Motion:** `boxShadow` with `var()` works in Framer Motion's `whileTap` because it's applied as an inline style string, not an interpolated animation value. The shadow snaps on press and animates off on release via the `transition` prop.

### Components to update

| Component | File | Current state | Change needed |
|-----------|------|---------------|---------------|
| DailyClaim | `src/components/DailyClaim.tsx` | Has `whileTap={{ scale: 0.97 }}` | Add boxShadow glow, adjust scale to 0.95 |
| StartQuestButton | `src/components/StartQuestButton.tsx` | CSS glow pulse only, no tap | Add `whileTap` + `whileHover` |
| HudStatusRail avatar | `src/components/HudStatusRail.tsx` | Avatar has hover tilt, no tap | Add `whileTap` scale+glow |
| AgentSwitchOverlay buttons | `src/components/AgentSwitchOverlay.tsx` | Modal cards, no tap feedback | Add `whileTap` to agent selection buttons |
| MissionCompleteOverlay buttons | `src/components/MissionCompleteOverlay.tsx` | CTA buttons, no tap | Add `whileTap` to "Collect Rewards" and "Return to Base" |
| Training station buttons | `src/app/bridge/missions/training/page.tsx` | Has `whileTap={{ scale: 0.97 }}` | Add boxShadow glow, adjust scale to 0.95 |
| Mission board cards | `src/app/bridge/missions/page.tsx` | CSS `hover:translate-y` only | Convert to `motion.div` with `whileHover` + `whileTap` |
| BlueprintDiagram zones | `src/components/BlueprintDiagram.tsx` | SVG click zones, CSS transitions | Add `whileTap` scale pulse on zone click |
| IntelDrawer toggle | `src/components/IntelDrawer.tsx` | Toggle button, no tap feedback | Add `whileTap` scale+glow |
| CommsPanel send button | `src/components/CommsPanel.tsx` | Send button, no tap feedback | Add `whileTap` scale+glow |
| MiniCalculator buttons | `src/components/MiniCalculator.tsx` | Calculator key grid, no tap | Add `whileTap` scale+glow to each key |
| PIN input keys | `src/app/auth/page.tsx` | Number pad buttons, CSS `active:scale-95` | Convert to `motion.button` with `whileTap` |

**Total: 12 components, ~3-5 lines changed per component.**

## Workstream 3: Touch Targets (UI-04)

### Standard

All interactive elements must have a minimum tap area of 44×44px (Apple HIG / WCAG 2.5.8). Enforced via `min-w-[44px] min-h-[44px]` Tailwind classes or equivalent inline styles.

### Audit results

**Already compliant (no changes needed):**
- DailyClaim button (64px+ height)
- StartQuestButton (64px+ height)
- Training station buttons (64px+ height)
- Agent picker cards (large cards)
- AgentSwitchOverlay cards (large cards)
- MissionCompleteOverlay buttons (large CTAs)

**Needs fix:**
| Element | File | Current size | Fix |
|---------|------|-------------|-----|
| HUD avatar button | `HudStatusRail.tsx` | ~36px circle | Increase to 44px, add padding |
| CommsPanel send button | `CommsPanel.tsx` | ~32px icon button | Add `min-w-[44px] min-h-[44px]` with padding |
| IntelDrawer toggle | `IntelDrawer.tsx` | ~32px icon button | Add `min-w-[44px] min-h-[44px]` |
| PIN number keys | `auth/page.tsx` | Variable | Ensure each key is ≥44×44px |
| MiniCalculator keys | `MiniCalculator.tsx` | Variable | Ensure each key is ≥44×44px |
| BlueprintDiagram zones | `BlueprintDiagram.tsx` | SVG-dependent | Verify zone click areas ≥44px; if not, add invisible hit area expansion |

**Approach:** Padding-based sizing. Never change visual size of icons — only expand the tappable area. Use `p-2` or `p-3` to reach 44px minimum without visual layout shifts.

## Workstream 4: Mount Animations + Hover Upgrades

### Component mount animations

Add staggered `initial`/`animate` to page-level content containers. Uses Framer Motion `staggerChildren` on the parent.

```tsx
// Parent container:
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  }}
>
  {/* Each child: */}
  <motion.div variants={{
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }}>
    ...
  </motion.div>
</motion.div>
```

**Components to add mount animations:**

| Component/Page | File | Animation |
|----------------|------|-----------|
| Bridge dashboard sections | `src/app/bridge/page.tsx` | Stagger fade-up for HUD, DailyClaim, StartQuest |
| Mission board cards | `src/app/bridge/missions/page.tsx` | Stagger fade-up for each mission card |
| Training stations | `src/app/bridge/missions/training/page.tsx` | Stagger reveal for 3 stations |
| StartQuestButton | `src/components/StartQuestButton.tsx` | Fade-in + scale entrance |

### Hover upgrades

Convert CSS-only hover effects to Framer Motion for consistency with tap feedback.

| Component | Current | Upgrade to |
|-----------|---------|------------|
| Mission board cards | CSS `hover:-translate-y-1` + `hover:shadow` | `whileHover={{ y: -4, boxShadow }}` matching AgentPicker pattern |

## Workstream 5: prefers-reduced-motion

### Pattern

All new animations must respect `prefers-reduced-motion: reduce`. Use the same pattern already established by `ConfettiBurst` in `MissionCompleteOverlay.tsx`:

```tsx
const prefersReduced = useMemo(
  () => typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  []
);
```

**Application:**
- `PageTransition`: If reduced, set all transition durations to 0 (instant page swap)
- `whileTap`: If reduced, keep scale (physical feedback) but skip boxShadow glow
- Mount animations: If reduced, render immediately without stagger/fade
- Hover effects: If reduced, skip y-translation, keep boxShadow for focus indication

### Implementation note

For `PageTransition` (single component), embed the check directly. For per-component tap feedback, the check is lightweight enough (~1 line useMemo) to repeat in each file rather than creating a shared hook. If Cline finds repetition painful during implementation, a `useReducedMotion()` one-liner hook in `src/hooks/` is acceptable but not required.

## Files Changed Summary

### New files (1)
- `src/components/PageTransition.tsx` — AnimatePresence route transition wrapper

### Modified files (~15)
- `src/app/bridge/layout.tsx` — Wrap children in `<PageTransition>`
- `src/app/bridge/page.tsx` — Add stagger mount animation to dashboard sections
- `src/app/bridge/missions/page.tsx` — Mount animation + hover upgrade for mission cards
- `src/app/bridge/missions/training/page.tsx` — Mount animation + tap glow upgrade
- `src/app/auth/page.tsx` — Convert PIN keys to motion.button + touch target check
- `src/components/DailyClaim.tsx` — Add glow to existing whileTap
- `src/components/StartQuestButton.tsx` — Add whileTap + whileHover + mount animation
- `src/components/HudStatusRail.tsx` — Add whileTap to avatar + touch target fix
- `src/components/AgentSwitchOverlay.tsx` — Add whileTap to agent cards
- `src/components/MissionCompleteOverlay.tsx` — Add whileTap to CTA buttons
- `src/components/BlueprintDiagram.tsx` — Add whileTap to zones + touch target check
- `src/components/IntelDrawer.tsx` — Add whileTap to toggle + touch target fix
- `src/components/CommsPanel.tsx` — Add whileTap to send button + touch target fix
- `src/components/MiniCalculator.tsx` — Add whileTap to keys + touch target check
- `src/app/globals.css` — (Optional) Add `--agent-tap-glow` shorthand variable

## Testing Strategy

### Manual verification
1. Navigate between all routes under `/bridge` — transitions should be smooth with no layout jumps
2. Test login→bridge flow — portal warp should play once, not on refresh
3. Tap every interactive element on iPad simulator — confirm scale+glow fires
4. Measure touch targets with browser devtools (element inspector, hover to see dimensions)
5. Enable `prefers-reduced-motion` in devtools → all animations should be instant or disabled

### Automated
- Existing E2E suite (`npm run test:e2e`) should pass unchanged — animations don't affect functionality
- No new E2E tests needed (animation is visual, not behavioral)

## Requirement Coverage

| Requirement | Workstream | Satisfied by |
|-------------|------------|-------------|
| UI-03 | WS-1 + WS-4 | PageTransition (route transitions) + mount animations |
| UI-04 | WS-3 | Touch target audit and fixes on ~6 components |
| UI-05 | WS-2 | whileTap scale+glow on 12 components |

## Execution Notes for Cline

- **Import:** Always `from "motion/react"`, never `from "framer-motion"` (React 19 hydration fix)
- **'use client':** Every file that imports from `motion/react` must have `'use client'` at top. Most already do.
- **Agent color:** Read from CSS variable `--agent-accent-rgb` for glow colors. Never hardcode agent colors in components.
- **Spring physics:** Use `type: "spring", stiffness: 400, damping: 17` for tap feedback (snappy, not floaty)
- **Existing animations:** Do not modify working animations (confetti, floating numbers, portal warp in AgentPicker, drawer springs). Only add to components missing feedback.
