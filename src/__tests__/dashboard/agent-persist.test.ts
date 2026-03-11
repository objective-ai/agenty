import { mockSupabaseClient, mockSupabaseAdmin } from "../helpers/supabase-mock";

describe("DASH-06: Agent Persistence", () => {
  it.todo("saveAgentSelection writes agent_id to profiles table via supabaseAdmin");
  it.todo("saveAgentSelection returns { success: false } when user not authenticated");
  it.todo("saveAgentSelection returns { success: false } on Supabase write error");
  it.todo("saveAgentSelection rejects invalid agentId values outside the 4 known agents");
});
