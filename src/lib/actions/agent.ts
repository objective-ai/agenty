"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AgentId = "cooper" | "arlo" | "minh" | "maya";

/**
 * Persist the player's active agent selection to their profile row.
 * Uses supabaseAdmin for write (Loot Guard pattern).
 * Auth check via createClient().getUser() to confirm session.
 */
export async function saveAgentSelection(
  agentId: AgentId
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ agent_id: agentId })
    .eq("id", user.id);

  if (error) return { success: false, error: "Failed to save agent" };
  return { success: true };
}
