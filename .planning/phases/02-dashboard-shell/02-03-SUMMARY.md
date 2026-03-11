---
phase: 02-dashboard-shell
plan: "03"
status: complete
started: 2026-03-11
completed: 2026-03-11
---

## Result
Bridge layout rebuilt as Server Component with full profile fetch. Hydrates EconomyProvider + AgentProvider from server data. Conditional routing on agent_id (picker vs HUD). Three shell pages created.

## Tasks
| # | Task | Status |
|---|------|--------|
| 1 | Rebuild bridge layout.tsx as full data-fetching Server Component | ✓ Complete |
| 2 | Replace placeholder bridge page + create 3 shell pages | ✓ Complete |

## Key Files

### Created
- `src/app/bridge/missions/page.tsx` — Mission Control shell
- `src/app/bridge/inventory/page.tsx` — Inventory shell with 1st-person dialogue
- `src/app/bridge/lab/page.tsx` — Lab shell with 1st-person dialogue

### Modified
- `src/app/bridge/layout.tsx` — Server Component, fetches profile, wraps in EconomyProvider + AgentProvider
- `src/app/bridge/page.tsx` — Conditional routing: AgentPicker placeholder vs HUD placeholder
- `src/__tests__/dashboard/profile-fetch.test.ts` — 4 real tests replacing stubs (DASH-02)

## Deviations
- Added `return` before redirect() for test compatibility (redirect() throws in real Next.js but not in mocks)
- Removed "use client" from comment text to avoid false positive in Server Component test

## Self-Check: PASSED
- No "use client" in layout.tsx: ✓
- No hardcoded data-agent="cooper" in page.tsx: ✓
- Shell pages exist at all 3 routes: ✓
- profile-fetch tests: 4/4 green
