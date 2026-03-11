# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**Database & Real-time:**
- Supabase - Primary backend service
  - SDK/Client: `@supabase/supabase-js` (2.99.0)
  - SSR Adapter: `@supabase/ssr` (0.9.0)
  - Auth: Supabase auth service (JWT-based)
  - URL env var: `NEXT_PUBLIC_SUPABASE_URL`
  - Key env var: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: Via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js` (JavaScript/TypeScript client)
  - Browser client: `src/lib/supabase/client.ts` → `createBrowserClient()`
  - Server client: `src/lib/supabase/server.ts` → `createServerClient()` with Next.js cookie integration
  - Usage: Persists quest data, player stats, loot inventory, daily streaks, XP progress

**File Storage:**
- Not configured - Appears to use local state or planned for future implementation

**Caching:**
- Not detected - No Redis, Memcached, or similar caching layer configured

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in)
  - Implementation: JWT-based with session management
  - Server-side: Uses Next.js cookies for session persistence
  - Client-side: Browser-based auth via `createBrowserClient()`
  - Cookie handling: Supabase SSR adapter manages `getAll()` and `setAll()` cookie operations
  - Location: `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts`

## Monitoring & Observability

**Error Tracking:**
- Not detected - No error tracking service (Sentry, Rollbar, etc.)

**Logs:**
- Not configured - Relies on browser console and Next.js default logging

**Analytics:**
- Not detected - No analytics service (Google Analytics, Mixpanel, etc.)

## CI/CD & Deployment

**Hosting:**
- Not specified in codebase - Likely Vercel (Next.js native) but not explicitly configured

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or similar workflow files

## Environment Configuration

**Required env vars:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Critical Notes:**
- Both vars are prefixed with `NEXT_PUBLIC_` - They ARE exposed to client-side code
- This is intentional for Supabase (anon key has read-only permissions per RLS)
- Sensitive server-only operations should use a service role key in a separate env var if needed

**Configuration Storage:**
- Development: `.env.local` (Git-ignored)
- Production: Environment variables configured in hosting platform (Vercel, etc.)

## Webhooks & Callbacks

**Incoming:**
- Not detected - No webhook endpoints configured

**Outgoing:**
- Not detected - No outbound integrations (email, Slack, Discord, etc.)

## Related Services (Not Yet Integrated)

**Per CLAUDE.md project guidelines:**
- LangGraph - Specified as part of tech stack but not yet in dependencies
- Framer Motion - Specified for animations but not yet in dependencies
- These are planned for future implementation as features expand

## Data Security

**Row-Level Security (RLS):**
- Supabase RLS policies should be configured in database (not visible in codebase)
- Anon key usage restricted to public/user-owned data via RLS

**Server vs. Client Auth:**
- Server-side operations: `src/lib/supabase/server.ts` with cookie-based sessions
- Client-side operations: `src/lib/supabase/client.ts` with anon key
- Server Actions can use elevated permissions if implemented with service role key

---

*Integration audit: 2026-03-10*
