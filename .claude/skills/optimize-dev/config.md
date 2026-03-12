# optimize-dev config — agenty

## Project Identity
- `memory_project_key` — `C--Users-duytr-Projects-agenty`
- `stack` — Next.js 16 (App Router), TypeScript 5, Tailwind CSS 4, Supabase, Vitest, motion (Framer Motion)

## Test Setup
- `e2e_dir` — `src/__tests__/` (Vitest unit tests, not Playwright E2E)
- `e2e_session_fn` — n/a (no Playwright; skip E2E session-caching checks)
- Test command: `npm run test` (vitest)

## Server Management
- `api_check_cmd` — n/a (no separate API server; Next.js handles everything)
- Dev server: `npm run dev` (Next.js only — no uvicorn/FastAPI to check)
- Skip uvicorn/FastAPI/dev.sh server checks — they don't apply

## Project-Specific Extra Checks

### Supabase Migrations
```
- supabase/migrations/ — verify files are sequential, no naming gaps
- supabase/.temp/ is gitignored (it is, but verify remains)
- .env.local contains NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY exists (used by Server Actions for admin ops)
```

### Server Actions Security (Loot Guard)
```
- All awardLoot() / spendEnergy() calls are ONLY in src/lib/actions/ (never in client components)
- Client components must never import from src/lib/supabase/admin.ts directly
- src/lib/supabase/admin.ts must only be imported from src/lib/actions/
```
How to check:
```bash
grep -rn "awardLoot\|spendEnergy" src/ --include="*.tsx" --include="*.ts" | grep -v "src/lib/actions/"
grep -rn "supabase/admin" src/ --include="*.tsx" --include="*.ts" | grep -v "src/lib/actions/"
```

### Adventure Navy Design System
```
- No hardcoded color values outside of Tailwind classes (should use design tokens, not hex)
- No 'bg-white', 'bg-gray-*', or 'text-black' in component files (corporate defaults)
- All agent accent colors use: blue (Cooper), orange (Arlo), green (Minh), violet (Maya)
```
How to check:
```bash
grep -rn "bg-white\|bg-gray\|text-black" src/components/ --include="*.tsx"
grep -rn "#[0-9a-fA-F]\{6\}" src/components/ --include="*.tsx"
```

### Bundle Size (agenty-specific)
```
- motion (Framer Motion) — verify only specific components are imported, not the whole lib
- lucide-react — named imports only (tree-shakeable)
- pdf-parse — must only be used server-side (serverExternalPackages is set in next.config.ts ✓)
- No client-side imports of supabase admin client
```

### CLAUDE.md / BRANDING.md / AGENTS.md Consistency
```
- BRANDING.md and AGENTS.md exist and are non-empty (required pre-read before all UI work)
- CLAUDE.md agent color map matches AGENTS.md definitions
- No stale file paths in CLAUDE.md that no longer exist
```
How to check:
```bash
wc -l BRANDING.md AGENTS.md CLAUDE.md
grep -oP '`src/[a-zA-Z/._-]+`' CLAUDE.md | tr -d '`' | while read f; do [ ! -f "$f" ] && echo "MISSING: $f"; done
```

## Checks to SKIP for This Project
- E2E Playwright session caching (no Playwright)
- loginOrRestore() usage (no Playwright)
- FastAPI / uvicorn server management
- Python pip dependencies
- dev.sh scripts (no dev.sh in this project)
- slowMo playwright config

## Checks to EMPHASIZE
1. Server Actions security (Loot Guard) — critical, check every audit
2. Supabase migration file health
3. Memory file freshness (MEMORY.md under 200 lines)
4. Design system compliance (no corporate defaults)
5. TypeScript incremental compilation (already set ✓ — just verify it stays)
6. .gitignore covers: `.next/`, `*.tsbuildinfo`, `.env*`, `supabase/.temp/`, `.worktrees/`
