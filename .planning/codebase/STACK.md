# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript 5.x - Full codebase for type safety across Next.js application and components

**Secondary:**
- CSS 4 (with Tailwind CSS) - Styling with custom design tokens
- JavaScript (ESNext) - Build configuration and tooling

## Runtime

**Environment:**
- Node.js (16+) - Based on dependencies and Next.js 16 compatibility
- Browser (React 19.2.3) - Client-side rendering

**Package Manager:**
- npm 10+ (inferred)
- Lockfile: `package-lock.json` (present, version 3)

## Frameworks

**Core:**
- Next.js 16.1.6 - App Router, Server Components, Server Actions
  - Located: Root level configuration in `next.config.ts`
- React 19.2.3 - UI components and state management
- React DOM 19.2.3 - Browser DOM rendering

**Styling:**
- Tailwind CSS 4.x - Utility-first CSS framework with PostCSS integration
- @tailwindcss/postcss 4.x - PostCSS plugin for Tailwind v4
- PostCSS - CSS transformation via `postcss.config.mjs`

**Testing:**
- Not configured (no test runner or assertion libraries in dependencies)

**Build/Dev:**
- ESLint 9 - Code linting with Next.js defaults
- eslint-config-next 16.1.6 - Next.js linting rules
- TypeScript compiler - Type checking and transpilation

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.99.0 - Official Supabase JavaScript client for database, auth, and real-time features
- @supabase/ssr 0.9.0 - Supabase Server-Side Rendering support for Next.js (handles auth cookie management)

**Infrastructure:**
- supabase 2.78.1 - Supabase CLI for database migrations, local dev environment, and deployments

**Type Definitions:**
- @types/node 20.x - Node.js type definitions
- @types/react 19.x - React type definitions
- @types/react-dom 19.x - React DOM type definitions

## Configuration

**Environment:**
- Environment configuration via `.env.local` (not tracked in git)
- Required variables:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (exposed to client)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key (exposed to client)

**Build:**
- TypeScript: `tsconfig.json`
  - Target: ES2017
  - Module: ESNext
  - JSX: react-jsx
  - Path aliases: `@/*` → `./src/*`
  - Strict mode enabled
  - Isolated modules enabled
- ESLint: `eslint.config.mjs`
  - Uses `eslint/config` flat config format
  - Extends: nextVitals and nextTs from eslint-config-next
  - Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- PostCSS: `postcss.config.mjs`
  - Single plugin: @tailwindcss/postcss

**Styling:**
- Tailwind CSS integrated via PostCSS
- Custom theme variables in `src/app/globals.css` using CSS custom properties
- No separate `tailwind.config.js` (using inline theme definitions in CSS)

## Platform Requirements

**Development:**
- Node.js 16+
- npm (or compatible package manager)
- Modern browser with ES2017+ support
- Recommended: Visual Studio Code with TypeScript, ESLint, and Tailwind CSS IntelliSense extensions

**Production:**
- Node.js 16+ runtime for Next.js server
- Deployment target: Vercel (Next.js native) or any Node.js hosting (AWS Lambda, Heroku, Docker, etc.)
- Supabase hosted backend (cloud database, auth, real-time subscriptions)

## CSS Architecture

**Design System:**
- Adventure Navy theme (#050B14) - Deep dark backgrounds for game aesthetic
- Custom CSS variables in `:root` scope:
  - Background layers: abyss, deep, surface, raised, elevated
  - Text hierarchy: primary, secondary, tertiary, muted
  - Accents: gold (default), amber, emerald, danger
  - Agent tints: Cooper (blue), Arlo (orange), Minh (green), Maya (violet)
  - Spacing scale: 4px base unit (--space-1 through --space-16)
  - Border and shadow system with semantic naming
- Agent-specific theme overrides via `[data-agent="agentName"]` attribute selectors
- Tailwind v4 inline theme configuration mapping CSS vars to Tailwind utilities

## NPM Scripts

```bash
npm run dev         # Start Next.js development server
npm run build       # Build optimized production bundle
npm start           # Start production Next.js server
npm run lint        # Run ESLint
```

---

*Stack analysis: 2026-03-10*
