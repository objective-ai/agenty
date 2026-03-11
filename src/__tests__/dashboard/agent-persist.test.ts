import { vi } from "vitest";
import {
  mockSupabaseClient,
  mockSupabaseAdmin,
} from "../helpers/supabase-mock";

// Mock supabase server client
const mockClient = mockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockClient),
}));

// Mock supabase admin client
const mockAdmin = mockSupabaseAdmin();
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockAdmin,
}));

// Import after mocks
import { saveAgentSelection } from "@/lib/actions/agent";

describe("DASH-06: Agent Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saveAgentSelection writes agent_id to profiles table via supabaseAdmin", async () => {
    // Arrange: user is authenticated
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    // Admin update chain resolves with no error
    mockAdmin._fromChain.eq.mockResolvedValue({ data: null, error: null });

    // Act
    const result = await saveAgentSelection("cooper");

    // Assert
    expect(result).toEqual({ success: true });
    expect(mockAdmin.from).toHaveBeenCalledWith("profiles");
    expect(mockAdmin._fromChain.update).toHaveBeenCalledWith({
      agent_id: "cooper",
    });
    expect(mockAdmin._fromChain.eq).toHaveBeenCalledWith("id", "user-123");
  });

  it("saveAgentSelection returns { success: false } when user not authenticated", async () => {
    // Arrange: no user session
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Act
    const result = await saveAgentSelection("cooper");

    // Assert
    expect(result).toEqual({ success: false, error: "Not authenticated" });
    // Should not attempt admin write
    expect(mockAdmin.from).not.toHaveBeenCalled();
  });

  it("saveAgentSelection returns { success: false } on Supabase write error", async () => {
    // Arrange: user authenticated but admin write fails
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockAdmin._fromChain.eq.mockResolvedValue({
      data: null,
      error: { message: "DB write error" },
    });

    // Act
    const result = await saveAgentSelection("arlo");

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Failed to save agent",
    });
  });
});
