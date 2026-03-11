import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AgentPicker } from "@/components/AgentPicker";
import { HudStatusRail } from "@/components/HudStatusRail";
import { BridgeSidebar } from "@/components/BridgeSidebar";
import { DailyClaim } from "@/components/DailyClaim";
import { StartQuestButton } from "@/components/StartQuestButton";

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
    // First-time visitor — full-page RPG agent picker
    return <AgentPicker />;
  }

  // Returning user — BridgeHUD: full game interface
  return (
    <div className="flex min-h-screen flex-col bg-[#050B14]">
      {/* Top HUD status rail */}
      <HudStatusRail />

      {/* Main layout: sidebar + central area */}
      <div className="flex flex-1">
        <BridgeSidebar />

        {/* Central quest area */}
        <main className="flex flex-1 flex-col gap-4 p-6">
          <div className="rounded-2xl border-2 border-white/10 bg-[#0A1423] p-4">
            <p className="mb-1 text-xs uppercase tracking-wider text-[#A8977E]">
              Daily Operations
            </p>
            <DailyClaim />
          </div>

          <div className="rounded-2xl border-2 border-white/10 bg-[#0A1423] p-4">
            <p className="mb-1 text-xs uppercase tracking-wider text-[#A8977E]">
              Active Quest
            </p>
            <p className="mb-3 font-bold text-[#F0E6D3]">Training Room</p>
            <p className="mb-4 text-sm text-[#A8977E]">
              Calibrate your HUD and learn the field mechanics. Earn 50 Gold on completion.
            </p>
            <StartQuestButton />
          </div>
        </main>
      </div>
    </div>
  );
}
