# Stack Research

**Domain:** Gamified kids' learning OS — auth, animated dashboard, economy wiring
**Researched:** 2026-03-10
**Confidence:** HIGH (locked stack), MEDIUM (PIN auth pattern), HIGH (animation APIs)

---

## Locked Stack (Do Not Revisit)

The following are already installed and in use. Research below targets only what is missing.

| Technology | Installed Version | Role |
|------------|------------------|------|
| Next.js | 16.1.6 | App Router framework |
| React | 19.2.3 | UI runtime |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4 | Utility styling, CSS-first config |
| @supabase/supabase-js | ^2.99.0 | Database + Auth client |
| @supabase/ssr | ^0.9.0 | Server-side cookie-based auth helpers |

Supabase client wrappers already exist at `src/lib/supabase/client.ts` (browser) and `src/lib/supabase/server.ts` (server). Do not recreate them.

---

## Recommended Additions

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `motion` (npm) | ^12.35.x | Reward animations, number counters, page transitions | Rebranded from framer-motion in late 2024. `motion/react` is the current import path. Same API, better tree-shaking. Latest stable: 12.35.2 (Mar 2026). No breaking changes from framer-motion v11. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-pin-field` | ^3.x | 4-digit PIN input component | The kid's daily login PIN entry. Accessible (ARIA labels per digit), supports React 19, uncontrolled by default with `onComplete` callback. Zero dependency on UI kit. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `middleware.ts` (built-in) | Supabase token refresh on every route | Already the Supabase SSR requirement. Must call `supabase.auth.getUser()` in middleware, not `getSession()`. Place at `src/middleware.ts`. |

---

## Auth Architecture: PIN + Magic Link

### The Two-Flow Design

This project needs two auth flows that serve different actors:

**Flow 1: Parent Setup (First-Time + Recovery)**
- Parent receives a magic link to their email
- Supabase `signInWithOtp({ email, options: { emailRedirectTo } })` — sends 6-digit OTP code or magic link URL
- Default behavior is magic link URL; to send a numeric OTP code instead, modify the email template in Supabase Dashboard → Auth → Email Templates
- After OTP verification with `supabase.auth.verifyOtp({ email, token, type: 'email' })`, session is established and profile row is created
- Rate limit: 1 request per 60 seconds, codes expire after 1 hour

**Flow 2: Kid Daily Login (PIN)**
- Kid enters a 4–6 digit PIN on the `/login` screen
- PIN is stored as the account password in Supabase Auth
- Use `signInWithPassword({ email: PARENT_EMAIL, password: PIN })`
- Supabase minimum password length is **6 characters** (configurable in Dashboard → Auth → Providers → Email → Min Password Length, minimum allowed is 6)
- **Use a 6-digit PIN** to satisfy this constraint cleanly — no padding hacks needed
- 4-digit PIN requires padding workaround (e.g., append `XX` suffix server-side) — avoid this complexity

**Why not use phone OTP for PIN?**
Phone login requires SMS provider (Twilio, etc.), which adds cost and infra complexity. The parent-email-as-account-identity + 6-digit PIN password is simpler and sufficient for a single-child household.

**Why not magic link for daily login?**
A 9-year-old cannot reliably check email. The PIN is the daily UX; magic link is the parent-assisted recovery path only.

### Profile Creation on First Login

Use a Supabase Auth Hook (Database Webhook) or handle in the Server Action after `verifyOtp` succeeds: insert a row into `profiles` if one does not exist. Do not replicate this logic in the client.

---

## Animation Architecture: Framer Motion (motion package)

### Install

```bash
npm install motion
```

Import from `motion/react` (not `framer-motion`) for new code. The `framer-motion` package is still published and uses identical API — either works, but `motion` is the canonical package going forward.

### Key APIs for This Project

| API | Use Case | Pattern |
|-----|---------|---------|
| `motion.div` | Wrapper for animated layout elements (quest cards, reward panels) | `<motion.div initial animate exit>` |
| `AnimatePresence` | Mount/unmount animations (agent selection, reward modal appearing) | Wrap conditional renders |
| `useSpring` + `useTransform` | Gold counter counting up after loot award | Spring physics on a MotionValue |
| `useMotionValue` + `animate()` | Direct DOM number updates without React re-renders | Fastest pattern for high-frequency number changes |
| `layout` prop | Smooth reflow when stats bar expands/contracts | `<motion.div layout>` |

### Gold Counter Pattern (Proven Recipe)

The BuildUI animated counter recipe (buildui.com/recipes/animated-counter) is the industry reference. It uses:

1. `useSpring(motionValue, { mass: 0.8, stiffness: 75, damping: 15 })` — spring-smoothed value
2. `useTransform(spring, Math.round)` — round to integer
3. Per-digit absolute-positioned columns that scroll vertically via `translateY`
4. Each digit column renders 0–9 stacked; `(10 + digit - placeValue) % 10` calculates the Y offset

This produces the "slot machine" digit-flip effect that reads as "game UI" to a child. It is the correct pattern over a simple `useEffect` lerp.

### Next.js App Router Constraint

All motion components must be in Client Components. Standard pattern:

```typescript
// src/components/motion-wrappers.tsx
"use client";
export { motion, AnimatePresence } from "motion/react";
```

Import from this wrapper in Server Component trees. Do not add `"use client"` to every leaf — create one shared wrapper file.

---

## Installation

```bash
# Animation (the only missing runtime dependency)
npm install motion

# PIN input UI
npm install react-pin-field
```

No other runtime packages are needed. The Supabase clients, Tailwind, and Next.js are already configured.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `motion` (npm) | `framer-motion` (npm) | Identical API; `motion` is the active package. Either works since both are published by the same team. Prefer `motion` for new installs to align with docs. |
| `motion` | `react-spring` | react-spring has excellent physics but smaller ecosystem of recipes. Framer Motion is the dominant React animation library (more examples, more Stack Overflow coverage). For a kids' game feel, both are capable; Framer Motion wins on DX. |
| `motion` | GSAP | GSAP is more powerful for timeline-driven sequences but has a heavier API surface and licensing considerations for commercial use. Overkill for this scope. |
| 6-digit PIN as password | 4-digit PIN | Supabase enforces a 6-character minimum — 4-digit requires a padding hack that adds hidden state complexity. 6 digits is equally easy for a 9-year-old and cleaner technically. |
| Email OTP for first-time/recovery | SMS OTP | SMS requires Twilio/phone provider setup. Email magic link is free, requires no external provider, and the parent handles email anyway. |
| `react-pin-field` | Custom PIN input | Custom implementation needs to handle focus management, backspace, paste, and ARIA — that's ~100 lines of boilerplate. react-pin-field solves all of it with React 19 support. |
| `react-pin-field` | Chakra UI PinInput | Project explicitly avoids component libraries. react-pin-field is headless/unstyled — you apply game-themed CSS yourself. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@supabase/auth-helpers-nextjs` | Deprecated. All bug fixes have moved to `@supabase/ssr`. Already removed from active support. | `@supabase/ssr` (already installed) |
| `supabase.auth.getSession()` in middleware | Returns unvalidated JWT claims from cookies — can be spoofed. Supabase explicitly recommends against this for protecting routes. | `supabase.auth.getUser()` — always makes a network call to validate |
| shadcn/ui, Radix, MUI | Enforces visual identity that conflicts with the "Adventure Navy" game aesthetic. Even headless components carry CSS opinions that fight custom themes. | Custom components with Tailwind v4 tokens already defined in globals.css |
| 4-digit PIN | Supabase 6-character minimum requires padding hack. Adds hidden state, harder to debug auth failures. | 6-digit PIN — same UX for a kid, zero backend complexity |
| `framer-motion` package (new import) | Still published and works, but `motion` is the canonical package per motion.dev docs 2025. Import from `motion/react`. | `npm install motion`, import from `motion/react` |
| `tailwindcss-animate` | Not compatible with Tailwind v4 PostCSS plugin architecture without migration work. | Framer Motion handles all animation needs; no CSS animation utility library needed |

---

## Stack Patterns by Variant

**For the kid login route (`/login`):**
- Full-page client component (needs PIN input state)
- `react-pin-field` for 6-digit PIN entry
- On `onComplete`: call Server Action that wraps `signInWithPassword`
- On success: `router.push('/bridge')` (the dashboard)

**For the parent setup route (`/setup` or `/auth/callback`):**
- Server Action sends magic link: `supabase.auth.signInWithOtp({ email })`
- Email template in Supabase Dashboard configured to show 6-digit code (not URL link)
- Verification page: user enters 6-digit code, Server Action calls `verifyOtp`
- On success: create `profiles` row if missing, redirect to `/bridge`

**For animated gold counter (`StatsBar` or reward modal):**
- Client component with `"use client"`
- Import `useSpring`, `useTransform`, `motion` from `motion/react`
- Receive `goldValue` prop; spring animates on prop change
- Per-digit column layout for slot-machine visual effect

**For quest completion reward animation:**
- `AnimatePresence` wraps the reward overlay
- `motion.div` with `initial={{ scale: 0, opacity: 0 }}`, `animate={{ scale: 1, opacity: 1 }}`, spring transition
- Trigger gold counter via state update after `awardLoot()` Server Action resolves

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|----------------|-------|
| `motion` ^12.x | React 19.x | Confirmed. React 19 support added. |
| `motion` ^12.x | Next.js 16.x | Works. Requires `"use client"` on all components using motion APIs. Create a wrapper file to avoid scattering directives. |
| `@supabase/ssr` ^0.9.0 | Next.js 16.x / React 19 | Already installed and working per existing client.ts/server.ts. |
| `react-pin-field` ^3.x | React 19 | Confirmed React 19 support in latest release. |
| Tailwind CSS ^4 | Next.js 16.x | Works. CSS-first config (no tailwind.config.js by default). `@tailwindcss/postcss` is the PostCSS plugin — already in devDependencies. |

---

## Sources

- `@supabase/ssr` package and migration path — https://supabase.com/docs/guides/auth/auth-helpers/nextjs (MEDIUM confidence; docs confirmed SSR as canonical package)
- Supabase Next.js SSR setup guide — https://supabase.com/docs/guides/auth/server-side/nextjs (HIGH confidence; official docs)
- Supabase email OTP flow — https://supabase.com/docs/guides/auth/passwordless-login/auth-email-otp (HIGH confidence; official docs)
- Supabase minimum password length — https://github.com/orgs/supabase/discussions/13315 (MEDIUM confidence; community discussion confirms 6-char minimum on managed platform)
- Motion changelog and versioning — npm search result confirming 12.35.2 as of March 2026 (HIGH confidence; npm registry data)
- Motion + Next.js "use client" pattern — https://www.hemantasundaray.com/blog/use-framer-motion-with-nextjs-server-components (MEDIUM confidence; verified pattern is standard community approach)
- Animated counter recipe — https://buildui.com/recipes/animated-counter (HIGH confidence; well-known reference implementation using useSpring + useTransform)
- react-pin-field React 19 support — https://github.com/soywod/react-pin-field (MEDIUM confidence; WebSearch confirmed React 19 support)
- Tailwind v4 + Next.js 15/16 compatibility — https://github.com/vercel/next.js/discussions/82623 (MEDIUM confidence; community discussion)

---

*Stack research for: Agenty — gamified kids learning OS, auth + animated dashboard milestone*
*Researched: 2026-03-10*
