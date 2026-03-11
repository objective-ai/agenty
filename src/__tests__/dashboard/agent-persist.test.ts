import { vi, describe, it, expect, beforeEach } from "vitest";

// Use vi.hoisted to create mock variables that are accessible inside vi.mock factories
const { mockClient, mockAdmin } = vi.hoisted(() => {
  const fromChainClient = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  const fromChainAdmin = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    mockClient: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(() => fromChainClient),
      _fromChain: fromChainClient,
    },
    mockAdmin: {
      from: vi.fn(() => fromChainAdmin),
      _fromChain: fromChainAdmin,
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockClient),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockAdmin,
}));

import { saveAgentSelection } from "@/lib/actions/agent";

describe("DASH-06: Agent Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saveAgentSelection writes agent_id to profiles table via supabaseAdmin", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockAdmin._fromChain.eq.mockResolvedValue({ data: null, error: null });

    const result = await saveAgentSelection("cooper");

    expect(result).toEqual({ success: true });
    expect(mockAdmin.from).toHaveBeenCalledWith("profiles");
    expect(mockAdmin._fromChain.update).toHaveBeenCalledWith({
      agent_id: "cooper",
    });
    expect(mockAdmin._fromChain.eq).toHaveBeenCalledWith("id", "user-123");
  });

  it("saveAgentSelection returns { success: false } when user not authenticated", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await saveAgentSelection("cooper");

    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockAdmin.from).not.toHaveBeenCalled();
  });

  it("saveAgentSelection returns { success: false } on Supabase write error", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockAdmin._fromChain.eq.mockResolvedValue({
      data: null,
      error: { message: "DB write error" },
    });

    const result = await saveAgentSelection("arlo");

    expect(result).toEqual({
      success: false,
      error: "Failed to save agent",
    });
  });
});
