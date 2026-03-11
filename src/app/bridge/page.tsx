import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ═══════════════════════════════════════════════════════════════════
// /bridge — The Bridge dashboard
// First-visit (agent_id IS NULL): shows AgentPickerPage (Plan 02-04)
// Returning users: shows BridgeHUD (Plan 02-05)
// ═══════════════════════════════════════════════════════════════════

export default async function BridgePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agent_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agent_id) {
    // First-time visitor — AgentPicker will be wired in Plan 02-04
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050B14]">
        <div className="text-center">
          <p className="text-sm text-[#A8977E]">Loading agent selection...</p>
        </div>
      </div>
    );
  }

  // Returning user — HUD will be wired in Plan 02-05
  return (
    <div className="flex min-h-screen bg-[#050B14]">
      <p className="m-auto text-sm text-[#A8977E]">HUD loading... (Plan 02-05)</p>
    </div>
  );
}
