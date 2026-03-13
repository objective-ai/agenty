# Portal Split Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the app into two independent portals — `/play` (student game world) and `/parent` (parent dashboard) — with distinct layouts, visuals, and role-based auth guards.

**Architecture:** Rename `src/app/bridge/` → `src/app/play/`, delete the `command-deck` sub-route from it, and create a fresh `src/app/parent/` tree. Each portal has its own server component layout that fetches the user's `role` from `profiles` and redirects cross-portal visitors. Middleware stays a session-only gate (no DB queries). A new Supabase migration adds the `role` column.

**Tech Stack:** Next.js 15 App Router (Server Components, Server Actions), Supabase SSR, TypeScript, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-03-12-portal-split-design.md`

---

## Chunk 1: Database — `role` column

### Task 1: Add `role` column migration

**Files:**
- Create: `supabase/migrations/20260314000000_add_role_to_profiles.sql`

- [ ] **Step 1: Check existing SELECT policies on profiles**

  Open `supabase/migrations/20260310000000_create_core_tables.sql` and search for `profiles` SELECT policies. Note whether any policy uses only `auth.uid() = id` (without a role filter). If such a policy exists, skip the new parent SELECT policy in the migration — it's already covered.

- [ ] **Step 2: Write the migration file**

  The existing migration already has a permissive `"Players can view own profile"` SELECT policy using `auth.uid() = id` (no role filter), which covers all users including parents. Do NOT add a second SELECT policy — it would be redundant and misleading.

  ```sql
  -- supabase/migrations/20260314000000_add_role_to_profiles.sql
  -- Adds role column to profiles.
  -- DEFAULT 'student' backfills all existing rows as 'student'.
  -- Parents are updated to 'parent' by the setupChildAccount server action.
  -- NOTE: If this is not a fresh dev DB, add a backfill:
  --   UPDATE profiles SET role = 'parent' WHERE <known parent ids>;

  ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';
  ```

- [ ] **Step 3: Apply migration locally**

  ```bash
  npx supabase db push
  ```
  Expected: migration applies without error.

- [ ] **Step 4: Commit**

  ```bash
  git add supabase/migrations/20260314000000_add_role_to_profiles.sql
  git commit -m "feat(db): add role column to profiles (student/parent)"
  ```

---

### Task 2: Set parent role in `setupChildAccount`

**Files:**
- Modify: `src/lib/actions/auth.ts`

- [ ] **Step 1: Find the success path in `setupChildAccount`**

  Open `src/lib/actions/auth.ts`. Find the block after the successful profile upsert for the kid (around line 80–100). The parent's `id` is already available as `parent.id`.

- [ ] **Step 2: Add role update after kid profile upsert**

  In `src/lib/actions/auth.ts`, inside `setupChildAccount`, find the block:
  ```ts
  if (profileError) {
    // ... error return
  }
  ```
  Immediately after that block (before `return { success: true, kidEmail }`), add:

  ```ts
  // Update parent's own role to 'parent' (idempotent)
  const { error: roleError } = await supabaseAdmin
    .from("profiles")
    .update({ role: "parent" })
    .eq("id", parent.id);

  if (roleError) {
    console.error("Failed to set parent role:", roleError.message);
    // Non-blocking: child account was created successfully; role update is best-effort
  }
  ```

- [ ] **Step 3: Run existing auth tests to confirm no regressions**

  ```bash
  npx vitest run src/__tests__/auth/
  ```
  Expected: all pass.

- [ ] **Step 4: Commit**

  ```bash
  git add src/lib/actions/auth.ts
  git commit -m "feat(auth): mark parent role='parent' when creating child account"
  ```

---

## Chunk 2: Route rename — `/bridge` → `/play`

### Task 3: Rename directory and delete command-deck

**Files:**
- Rename: `src/app/bridge/` → `src/app/play/`
- Delete: `src/app/play/command-deck/` (content moves to parent portal in Chunk 3)

- [ ] **Step 1: Git-move the bridge directory to play**

  ```bash
  git mv src/app/bridge src/app/play
  ```

- [ ] **Step 2: Delete command-deck from the play tree (staged deletion)**

  ```bash
  git rm -r src/app/play/command-deck
  ```
  `git rm -r` removes from disk AND stages the deletion. Do not use `rm -rf` here — it would leave the deletion unstaged.

- [ ] **Step 3: Verify the play tree looks correct**

  ```bash
  ls src/app/play/
  ```
  Expected output (no `command-deck`):
  ```
  inventory/  lab/  layout.tsx  missions/  page.tsx
  ```

- [ ] **Step 4: Commit the structural rename**

  ```bash
  git add -A
  git commit -m "refactor: rename /bridge route tree to /play, remove command-deck"
  ```

---

## Chunk 3: Parent portal — new route tree

### Task 4: Create `ParentLayout`

**Files:**
- Create: `src/app/parent/layout.tsx`

- [ ] **Step 1: Write `ParentLayout`**

  ```tsx
  // src/app/parent/layout.tsx
  // ════════════════════════════════════════════════════════════
  // /parent layout — Server Component
  // Auth gate + role guard. No game contexts.
  // ════════════════════════════════════════════════════════════
  import { redirect } from "next/navigation";
  import Link from "next/link";
  import { createClient, getAuthUser } from "@/lib/supabase/server";

  export default async function ParentLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);

    if (!user) {
      return redirect("/");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    // Students cannot access the parent portal
    // Allowlist: only confirmed parents pass through
    if (!profile || profile.role !== "parent") {
      return redirect("/play");
    }

    return (
      <div className="min-h-screen bg-[#0F172A] font-sans text-slate-100">
        {/* ── Top navigation bar ───────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0F172A]/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <span className="text-sm font-bold tracking-tight text-white">
              AGENTY <span className="font-normal text-slate-400">Parent</span>
            </span>
            <nav className="hidden gap-6 text-sm text-slate-400 sm:flex">
              <Link href="/parent" className="hover:text-white transition-colors">
                Home
              </Link>
              <Link
                href="/parent/missions"
                className="hover:text-white transition-colors"
              >
                Missions
              </Link>
            </nav>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────── */}
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </div>
    );
  }
  ```

- [ ] **Step 2: Verify no TypeScript errors**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors in `src/app/parent/layout.tsx`.

---

### Task 5: Create parent overview page

**Files:**
- Create: `src/app/parent/page.tsx`

- [ ] **Step 1: Write the parent home page**

  ```tsx
  // src/app/parent/page.tsx
  // ════════════════════════════════════════════════════════════
  // /parent — Parent overview dashboard
  // ════════════════════════════════════════════════════════════
  import Link from "next/link";

  export default function ParentPage() {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-white">Parent Dashboard</h1>
        <p className="text-sm text-slate-400">
          Manage missions and track your agent&apos;s progress.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/parent/missions"
            className="rounded-2xl border border-white/10 bg-slate-800/50 p-5 transition-colors hover:border-white/20 hover:bg-slate-800"
          >
            <p className="mb-1 text-base font-semibold text-white">Missions</p>
            <p className="text-sm text-slate-400">
              Generate and manage AI-powered learning missions.
            </p>
          </Link>
        </div>
      </div>
    );
  }
  ```

---

### Task 6: Move mission factory to parent portal

**Files:**
- Create: `src/app/parent/missions/page.tsx`

- [ ] **Step 1: Copy content from the deleted command-deck page**

  The source was `src/app/bridge/command-deck/page.tsx` (now deleted). Recreate it at the new path:

  ```tsx
  // src/app/parent/missions/page.tsx
  // ════════════════════════════════════════════════════════════
  // /parent/missions — Mission Factory (moved from /bridge/command-deck)
  // ════════════════════════════════════════════════════════════
  import { getMyMissions } from "@/lib/actions/missions";
  import { TEMPLATE_MANIFESTS } from "@/lib/missions/templates";
  import { CommandDeckShell } from "@/components/CommandDeckShell";

  export default async function ParentMissionsPage() {
    const result = await getMyMissions();
    const missions = result.success ? result.data : [];

    return (
      <CommandDeckShell
        initialMissions={missions}
        templates={TEMPLATE_MANIFESTS}
      />
    );
  }
  ```

- [ ] **Step 2: Verify TypeScript is clean**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no new errors.

- [ ] **Step 3: Commit the parent portal scaffolding**

  ```bash
  git add src/app/parent/
  git commit -m "feat(parent): add ParentLayout, overview page, and missions page"
  ```

---

## Chunk 4: Internal reference updates — `/bridge` → `/play`

### Task 7: Update all `/bridge` hardcoded references in source files

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/play/missions/training/page.tsx`
- Modify: `src/app/play/missions/page.tsx`
- Modify: `src/components/BridgeSidebar.tsx`
- Modify: `src/components/StartQuestButton.tsx`
- Modify: `src/components/MissionCompleteOverlay.tsx`
- Modify: `src/components/PageTransition.tsx`

- [ ] **Step 1: Update PIN login redirect in `src/app/page.tsx`**

  Find: `router.push("/bridge")`
  Replace with: `router.push("/play")`

- [ ] **Step 2: Update back-links in training page**

  In `src/app/play/missions/training/page.tsx`, find all `href="/bridge"` (2 occurrences).
  Replace each with `href="/play"`.

- [ ] **Step 3: Update missions page links**

  In `src/app/play/missions/page.tsx`, find:
  - `href="/bridge/missions/training"` → `href="/play/missions/training"`
  - `href="/bridge"` → `href="/play"`

- [ ] **Step 4: Update `BridgeSidebar.tsx` nav items**

  In `src/components/BridgeSidebar.tsx`:

  Replace the `NAV_ITEMS` array:
  ```ts
  const NAV_ITEMS = [
    { href: "/play/missions", label: "MISSIONS", emoji: "\u{1F3AF}" },
    { href: "/play/inventory", label: "INVENTORY", emoji: "\u{1F392}" },
    { href: "/play/lab", label: "THE LAB", emoji: "\u{1F52C}" },
  ] as const;
  ```

  Replace the Help button `href`:
  ```tsx
  href="/play/missions/training"
  ```

- [ ] **Step 5: Update `StartQuestButton.tsx`**

  Find: `href="/bridge/missions/training"`
  Replace with: `href="/play/missions/training"`

- [ ] **Step 6: Update `MissionCompleteOverlay.tsx`**

  Find: `router.push("/bridge")`
  Replace with: `router.push("/play")`

- [ ] **Step 7: Fix `PageTransition.tsx` depth function**

  Replace the entire `getDepth` function:
  ```ts
  function getDepth(path: string): number {
    if (path === "/play") return 0;
    const segments = path.replace("/play/", "").split("/").filter(Boolean);
    // /play/lab is depth 2 (mission mode = deeper)
    if (segments[0] === "lab") return 2;
    return segments.length;
  }
  ```

- [ ] **Step 8: Run the test suite to catch any broken references**

  ```bash
  npx vitest run
  ```
  Expected: all tests pass (some will fail due to stale `/bridge` paths in tests — those are fixed in Chunk 6).

- [ ] **Step 9: Commit**

  ```bash
  git add src/app/page.tsx \
    src/app/play/missions/training/page.tsx \
    src/app/play/missions/page.tsx \
    src/components/BridgeSidebar.tsx \
    src/components/StartQuestButton.tsx \
    src/components/MissionCompleteOverlay.tsx \
    src/components/PageTransition.tsx
  git commit -m "refactor: update all /bridge hrefs and router.push calls to /play"
  ```

---

## Chunk 5: Auth — middleware + redirects + role guards

### Task 8: Update middleware

**Files:**
- Modify: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Replace the route protection and redirect logic**

  Replace the two route-check blocks (currently lines 62–74 of `src/lib/supabase/middleware.ts`) with:

  ```ts
  // Route protection: unauthenticated users cannot access /play or /parent
  if (!user && (pathname.startsWith("/play") || pathname.startsWith("/parent"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Convenience redirect: authenticated users landing on / go to /play.
  // Role-based split (student vs parent) happens inside each portal layout.
  // If a parent hits /play their layout will redirect them to /parent.
  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/play";
    return NextResponse.redirect(url);
  }
  ```

  Also update the comment block at the top of `updateSession` to match:
  ```ts
  /**
   * Refreshes the Supabase auth session on every request and
   * enforces route-level protection:
   *
   *  - /play/*   without a session  -> redirect to /
   *  - /parent/* without a session  -> redirect to /
   *  - /         with a session     -> redirect to /play (layout handles parent→/parent)
   *  - /setup    always allowed     (parent lands here after magic link)
   */
  ```

- [ ] **Step 2: Run middleware tests**

  ```bash
  npx vitest run src/__tests__/auth/middleware.test.ts
  ```
  Expected: all pass (tests are currently stubs — see Chunk 6 for updates).

---

### Task 9: Add role guard to `/play` layout

**Files:**
- Modify: `src/app/play/layout.tsx`

- [ ] **Step 1: Read the current layout**

  Open `src/app/play/layout.tsx` (renamed from `bridge/layout.tsx`). It currently selects `gold, xp, energy, level, streak_days, agent_id, display_name, training_certified`.

- [ ] **Step 2: Add `role` to the select and add redirect**

  Update the `.select()` call to include `role`:
  ```ts
  const { data: profile } = await supabase
    .from("profiles")
    .select("gold, xp, energy, level, streak_days, agent_id, display_name, training_certified, role")
    .eq("id", user.id)
    .single();
  ```

  After the profile query, before the `return (...)`, add:
  ```ts
  // Parents cannot access the student portal
  if (profile?.role === "parent") {
    return redirect("/parent");
  }
  ```

- [ ] **Step 3: Run profile fetch tests**

  ```bash
  npx vitest run src/__tests__/dashboard/profile-fetch.test.ts
  ```
  Expected: fails due to stale import path (`app/bridge/layout`). Fixed in Chunk 6.

---

### Task 10: Update login + setup redirects

**Files:**
- Modify: `src/app/setup/page.tsx`

- [ ] **Step 1: Update the "Go to Login" button in setup page step 2**

  In `src/app/setup/page.tsx`, in the step 2 success screen, find the button:
  ```tsx
  onClick={() => router.push("/")}
  ```
  Change to:
  ```tsx
  onClick={() => router.push("/parent")}
  ```

  Also update the button label from `"Go to Login"` to `"Go to Parent Dashboard"`.

- [ ] **Step 2: Run setup tests**

  ```bash
  npx vitest run src/__tests__/auth/setup.test.ts
  ```
  Expected: pass (setup tests don't check the redirect destination).

- [ ] **Step 3: Commit auth changes**

  ```bash
  git add src/lib/supabase/middleware.ts \
    src/app/play/layout.tsx \
    src/app/setup/page.tsx
  git commit -m "feat(auth): portal role guards, middleware update, setup redirects to /parent"
  ```

---

## Chunk 6: Test updates

### Task 11: Update unit tests with stale `/bridge` references

**Files:**
- Modify: `src/__tests__/dashboard/profile-fetch.test.ts`
- Modify: `src/__tests__/dashboard/agent-switch-overlay.test.ts`
- Modify: `src/__tests__/auth/middleware.test.ts`
- Modify: `tests/e2e/bridge-lab.spec.py`

- [ ] **Step 1: Update `profile-fetch.test.ts` — three changes**

  **Change 1:** Update the import (line 35):
  ```ts
  // Before:
  import BridgeLayout from "@/app/bridge/layout";
  // After:
  import PlayLayout from "@/app/play/layout";
  ```

  **Change 2:** Rename all three call sites (lines 64, 87, 109) from `BridgeLayout` → `PlayLayout`:
  ```ts
  await PlayLayout({ children: null as unknown as React.ReactNode });
  ```

  **Change 3:** Update the file-path assertion (line 118–120):
  ```ts
  const layoutPath = path.resolve(__dirname, "../../app/play/layout.tsx");
  ```

- [ ] **Step 2: Update `agent-switch-overlay.test.ts`**

  In the second `describe` block (`"DASH-01: Bridge page AgentPicker wiring"`), inside the `beforeEach`, find:
  ```ts
  bridgeSource = readFileSync(
    resolve(__dirname, "../../app/bridge/page.tsx"),
    "utf-8"
  );
  ```
  Replace with:
  ```ts
  bridgeSource = readFileSync(
    resolve(__dirname, "../../app/play/page.tsx"),
    "utf-8"
  );
  ```

  Also update the `describe` label to `"DASH-01: Play page AgentPicker wiring"`.

- [ ] **Step 3: Update `middleware.test.ts` stubs**

  Replace the current stub descriptions:
  ```ts
  describe("AUTH-06: Middleware Redirect", () => {
    it.todo("redirects /play to / when no session");
    it.todo("redirects /parent to / when no session");
    it.todo("allows /setup through regardless of auth state");
  });
  ```

- [ ] **Step 4: Update E2E test**

  In `tests/e2e/bridge-lab.spec.py`, find:
  ```python
  LAB_URL = f"{BASE_URL}/bridge/lab"
  ```
  Replace with:
  ```python
  LAB_URL = f"{BASE_URL}/play/lab"
  ```

- [ ] **Step 5: Run the full test suite**

  ```bash
  npx vitest run
  ```
  Expected: all tests pass.

- [ ] **Step 6: Run the build**

  ```bash
  npx next build
  ```
  Expected: build completes with no errors.

- [ ] **Step 7: Commit**

  ```bash
  git add src/__tests__/ tests/
  git commit -m "fix(tests): update stale /bridge references to /play"
  ```

---

## Verification Checklist

After all tasks complete, manually verify:

- [ ] `http://localhost:3000/play` loads the student dashboard (Adventure Navy background)
- [ ] `http://localhost:3000/parent` loads the parent dashboard (Slate `#0F172A` background, clean layout)
- [ ] `http://localhost:3000/parent/missions` loads the Mission Factory (CommandDeckShell)
- [ ] `http://localhost:3000/bridge` returns 404
- [ ] PIN login redirects to `/play`
- [ ] Creating a child account via `/setup` redirects to `/parent`
- [ ] A student session visiting `/parent` redirects to `/play`
- [ ] A parent session visiting `/play` redirects to `/parent`
- [ ] `npx next build` — no errors
- [ ] `npx vitest run` — all pass
