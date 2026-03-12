# External Integrations

**Analysis Date:** 2026-03-10 (updated 2026-03-12)

## APIs & External Services

**Database & Real-time:**
- Supabase - Primary backend service
  - SDK/Client: `@supabase/supabase-js` (2.99.0)
  - SSR Adapter: `@supabase/ssr` (0.9.0)
  - Auth: Supabase auth service (JWT-based, magic-link + PIN login)
  - Vector: pgvector extension for knowledge embeddings (HNSW index)
  - URL env var: `NEXT_PUBLIC_SUPABASE_URL`
  - Key env var: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Admin key env var: `SUPABASE_SERVICE_ROLE_KEY` (server-only)

**AI / LLM (Phases 2.5–2.6):**
- Anthropic Claude (via AI SDK v6)
  - SDK: `ai` (Vercel AI SDK v6), `@ai-sdk/anthropic`
  - Model: `claude-sonnet-4-20250514`
  - Endpoints:
    - `/api/chat` — streaming chat with agent personas, Mission Mode tool calls (`updateStat`), grounded system prompts with Math-First Rule
    - `/api/generate-mission` — structured object generation via `generateObject` with Zod schema, 11-rule validation, single retry on failure
  - Key env var: `ANTHROPIC_API_KEY`
- OpenAI (embeddings only)
  - SDK: `openai`
  - Model: `text-embedding-3-small` (1536 dimensions)
  - Key env var: `OPENAI_API_KEY`
  - Used for: PDF chunk embeddings in `knowledge_base` for RAG retrieval

**Animation:**
- Framer Motion via `motion/react`
  - Import: `from "motion/react"` (NOT `framer-motion` — avoids React 19 hydration errors)
  - Used for: AnimatePresence, briefing board transitions, Intel Drawer slide-over

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: Via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js` (JavaScript/TypeScript client)
  - Browser client: `src/lib/supabase/client.ts` → `createBrowserClient()`
  - Server client: `src/lib/supabase/server.ts` → `createServerClient()` with Next.js cookie integration
  - Tables: profiles, loot_ledger, energy_logs, knowledge_base, pin_attempts, missions
  - Usage: Persists quest data, player stats, loot inventory, daily streaks, XP progress, AI-generated missions
  - RPCs: `award_loot`, `spend_energy`, `get_uid_by_email` (via supabaseAdmin)

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
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...          # server-only, admin operations
ANTHROPIC_API_KEY=sk-ant-...                   # server-only, Claude chat
OPENAI_API_KEY=sk-...                          # server-only, embeddings
NEXT_PUBLIC_SITE_URL=http://localhost:3000      # magic-link redirect base
NEXT_PUBLIC_DEV_SKIP_AUTH=true                  # dev only, bypasses auth gates
```

**Critical Notes:**
- `NEXT_PUBLIC_` vars ARE exposed to client-side code (intentional for Supabase anon key)
- `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` are server-only — never prefix with `NEXT_PUBLIC_`
- `NEXT_PUBLIC_DEV_SKIP_AUTH` must be `false` in production

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
- LangGraph - Specified as part of tech stack but not yet in dependencies (deferred until multi-step agent workflows needed)

## Data Security

**Row-Level Security (RLS):**
- RLS policies on: profiles, loot_ledger, energy_logs, knowledge_base, pin_attempts, missions
- Missions table: parents CRUD own rows (created_by = auth.uid()::text), anyone reads active missions
- Anon key usage restricted to public/user-owned data via RLS

**Server vs. Client Auth:**
- Server-side operations: `src/lib/supabase/server.ts` with cookie-based sessions
- Client-side operations: `src/lib/supabase/client.ts` with anon key
- Server Actions can use elevated permissions if implemented with service role key

---

*Integration audit: 2026-03-10 (updated 2026-03-12 — added Anthropic, OpenAI, motion/react, missions table, economy RPCs)*
