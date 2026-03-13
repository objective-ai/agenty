# Portal Split Design: /play + /parent

**Date:** 2026-03-12
**Status:** Approved

## Problem

The student game portal (`/bridge`) and the parent mission factory (`/bridge/command-deck`) share the same route tree, the same layout, and the same visual aesthetic. This creates three problems:

1. No visual distinction between a 9-year-old's game world and a parent's management tool
2. No architectural separation — adding parent features (child management, subscription) would pollute the game layout
3. `/bridge` is an unintuitive name; `/bridge/missions` is redundant

## Approach

Hard split into two completely independent route trees with separate layouts, separate auth redirects, and distinct visual identities. No shared layout component between them.

## Route Structure

### Student Portal: `/play/*`

| Route | Purpose |
|-------|---------|
| `/play` | Dashboard — HUD, DailyClaim, agent picker |
| `/play/lab` | Mission Mode — briefing board, stat gauges |
| `/play/missions` | Mission list — all active missions |
| `/play/missions/training` | Training room mission |
| `/play/inventory` | Inventory |

Layout: `AgentProvider` + `EconomyProvider` + `PageTransition`. Identical logic to current `BridgeLayout`, just moved.

### Parent Portal: `/parent/*`

| Route | Purpose |
|-------|---------|
| `/parent` | Overview dashboard |
| `/parent/missions` | Mission factory (moved from `/bridge/command-deck`) |
| `/parent/children` | Child account management (future phase) |
| `/parent/subscription` | Billing (future phase) |

Layout: `ParentLayout` — independent server component, no game contexts. Selects `id, role` from `profiles` for auth + role check only.

## Visual Identity

### Student Portal (`/play`)
- Background: Adventure Navy `#050B14` (unchanged)
- Full game aesthetic: neon agent glows, chunky borders, Framer Motion animations
- Desktop/iPad optimized
- All existing components unchanged

### Parent Portal (`/parent`)
- Background: Slate `#0F172A`
- Neutral gray borders (`border-white/10`), no neon glows
- Clean, professional — no game-specific styling
- Font: system font stack (`font-sans` / Tailwind default) — no custom game fonts
- **Mobile-first layout**: single column, full-width cards, 44px+ tap targets
- Sticky top bar nav on mobile with hamburger menu; sidebar on wider screens
- No Framer Motion animations — lightweight and snappy
- Typography: larger, readable, standard weights

## Auth & Redirects

### Middleware strategy

Middleware remains a **session-only gate** — it does not query `profiles` or check role. Keeping DB queries out of middleware avoids per-request latency and edge runtime complexity.

Updated `src/lib/supabase/middleware.ts`:
- `/play/*` — no session → redirect `/`
- `/parent/*` — no session → redirect `/`
- `/` with session — no automatic redirect (let the page handle it; avoids needing role in middleware)

### Layout-level role guards

Each layout fetches `role` from `profiles` and enforces isolation:

| Layout | No session | role = "student" | role = "parent" | role = null |
|--------|-----------|-----------------|-----------------|-------------|
| `/play` layout | redirect `/` | render | redirect `/parent` | render (default to student) |
| `/parent` layout | redirect `/` | redirect `/play` | render | redirect `/play` |

`ParentLayout` query:
```sql
SELECT id, role FROM profiles WHERE id = user.id LIMIT 1
```

### Login flow redirects

| Entry point | After success | Redirect to |
|-------------|---------------|-------------|
| Magic link (parent) | Setup complete | `/parent` |
| PIN login (student) | PIN accepted | `/play` |

**Device sharing:** PIN login calls a Server Action that creates a new Supabase session, replacing any existing parent session in the browser. A parent handing the device to a child simply lets the child use the PIN login screen — the child's session then takes over. No explicit logout required.

## Database: `role` column

The `profiles` table requires a `role` column. This must be added via migration before deploying the portal split.

**Migration SQL:**
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';

-- Parent accounts set role during magic-link setup server action
-- Student accounts default to 'student' via the column default
```

**`handle_new_user()` trigger:** No change needed. The trigger creates a profiles row with the column default (`'student'`). The parent setup Server Action explicitly updates `role = 'parent'` after magic-link confirmation.

**RLS addition:** Parents must be able to read their own profile row:
```sql
CREATE POLICY "Parents can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id AND role = 'parent');
```
(Verify whether an existing SELECT policy already covers this before adding.)

## Migration Scope

### Route/directory renames
- `src/app/bridge/` → `src/app/play/` (all subdirectories and files move 1:1)
- **Exception:** `src/app/bridge/command-deck/` is **deleted**, not moved to `/play`. Its content moves to `src/app/parent/missions/`.

### New files
- `src/app/parent/layout.tsx` — `ParentLayout` server component
- `src/app/parent/page.tsx` — Parent overview page
- `src/app/parent/missions/page.tsx` — Content from `bridge/command-deck/page.tsx`

### Files with hardcoded `/bridge` references to update

| File | Required change |
|------|----------------|
| `src/app/page.tsx` | PIN login success → `router.push("/play")` |
| `src/app/play/missions/training/page.tsx` | All `href="/bridge"` → `href="/play"` (2 occurrences) |
| `src/components/BridgeSidebar.tsx` | All `href="/bridge..."` → `href="/play..."` (blanket replace, including `/bridge/missions/training`) |
| `src/components/MissionCompleteOverlay.tsx` | `router.push("/bridge")` → `router.push("/play")` |
| `src/components/PageTransition.tsx` | `getDepth()` function: update both `/bridge` string literals to `/play` (the equality check AND the `replace` call) |
| `src/lib/supabase/middleware.ts` | Protected route list: replace `/bridge` with `/play` and `/parent`; remove auto-redirect from `/` |
| `src/app/setup/page.tsx` | Post-setup redirect → `/parent` (parent stays in their portal after creating child account) |

### Test files to update

| File | Required change |
|------|----------------|
| `src/__tests__/dashboard/profile-fetch.test.ts` | Verify and update any `app/bridge/layout` import paths |
| `src/__tests__/dashboard/agent-switch-overlay.test.ts` | Verify and update any `/bridge` path references |
| `src/__tests__/auth/middleware.test.ts` | Update `/bridge` route stubs → `/play` |
| `tests/e2e/bridge-lab.spec.py` | `LAB_URL` → `{BASE_URL}/play/lab` (note: `.spec.py` extension is a pre-existing project typo) |

### Component rename (optional, cosmetic — not blocking)
- `BridgeSidebar` → `PlaySidebar`

## Out of Scope
- Child management UI (future phase)
- Subscription UI (future phase)
- Changes to any component logic (only routes and layout wrappers change)
