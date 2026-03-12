# AGENTY: ARCHITECTURAL GUIDELINES

## Mission
Build a gamified learning OS for a 9-year-old. High reward density, AAA game feel, zero corporate "SaaS" aesthetics.

## The Dual-Engine Workflow
- **Claude Code (CLI/Sub):** Primary for backend, heavy logic, and repo-wide refactors. Focus on cost-efficiency.
- **Cline (Extension/API):** Surgical UI/UX implementation, Framer Motion animations, and complex layout work.

## Development Standards
- **Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase, LangGraph.
- **UI Aesthetic:** "Adventure Navy" (#050B14). Deep shadows, chunky 2px borders, neon accent glows based on active Agent (Cooper: Blue, Arlo: Orange, Minh: Green, Maya: Violet).
- **Efficiency:** - Reuse components.
  - Minimize "Thinking" tokens for simple tasks.
  - Always update `PLAN.md` before executing multi-file changes.
  - Prioritize Server Actions over heavy client-side logic.
- **Docs-as-Code:** When completing a phase or making architectural changes, update the relevant docs before committing:
  - `PLAN.md` — Mark phase/tasks complete, set next phase
  - `CLAUDE.md` — Update gotchas if behavior changed (e.g. new tools, removed tools, new patterns)
  - `AGENTS.md` — Update tool definitions or protocol if agent behavior changed
  - `.planning/STATE.md` — Update current position and last activity
  - `.planning/ROADMAP.md` — Mark phases complete, add inserted phases
  - `.planning/codebase/ARCHITECTURE.md` — Update if new layers, data flows, or abstractions added
  - `.planning/codebase/INTEGRATIONS.md` — Update if new external services added
  - `.planning/codebase/CONCERNS.md` — Mark resolved items with ~~strikethrough~~ and (RESOLVED) tag
  - Spec docs (`docs/superpowers/specs/`) — Add deprecation warnings if design changed post-implementation
  - **Outdated docs cause agents to waste hours debugging the wrong thing.** This is not optional.

## Security (The "Loot Guard")
- All `awardLoot()` or `spendEnergy()` calls MUST happen in isolated Server Actions.
- Clients can only "request" a transaction; the server validates and executes.

CRITICAL: Before writing any code (Tailwind/Framer Motion), generating UI, or drafting dialogue, agents MUST read BRANDING.md and AGENTS.md. Strictly adhere to the 'Adventure Navy' design system—no corporate defaults, no generic components, and no breaking character.

## Known Gotchas (Hard-Won)

### Next.js Middleware
- Next.js only loads `src/middleware.ts` (or root `middleware.ts`) as middleware. `src/proxy.ts` is silently ignored — no redirects will fire.
- The real middleware entrypoint is `src/lib/supabase/middleware.ts` via `src/proxy.ts`, but since proxy.ts isn't loaded, middleware does nothing. This causes `BridgeLayout` to handle auth itself.
- **Dev auth bypass requires 3 touch points:** `src/lib/supabase/middleware.ts` (early return), every server component layout that calls `supabase.auth.getUser()` (use `getAuthUser()` from `src/lib/supabase/server.ts`), and every Server Action (check `NEXT_PUBLIC_DEV_SKIP_AUTH`).

### AI SDK v6 (package: `ai@^6`)
- `maxSteps` does not exist in v6. Use `stopWhen: stepCountIs(N)` imported from `"ai"`.
- Tools with an `execute` function are **static tools** — on the client, their message parts have type `"tool-<toolName>"` (e.g. `"tool-updateStat"`), NOT `"dynamic-tool"`.
- Tools without `execute` are **dynamic tools** — parts have type `"dynamic-tool"` with a `toolName` property.
- Always add `execute: async () => ({ ok: true })` to mission tools. Without it, Claude calls the tool and stops — no text response is generated in step 2.
- When intercepting tool calls client-side (`CommsPanel`), deduplicate on `toolCallId` or `toolName-JSON(input)`. The effect fires multiple times per message as state progresses (`input-available` → `output-available`).

### Mission Mode Architecture
- **UI activation is client-side, deterministic.** The briefing board activates on mount via `dispatch(MISSION_INIT)` with `config.defaultObjective`. It does NOT wait for the AI to call a tool.
- **Never couple UI state to `toolChoice: "auto"`.** The model may skip tool calls non-deterministically. Only use tools for data updates (e.g. `updateStat`), not page state transitions.
- **System prompts must include mission context.** Inject `missionConfig.title`, `missionConfig.description`, and stat goals into the prompt. A mission ID alone causes hallucination.
- The only mission tool is `updateStat` — called when the student's answer is confirmed correct. There is no `initMission` tool (removed: board activates client-side).

### Command Deck / Mission Generation
- `/api/generate-mission` uses `generateObject` (not `streamText`) — returns structured JSON, not streaming.
- The 11-rule validator (`src/lib/missions/validator.ts`) is deterministic and code-level — it does NOT call the LLM. If validation fails, the route retries once with error feedback injected into the prompt.
- `missions.created_by` is `text`, not `uuid` — supports "dev-user" string in dev mode. RLS policies compare `auth.uid()::text`.
- Template manifests (`src/lib/missions/templates.ts`) are the source of truth for SVG zone IDs. The LLM must reference zones from the manifest; the validator rejects unknown zone IDs.

### Economy / Loot Guard
- `awardLoot(amount, source, questId?)` — the `amount` parameter exists but is set server-side. Never pass client-supplied amounts.
- `spendEnergy(energyCost, activity)` — same pattern: server determines cost.
- Dashboard components (`XPProgress`, `DailyStreak`, `StatsBar`, `RecentLoot`) currently use **hardcoded data** — they are NOT wired to Supabase yet (Phase 3 work).

### Mission Registry
- `resolveMission(idOrSlug)` checks Supabase `missions` table first, then falls back to static `MISSION_REGISTRY`. Always use this function instead of direct registry access.
- `getAllActiveMissions()` merges static + DB missions. Used by `/bridge/missions/page.tsx`.

### E2E Testing
- Run `npm run test:e2e` to execute the Playwright suite against the local dev server.
- Requires: `npm run dev` running, `NEXT_PUBLIC_DEV_SKIP_AUTH=true` in `.env.local`, `playwright install chromium` (one-time).
- Test file: `tests/e2e/bridge-lab.spec.py`