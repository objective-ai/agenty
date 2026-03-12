# Testing Patterns

**Analysis Date:** 2026-03-10 (updated 2026-03-12)

## Test Framework

**Unit Test Runner:** Vitest (configured)
- Config: `vitest.config.ts` (Node environment, globals enabled)
- Run: `npm test` or `npx vitest`

**E2E Runner:** Playwright
- Test file: `tests/e2e/bridge-lab.spec.py`
- Run: `npm run test:e2e` (requires `npm run dev` running, `NEXT_PUBLIC_DEV_SKIP_AUTH=true`)
- Setup: `playwright install chromium` (one-time)

**Assertion Library:** Vitest built-in (`expect`, `describe`, `it`)

**Testing Status:** Basic infrastructure in place. Unit test stubs exist; E2E covers Mission Mode flow.

## Test File Organization

**Current Status:** Test stubs and E2E tests exist
- Unit test stubs: `src/__tests__/auth/` (callback, magic-link, middleware, pin-login, rate-limit, setup)
- Unit test stubs: `src/__tests__/dashboard/` (agent-context)
- E2E: `tests/e2e/bridge-lab.spec.py`

**Recommended Pattern (not yet implemented):**
- Location: Co-located with source
  - Example: `src/components/__tests__/AgentSelector.test.tsx` or `src/components/AgentSelector.test.tsx`
- Naming: Match component name with `.test.tsx` suffix
- Structure:
  ```
  src/
  ├── components/
  │   ├── AgentSelector.tsx
  │   ├── AgentSelector.test.tsx
  │   ├── QuestCard.tsx
  │   └── QuestCard.test.tsx
  ├── contexts/
  │   ├── AgentContext.tsx
  │   └── AgentContext.test.tsx
  └── lib/
      └── supabase/
          ├── client.ts
          └── client.test.ts
  ```

## Test Structure

**Component Testing Pattern (recommended):**
```typescript
import { render, screen } from '@testing-library/react';
import { AgentSelector } from '@/components/AgentSelector';
import { AgentProvider } from '@/contexts/AgentContext';

describe('AgentSelector', () => {
  it('renders all agents', () => {
    render(
      <AgentProvider>
        <AgentSelector />
      </AgentProvider>
    );

    expect(screen.getByText('Coach Cooper')).toBeInTheDocument();
    expect(screen.getByText('Arlo')).toBeInTheDocument();
  });

  it('sets active agent on click', () => {
    render(
      <AgentProvider>
        <AgentSelector />
      </AgentProvider>
    );

    const arloButton = screen.getByRole('button', { name: /arlo/i });
    fireEvent.click(arloButton);

    // Verify state change
  });
});
```

**Context Testing Pattern (recommended):**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAgent, AgentProvider } from '@/contexts/AgentContext';

describe('useAgent', () => {
  it('throws if used outside AgentProvider', () => {
    expect(() => {
      renderHook(() => useAgent());
    }).toThrow('useAgent must be used within AgentProvider');
  });

  it('returns active agent and setter', () => {
    const wrapper = ({ children }: any) => <AgentProvider>{children}</AgentProvider>;
    const { result } = renderHook(() => useAgent(), { wrapper });

    expect(result.current.activeAgent).toBe('cooper');
    expect(typeof result.current.setActiveAgent).toBe('function');
  });
});
```

**Setup/Teardown Pattern (recommended):**
```typescript
describe('Suite', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });
});
```

## Mocking

**Framework:** Would use `vitest.mock()` or `jest.mock()` (not yet implemented)

**Patterns (recommended):**
- Mock Supabase client for integration tests
  ```typescript
  vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => ({
      from: vi.fn(),
    })),
  }));
  ```
- Mock React hooks
  ```typescript
  vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
      ...actual,
      useState: vi.fn((initial) => [initial, vi.fn()]),
    };
  });
  ```

**What to Mock:**
- External API clients (Supabase)
- Browser APIs (localStorage, sessionStorage) when needed
- Custom hooks that fetch data

**What NOT to Mock:**
- Tailwind CSS classes (styles don't affect behavior)
- Standard React hooks (useState, useContext, useCallback)
- Simple utility functions (hexToRgb)
- TypeScript types

## Fixtures and Factories

**Test Data Pattern (recommended):**

Create `src/lib/test-utils/fixtures.ts`:
```typescript
import type { Agent, Quest } from '@/types';

export const mockAgents: Record<string, Agent> = {
  cooper: {
    id: 'cooper',
    name: 'Coach Cooper',
    title: 'Strategist',
    emoji: '🧠',
    domain: 'Strategy & Math',
  },
  arlo: {
    id: 'arlo',
    name: 'Arlo',
    title: 'Engineer',
    emoji: '⚙️',
    domain: 'Engineering & Physics',
  },
};

export const mockQuest: Quest = {
  id: 'q1',
  title: 'Fraction Fortress',
  description: 'Defend the castle...',
  agent: 'Coach Cooper',
  agentEmoji: '🧠',
  xp: 250,
  gold: 100,
  difficulty: 'Medium',
  progress: 65,
  status: 'active',
  timeEstimate: '~15 min',
};

export function createMockQuest(overrides?: Partial<Quest>): Quest {
  return { ...mockQuest, ...overrides };
}
```

**Location:** `src/lib/test-utils/fixtures.ts`

## Coverage

**Requirements:** Not enforced
- No coverage thresholds configured
- No coverage reporting tool installed

**Recommended Setup:**
```bash
# Run coverage
npm run test:coverage

# View coverage report
open coverage/index.html
```

**Recommended Thresholds (in package.json or vitest.config.ts):**
```json
{
  "coverage": {
    "provider": "v8",
    "reporter": ["html", "text"],
    "lines": 70,
    "functions": 70,
    "branches": 60,
    "statements": 70
  }
}
```

## Test Types

**Unit Tests:**
- Scope: Individual functions and hooks
- Examples to test:
  - `hexToRgb()` color conversion utility
  - `useAgent()` hook behavior
  - Component prop validation
- Approach: Fast, isolated, no external dependencies

**Integration Tests:**
- Scope: Component interaction with context/state
- Examples to test:
  - AgentSelector changes active agent in AgentContext
  - QuestCard renders different UI based on status prop
  - Page layout renders all components correctly
- Approach: Render multiple components together, test user flows

**E2E Tests:**
- Framework: Playwright (configured)
- Test file: `tests/e2e/bridge-lab.spec.py`
- Covers: Mission Mode page load, board activation, Cooper response, stat updates
- Manual testing: Use `playwright-cli` for interactive browser automation (login as Brando via PIN 123456)

## Common Patterns

**Async Testing (recommended):**
```typescript
describe('async operations', () => {
  it('waits for element to appear', async () => {
    render(<Component />);

    const element = await screen.findByText('Loaded');
    expect(element).toBeInTheDocument();
  });

  it('handles promises in handlers', async () => {
    const { result } = renderHook(() => useAsync());

    await act(async () => {
      await result.current.fetchData();
    });

    expect(result.current.data).toBeDefined();
  });
});
```

**Error Testing (recommended):**
```typescript
describe('error handling', () => {
  it('throws context error', () => {
    expect(() => renderHook(() => useAgent())).toThrow(
      'useAgent must be used within AgentProvider'
    );
  });

  it('catches Supabase errors gracefully', async () => {
    const { result } = renderHook(() => useSupabase());

    await act(async () => {
      const response = await result.current.query();
      expect(response.error).toBeDefined();
    });
  });
});
```

**React Component Testing (recommended):**
```typescript
describe('QuestCard', () => {
  it('renders available quest with accept button', () => {
    const quest = createMockQuest({ status: 'available' });
    render(<QuestCard quest={quest} />);

    expect(screen.getByText('Accept Quest')).toBeInTheDocument();
  });

  it('renders completed quest with checkmark', () => {
    const quest = createMockQuest({ status: 'completed' });
    render(<QuestCard quest={quest} />);

    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders progress bar for active quests', () => {
    const quest = createMockQuest({ status: 'active', progress: 65 });
    render(<QuestCard quest={quest} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle('width: 65%');
  });
});
```

## Setup Instructions (Not Yet Implemented)

**Install Testing Dependencies:**
```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

**Configuration (vitest.config.ts):**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      lines: 70,
      functions: 70,
      branches: 60,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Package.json Scripts (to add):**
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

---

*Testing analysis: 2026-03-10 (updated 2026-03-12 — Vitest + Playwright now configured)*
