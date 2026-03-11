# Architecture Research

**Domain:** Gamified kids' learning OS — Next.js 15 App Router, PIN + magic link auth, economy UI
**Researched:** 2026-03-10
**Confidence:** HIGH (stack is fixed, patterns verified against official docs and existing codebase)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client Layer)                        │
├──────────────────────┬──────────────────────────────────────────────┤
│  (auth) route group  │          (dashboard) route group              │
│  ┌──────────────┐    │  ┌──────────────────────────────────────────┐ │
│  │  /login      │    │  │  layout.tsx  (AgentProvider +            │ │
│  │  PIN pad UI  │    │  │              EconomyProvider)            │ │
│  │  "use client"│    │  ├─────────────┬──────────────┬────────────┤ │
│  └──────────────┘    │  │  Sidebar    │  /bridge     │  Right     │ │
│  ┌──────────────┐    │  │  AgentSel.  │  QuestCards  │  Rail      │ │
│  │  /auth/      │    │  │  PlayerCard │  DailyReward │  XPProg.   │ │
│  │  callback    │    │  │             │  QuestCard   │  Streak    │ │
│  │  (Server     │    │  │             │  [demo]      │  RecentLoot│ │
│  │  Component)  │    │  └─────────────┴──────────────┴────────────┘ │
│  └──────────────┘    └──────────────────────────────────────────────┘
├──────────────────────────────────────────────────────────────────────┤
│                      SERVER LAYER (Next.js)                          │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  middleware.ts — session refresh via @supabase/ssr getClaims │     │
│  │  Redirects unauthenticated → /login                         │     │
│  └─────────────────────────────────────────────────────────────┘     │
│  ┌──────────────────────┐  ┌───────────────────────────────────┐     │
│  │  Server Actions       │  │  Server Components (data fetch)   │     │
│  │  economy.ts           │  │  dashboard/page.tsx reads profile │     │
│  │  awardLoot()          │  │  via supabase server client       │     │
│  │  spendEnergy()        │  └───────────────────────────────────┘     │
│  │  admin.ts             │                                             │
│  └──────────────────────┘                                             │
├──────────────────────────────────────────────────────────────────────┤
│                      SUPABASE (Data Layer)                            │
│  ┌───────────┐  ┌─────────────┐  ┌────────────┐  ┌──────────────┐   │
│  │ auth.users│  │  profiles   │  │ loot_ledger│  │ energy_logs  │   │
│  └───────────┘  └─────────────┘  └────────────┘  └──────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  RPCs: award_loot(), spend_energy()  (already complete)       │    │
│  └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Type |
|-----------|----------------|------|
| `middleware.ts` | Refresh Supabase session cookie on every request; redirect `/` and dashboard routes to `/login` if no valid session | Server (Edge) |
| `(auth)/login/page.tsx` | PIN pad UI — 4-digit entry, calls `signInWithPassword` on submit; shows magic-link fallback button | Client Component |
| `(auth)/auth/callback/route.ts` | Exchange Supabase `code` param for session cookie after magic link click | Route Handler (Server) |
| `(dashboard)/layout.tsx` | Wraps all dashboard routes; fetches profile once via Server Component and passes as props; hosts `AgentProvider` + `EconomyProvider` | Server Component (layout) |
| `EconomyContext` | Client-side cache of `{gold, xp, energy}` — starts from server-fetched value, updated optimistically on Server Action response | Client Context |
| `StatsBar` | Reads from `EconomyContext`; renders gold/energy/prestige with Framer Motion count-up on change | Client Component |
| `DailyRewardButton` | Calls `awardLoot()` via Server Action; uses `useTransition` to show pending state; triggers count-up on success | Client Component |
| `QuestCard (demo)` | "Start Quest" calls `spendEnergy()`; on quest complete calls `awardLoot(50, 'daily-checkin', questId)` | Client Component |
| `AgentSelector` | Reads/writes `AgentContext`; sets `data-agent` on `<html>` for CSS theming | Client Component |

---

## Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Route group — no layout shared with dashboard
│   │   ├── login/
│   │   │   └── page.tsx         # PIN pad — "use client"
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts     # Magic link code exchange
│   ├── (dashboard)/             # Route group — protected, shares layout
│   │   ├── layout.tsx           # Server Component: fetches profile, provides contexts
│   │   └── bridge/
│   │       └── page.tsx         # The Bridge (current page.tsx, wired to real data)
│   ├── actions/
│   │   └── economy.ts           # EXISTING — do not modify
│   ├── globals.css              # EXISTING
│   ├── layout.tsx               # Root layout — fonts only, no auth logic
│   └── page.tsx                 # Redirect: / → /bridge (or /login if unauthed)
├── components/
│   ├── auth/
│   │   └── PinPad.tsx           # 4-digit PIN entry UI
│   ├── dashboard/               # Dashboard-specific display components
│   │   ├── StatsBar.tsx         # Wired — reads EconomyContext
│   │   ├── QuestCard.tsx        # Wired — spendEnergy + awardLoot
│   │   ├── DailyRewardButton.tsx # New — calls awardLoot
│   │   ├── AgentSelector.tsx    # EXISTING
│   │   ├── XPProgress.tsx       # EXISTING (wire to EconomyContext)
│   │   ├── DailyStreak.tsx      # EXISTING
│   │   └── RecentLoot.tsx       # EXISTING
│   └── ui/                      # Pure visual primitives (no data)
│       ├── AnimatedNumber.tsx   # Framer Motion count-up, no data fetching
│       ├── GlowCard.tsx
│       └── NeonBadge.tsx
├── contexts/
│   ├── AgentContext.tsx          # EXISTING
│   └── EconomyContext.tsx        # NEW — gold/xp/energy client cache
└── lib/
    └── supabase/
        ├── client.ts             # EXISTING
        ├── server.ts             # EXISTING
        └── admin.ts              # EXISTING
```

### Structure Rationale

- **`(auth)/` route group:** Shares no layout with the dashboard. Login page can be full-screen, no sidebar/header bleed. Supabase callback lives here as a Route Handler.
- **`(dashboard)/layout.tsx` as Server Component:** Fetch the profile row once at the layout level, pass `initialGold`, `initialXp`, `initialEnergy` as props into `EconomyProvider`. Avoids a client-side fetch waterfall on every page load.
- **`components/ui/`:** AnimatedNumber is a pure display component. It accepts a numeric `value` prop and animates on change. No Supabase knowledge, no Server Action calls. Keeps animation logic decoupled from data logic.
- **`contexts/EconomyContext.tsx`:** Single source of truth for economy UI state on the client. Initialized from server-fetched data, mutated locally after Server Action responses. No polling, no real-time subscription needed for a single-player kid app.

---

## Architectural Patterns

### Pattern 1: Server Component → Client Context Hydration

**What:** The dashboard layout (Server Component) fetches the player profile from Supabase and passes it as initial props to a Client Context provider. Client components read from the context, not from Supabase directly.

**When to use:** When you need live-animated UI (Framer Motion) that starts from server-accurate data. Avoids the flash-of-hardcoded-data problem that currently exists in StatsBar.

**Trade-offs:** One extra prop-drilling step through the layout. Worth it — eliminates client-side loading states for the initial render, which feel jarring in a game UI.

**Example:**
```typescript
// (dashboard)/layout.tsx — Server Component
import { createClient } from "@/lib/supabase/server";
import { EconomyProvider } from "@/contexts/EconomyContext";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("gold, xp, energy")
    .eq("id", user.id)
    .single();

  return (
    <EconomyProvider initialGold={profile.gold} initialXp={profile.xp} initialEnergy={profile.energy}>
      {children}
    </EconomyProvider>
  );
}
```

### Pattern 2: Optimistic Economy Update with Animated Feedback

**What:** Client component calls a Server Action via `useTransition`. Before the server responds, the optimistic value is applied locally. On success, the real value from the server response updates the context. `AnimatedNumber` detects the value change and runs a count-up animation.

**When to use:** Every economy action — `awardLoot`, `spendEnergy`. The animation is the reward. Latency must not block it.

**Trade-offs:** Optimistic value may briefly differ from server value if the RPC fails (e.g., "Quest reward already claimed"). Handle the error case by resetting to the last confirmed value.

**Example:**
```typescript
// In a Client Component (e.g., DailyRewardButton)
import { useTransition } from "react";
import { awardLoot } from "@/lib/actions/economy";
import { useEconomy } from "@/contexts/EconomyContext";

export function DailyRewardButton() {
  const { gold, setGold } = useEconomy();
  const [isPending, startTransition] = useTransition();

  function handleClaim() {
    const prevGold = gold;
    setGold(gold + 50); // optimistic update → triggers AnimatedNumber count-up immediately
    startTransition(async () => {
      const result = await awardLoot(50, "daily_reward");
      if (result.success) {
        setGold(result.data.newGold); // sync to server-authoritative value
      } else {
        setGold(prevGold); // rollback
      }
    });
  }

  return (
    <button onClick={handleClaim} disabled={isPending}>
      {isPending ? "Claiming..." : "Claim Daily Reward"}
    </button>
  );
}
```

### Pattern 3: PIN Auth Over Supabase Email/Password

**What:** Use Supabase `signInWithPassword` with a synthetic email (`kid@agenty.local`) and the PIN as the password. First-time setup sends a magic link to the parent email, which creates the Supabase auth user and the `profiles` row. Daily logins use PIN only — fast, kid-friendly, no email required.

**When to use:** This is the auth architecture for this specific app. The kid never sees an email field.

**Trade-offs:** Single synthetic email means one Supabase user per installation. The PIN is the password — set a minimum of 4 digits. Magic link is recovery only; keep the URL in the `(auth)/auth/callback` route handler. Parent email is stored in `profiles`, not in Supabase auth.

**Example — PIN pad submit:**
```typescript
// (auth)/login/page.tsx
"use client";
import { createClient } from "@/lib/supabase/client";

async function handlePinSubmit(pin: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: "player@agenty.local",
    password: pin,
  });
  if (!error) router.push("/bridge");
}
```

**Example — magic link callback:**
```typescript
// (auth)/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/bridge", request.url));
}
```

### Pattern 4: `AnimatedNumber` as a Dumb Display Component

**What:** A single `AnimatedNumber` component takes a `value: number` prop. Internally it uses Framer Motion's `useMotionValue` + `useTransform` or `animate()` to count from the previous value to the new value. It has zero knowledge of Supabase, contexts, or Server Actions.

**When to use:** Wrap every economy stat display. Reuse in StatsBar gold, XP bar fill width, energy counter.

**Trade-offs:** Requires `"use client"` directive. Must import from `motion/react` (not `framer-motion`) for React 19 / Next.js 15 compatibility. Keep animation duration short (600–900ms) — kids' attention span favors fast feedback.

**Example:**
```typescript
// components/ui/AnimatedNumber.tsx
"use client";
import { useEffect, useRef } from "react";
import { animate } from "motion/react";

export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    const from = prevValue.current;
    prevValue.current = value;
    const controls = animate(from, value, {
      duration: 0.7,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString();
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span ref={ref}>{value.toLocaleString()}</span>;
}
```

---

## Data Flow

### Auth Flow (First-Time Setup)

```
Parent opens /login
    ↓
Click "Set up with magic link"
    ↓
Server Action sends magic link to parent email (Supabase signInWithMagicLink)
    ↓
Parent clicks email link → /auth/callback?code=xxx
    ↓
Route Handler: exchangeCodeForSession() → session cookie written
    ↓
Server Action: upsert profiles row (gold=0, xp=0, energy=480)
    ↓
Redirect → /bridge
```

### Auth Flow (Daily Login)

```
Kid opens / → middleware checks session → no session → redirect /login
    ↓
PinPad UI rendered (client component, full-screen)
    ↓
Kid enters 4-digit PIN → signInWithPassword("player@agenty.local", pin)
    ↓
Supabase validates → session cookie set
    ↓
middleware on next request sees valid session → /bridge renders
```

### Economy Mutation Flow (Award Loot)

```
Kid clicks "Claim Daily Reward" (Client Component)
    ↓
setGold(gold + 50)               ← optimistic, instant
AnimatedNumber starts counting up ← visual reward fires immediately
    ↓
startTransition → awardLoot(50, "daily_reward")  ← Server Action
    ↓
Server Action → supabaseAdmin.rpc("award_loot")  ← authoritative
    ↓
result.success → setGold(result.data.newGold)    ← sync to real value
result.error   → setGold(prevGold) + show toast  ← rollback
```

### Dashboard Initial Load

```
Browser requests /bridge
    ↓
middleware.ts: getClaims() → valid → pass through
    ↓
(dashboard)/layout.tsx (Server Component):
  supabase.from("profiles").select("gold,xp,energy")
    ↓
EconomyProvider receives initialGold, initialXp, initialEnergy
AgentProvider initializes with "cooper"
    ↓
bridge/page.tsx (Server Component or Client, either works):
  renders QuestCards, StatsBar, XPProgress from providers
    ↓
Browser paints with real data, no loading flash
```

### State Management

```
EconomyContext (client, in-memory)
    ↑ initialized from server fetch in layout
    ↓ read by: StatsBar, XPProgress, DailyRewardButton, QuestCard
    ↑ updated by: awardLoot() response, spendEnergy() response

AgentContext (client, in-memory)
    ↑ initialized to "cooper"
    ↓ read by: AgentSelector, QuestCard, CSS via data-agent attr
    ↑ updated by: AgentSelector click
```

---

## Component Build Order

Build in this sequence — each step unblocks the next:

| Step | What to Build | Unblocks |
|------|---------------|----------|
| 1 | `middleware.ts` — session check, redirect to `/login` | Everything (auth gate) |
| 2 | `(auth)/login/page.tsx` + `PinPad.tsx` — PIN entry UI | Daily login loop |
| 3 | `(auth)/auth/callback/route.ts` — magic link exchange | First-time setup |
| 4 | `EconomyContext.tsx` — client context with initial props | All wired components |
| 5 | `(dashboard)/layout.tsx` — server fetch, wrap providers | Bridge page with real data |
| 6 | `AnimatedNumber.tsx` — count-up display primitive | All economy animations |
| 7 | Wire `StatsBar` — replace hardcoded values with `EconomyContext` | Visual accuracy |
| 8 | `DailyRewardButton` — `awardLoot()` + optimistic update + animation | Reward loop |
| 9 | Wire `QuestCard` (demo) — `spendEnergy()` on start, `awardLoot(50)` on complete | Full quest loop |
| 10 | Wire `XPProgress`, `DailyStreak`, `RecentLoot` — Supabase reads | Sidebar accuracy |

---

## Anti-Patterns

### Anti-Pattern 1: Fetching Economy Data in Client Components

**What people do:** Add `useEffect(() => { supabase.from("profiles").select()... }, [])` inside `StatsBar` or `QuestCard` to get real data.

**Why it's wrong:** Every component fetches independently, causing a waterfall of loading spinners. Game UIs with skeleton loading states feel like SaaS, not a game. The adventure-navy aesthetic breaks down instantly.

**Do this instead:** Fetch once in the Server Component layout, hydrate `EconomyContext`, let all client components read from context synchronously.

### Anti-Pattern 2: Calling Economy RPCs Directly from Client

**What people do:** Import `supabase` client in a component and call `supabase.rpc("award_loot", ...)` directly in a click handler.

**Why it's wrong:** Violates the "Loot Guard" security model (CLAUDE.md). Client-side RPC calls can be replayed by a kid mashing F12. The service-role key would be exposed.

**Do this instead:** All `awardLoot()` and `spendEnergy()` calls go through `src/lib/actions/economy.ts` Server Actions only. Server Actions run server-side and authenticate via `supabase.auth.getUser()`.

### Anti-Pattern 3: Importing from `framer-motion` instead of `motion/react`

**What people do:** `import { motion, animate } from "framer-motion"` — the old import path.

**Why it's wrong:** Framer Motion renamed its React package to `motion/react` for React 19 compatibility. Next.js 15 uses React 19. The old import causes hydration errors or silent animation failures.

**Do this instead:** `import { motion, animate } from "motion/react"`. Install with `npm install motion`.

### Anti-Pattern 4: Putting AgentProvider and EconomyProvider in Root Layout

**What people do:** Add both providers to `app/layout.tsx` (the root layout).

**Why it's wrong:** The root layout wraps the auth pages too. The login screen should not have agent context — it will try to set `data-agent` on `<html>`, causing a layout mismatch, and may attempt economy reads before a session exists.

**Do this instead:** Both providers live in `(dashboard)/layout.tsx` only. Auth pages get a minimal layout (full-screen dark background, no providers).

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | `@supabase/ssr` cookie-based, server client in layout/actions, browser client in client components | Use `getClaims()` in middleware, not `getSession()`. Supabase docs now recommend `getClaims()` over `getUser()` for JWT validation. |
| Supabase DB (profiles) | Server Component fetch in `(dashboard)/layout.tsx`, then context | Single read per navigation, not per component |
| Supabase RPCs (award_loot, spend_energy) | Via `supabaseAdmin` in Server Actions only | Admin client never exposed to browser |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `(dashboard)/layout.tsx` → `EconomyProvider` | Props (`initialGold`, `initialXp`, `initialEnergy`) | One-way initialization; client owns state after that |
| Client Components → Server Actions | Direct async function call (Next.js bundler wires the RPC) | Use `useTransition` to avoid blocking UI |
| `EconomyContext` → `AnimatedNumber` | Value prop change triggers animation | `AnimatedNumber` is purely reactive to prop changes |
| `AgentContext` → CSS theme | `document.documentElement.setAttribute("data-agent", id)` | Existing pattern — keep as-is |
| `middleware.ts` → Auth pages | `NextResponse.redirect("/login")` | Matcher should exclude `/login`, `/auth/callback`, and `/_next/` |

---

## Scaling Considerations

This is a single-player, single-kid app. Scaling is not a concern. The architecture should optimize for development velocity and game feel, not for multi-tenancy or concurrency.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user (current) | Monolith is perfect. No queuing, no caching layer needed. |
| Parent adds siblings | Add a profile selector at `/login` before PIN entry. Each profile gets its own Supabase auth user. Architecture is unchanged. |
| Public release | Add Supabase Row Level Security (already configured per PROJECT.md). Add rate limiting in Server Actions. Replace synthetic email with real child accounts. |

---

## Sources

- [Supabase SSR + Next.js App Router (official)](https://supabase.com/docs/guides/auth/server-side/nextjs) — middleware pattern, getClaims() vs getSession()
- [Next.js Route Groups (official)](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) — (auth) vs (dashboard) separation
- [React useOptimistic (official)](https://react.dev/reference/react/useOptimistic) — optimistic UI pattern
- [React useActionState (official)](https://react.dev/reference/react/useActionState) — pending state for Server Actions
- [Next.js Updating Data (official)](https://nextjs.org/docs/app/getting-started/updating-data) — Server Actions + useTransition
- [motion/react compatibility note](https://github.com/vercel/next.js/discussions/72228) — React 19 requires `motion/react` import
- Existing codebase: `src/lib/actions/economy.ts`, `src/contexts/AgentContext.tsx`, `src/app/page.tsx`

---
*Architecture research for: Agenty — gamified kids' learning OS, auth + dashboard + economy UI milestone*
*Researched: 2026-03-10*
