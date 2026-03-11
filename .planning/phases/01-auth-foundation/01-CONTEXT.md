# Phase 1: Auth Foundation - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Parent magic-link account setup + kid 6-digit PIN daily login + brute-force rate limiting + PKCE session handling + guaranteed profiles row. Auth screens use the Adventure Navy theme with game-flavored UI. No dashboard features — those are Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Login Screen Feel
- Adventure Navy (#050B14) dark theme with a massive, chunky 6-digit PIN pad as the centerpiece
- Cooper is the mascot on the login screen, giving a tactical greeting (e.g., "Ready for your mission, Agent?")
- Game-themed, not corporate — chunky borders, neon blue (Cooper's accent #3B82F6), deep shadows
- PIN pad digits should be large, tactile-feeling buttons sized for iPad touch targets

### Parent Setup Flow
- Magic link sends the parent to a dedicated `/setup` route
- On `/setup`, the parent chooses the initial 6-digit PIN for the kid
- PIN creation on `/setup` must trigger the profile row creation in Supabase (upsert into `profiles`)
- This is the single entry point for account creation — no other signup flow
- Synthetic email pattern (e.g., `player-{id}@agenty.local`) mapped to `signInWithPassword` for kid's PIN login

### Lockout Experience
- After 5 failed PIN attempts within 15 minutes, show a "Tactical Lockdown" message from Cooper
- Friendly, not scary — Cooper delivers the lockout as a game mechanic, not a punishment
- Include a 15-minute countdown timer showing when the kid can try again
- Recovery path: parent can use magic link to bypass lockout and reset PIN

### Session & Routing
- Session duration: 24 hours before requiring re-login
- Any unauthenticated hit to `/bridge/*` redirects to the PIN login screen — never a blank page
- Root `/` route serves as the PIN login (or redirects to `/bridge` if already authenticated)
- After successful PIN entry, redirect to `/bridge` (The Bridge dashboard)

### Claude's Discretion
- Exact PKCE callback route handler implementation (`/auth/callback/route.ts`)
- Middleware implementation details for route protection
- PIN hashing approach (if needed beyond Supabase's built-in password hashing)
- Exact Supabase `pin_attempts` table schema for rate limiting
- Loading states and transition animations between auth screens

</decisions>

<specifics>
## Specific Ideas

- Cooper's greeting should feel tactical/military-game-flavored: "Ready for your mission, Agent?" not "Welcome back!"
- The PIN pad should feel like entering a code to unlock a vault or command center — chunky, satisfying buttons
- "Tactical Lockdown" as the lockout framing keeps it fun — the kid isn't punished, the base is just secured
- The 15-minute countdown timer is the only FOMO-adjacent timer allowed (it's a security mechanic, not a dark pattern)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/client.ts`: Browser Supabase client — use for client-side auth calls
- `src/lib/supabase/server.ts`: Server Supabase client with cookie handling — use in Server Actions and route handlers
- `src/contexts/AgentContext.tsx`: Agent definitions with Cooper's color (#3B82F6) — reuse for login screen theming
- `src/app/globals.css`: Full Adventure Navy design token system — apply to auth screens

### Established Patterns
- `@supabase/ssr` cookie-based auth pattern already set up in server client
- `data-agent` attribute selector pattern for agent-specific theming
- CSS custom properties for all design tokens (spacing, shadows, borders)

### Integration Points
- `middleware.ts` (to be created) — intercepts all routes, checks session, redirects
- `/auth/callback/route.ts` (to be created) — PKCE code exchange endpoint
- `/setup` route (to be created) — parent magic link landing + PIN creation
- Root `page.tsx` — currently serves the dashboard, will become login or redirect based on auth state

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-auth-foundation*
*Context gathered: 2026-03-11*
