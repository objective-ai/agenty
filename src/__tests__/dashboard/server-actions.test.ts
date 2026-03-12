import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase admin
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockLimitResult = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => {
      mockFrom(...args);
      return {
        select: (...sArgs: unknown[]) => {
          mockSelect(...sArgs);
          return {
            eq: (...eArgs: unknown[]) => {
              mockEq(...eArgs);
              return {
                single: () => mockSingle(),
                order: (...oArgs: unknown[]) => {
                  mockOrder(...oArgs);
                  return {
                    limit: (n: number) => {
                      mockLimit(n);
                      return mockLimitResult();
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  },
}));

// Mock supabase server (createClient + getAuthUser)
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
  getAuthUser: vi.fn(),
  DEV_USER_ID: "dev-user-123",
}));

// Set dev skip auth to use DEV_USER_ID
beforeEach(() => {
  vi.resetAllMocks();
  process.env.NEXT_PUBLIC_DEV_SKIP_AUTH = "true";
});

describe("claimDaily", () => {
  it("calls awardLoot with hardcoded amount=25, source='daily_bonus', and date-based quest_id", async () => {
    // Mock the awardLoot rpc call
    mockRpc.mockResolvedValueOnce({
      data: [{ new_gold: 125, ledger_id: "led-1" }],
      error: null,
    });

    const { claimDaily } = await import("@/lib/actions/economy");
    const result = await claimDaily();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.newGold).toBe(125);
    }

    // Verify rpc was called with correct params
    expect(mockRpc).toHaveBeenCalledWith("award_loot", {
      p_profile_id: "dev-user-123",
      p_amount: 25,
      p_source: "daily_bonus",
      p_quest_id: expect.stringMatching(/^daily_claim_\d{4}-\d{2}-\d{2}$/),
      p_description: null,
    });
  });

  it("returns error on double-claim (idempotent via quest_id unique index)", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "idx_loot_ledger_quest_unique" },
    });

    const { claimDaily } = await import("@/lib/actions/economy");
    const result = await claimDaily();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Quest reward already claimed");
    }
  });
});

describe("getProfile", () => {
  it("returns profile data for authenticated user", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { gold: 100, xp: 500, energy: 80, level: 3, streak_days: 5 },
      error: null,
    });

    const { getProfile } = await import("@/lib/actions/economy");
    const result = await getProfile();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        gold: 100,
        xp: 500,
        energy: 80,
        level: 3,
        streak_days: 5,
      });
    }

    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockSelect).toHaveBeenCalledWith("gold, xp, energy, level, streak_days");
    expect(mockEq).toHaveBeenCalledWith("id", "dev-user-123");
  });

  it("returns error when not authenticated", async () => {
    // Temporarily disable dev skip auth so getAuthenticatedUserId checks real auth
    process.env.NEXT_PUBLIC_DEV_SKIP_AUTH = "false";

    // Mock createClient to return null user
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const { getProfile } = await import("@/lib/actions/economy");
    const result = await getProfile();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Not authenticated");
    }

    // Restore
    process.env.NEXT_PUBLIC_DEV_SKIP_AUTH = "true";
  });
});

describe("getRecentLoot", () => {
  it("returns recent loot entries sorted newest first, defaults to limit=10", async () => {
    const mockEntries = [
      { id: "l1", amount: 25, source: "daily_bonus", description: null, created_at: "2026-03-12T00:00:00Z" },
      { id: "l2", amount: 10, source: "quest", description: "Quest complete", created_at: "2026-03-11T00:00:00Z" },
    ];
    mockLimitResult.mockReturnValueOnce({ data: mockEntries, error: null });

    const { getRecentLoot } = await import("@/lib/actions/economy");
    const result = await getRecentLoot();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe("l1");
    }

    expect(mockFrom).toHaveBeenCalledWith("loot_ledger");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(mockLimit).toHaveBeenCalledWith(10);
  });

  it("respects custom limit parameter", async () => {
    mockLimitResult.mockReturnValueOnce({ data: [], error: null });

    const { getRecentLoot } = await import("@/lib/actions/economy");
    await getRecentLoot(5);

    expect(mockLimit).toHaveBeenCalledWith(5);
  });
});
