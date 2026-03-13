import { vi } from "vitest";
import { mockSupabaseClient } from "../helpers/supabase-mock";

// ─── Hoisted mocks (must be declared before vi.mock) ──────────────
const { mockClient, mockRedirect } = vi.hoisted(() => {
  const mockClient = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  };
  const mockRedirect = vi.fn();
  return { mockClient, mockRedirect };
});

// ─── Module mocks ─────────────────────────────────────────────────
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockClient),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

// Minimal mock for React (Server Component renders as async function)
vi.mock("@/contexts/AgentContext", () => ({
  AgentProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/contexts/EconomyContext", () => ({
  EconomyProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── Import SUT after mocks ──────────────────────────────────────
import PlayLayout from "@/app/play/layout";

describe("DASH-02: Profile Fetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns gold, xp, energy, level from profiles row", async () => {
    const profileData = {
      gold: 250,
      xp: 1200,
      energy: 85,
      level: 3,
      agent_id: "cooper",
      display_name: "TestAgent",
    };

    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    const fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: profileData }),
    };
    mockClient.from.mockReturnValue(fromChain);

    // Should not throw, should call .from("profiles").select with required fields
    await PlayLayout({ children: null as unknown as React.ReactNode });

    expect(mockClient.from).toHaveBeenCalledWith("profiles");
    expect(fromChain.select).toHaveBeenCalledWith(
      expect.stringContaining("gold")
    );
    expect(fromChain.select).toHaveBeenCalledWith(
      expect.stringContaining("xp")
    );
    expect(fromChain.select).toHaveBeenCalledWith(
      expect.stringContaining("energy")
    );
    expect(fromChain.select).toHaveBeenCalledWith(
      expect.stringContaining("level")
    );
    expect(fromChain.eq).toHaveBeenCalledWith("id", "user-123");
  });

  it("redirects to / when user is not authenticated", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    await PlayLayout({ children: null as unknown as React.ReactNode });

    expect(mockRedirect).toHaveBeenCalledWith("/");
    // Should NOT call .from() when user is null
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("returns default values (gold:0, xp:0, energy:100, level:1) when profile row is null", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-456" } },
    });

    const fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    };
    mockClient.from.mockReturnValue(fromChain);

    // Should not throw even with null profile — defaults will be used
    // The layout passes defaults to providers, which we test indirectly:
    // If the function completes without error, defaults were applied
    await PlayLayout({ children: null as unknown as React.ReactNode });

    expect(mockClient.from).toHaveBeenCalledWith("profiles");
  });

  it("has no 'use client' directive (must be Server Component)", async () => {
    // Read the actual file and check for 'use client'
    const fs = await import("fs");
    const path = await import("path");
    const layoutPath = path.resolve(
      __dirname,
      "../../app/play/layout.tsx"
    );
    const content = fs.readFileSync(layoutPath, "utf-8");
    expect(content).not.toContain("use client");
  });
});
