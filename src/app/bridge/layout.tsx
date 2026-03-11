import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgentProvider } from "@/contexts/AgentContext";
import { EconomyProvider } from "@/contexts/EconomyContext";
import type { AgentId } from "@/contexts/AgentContext";

// ═══════════════════════════════════════════════════════════════════
// /bridge layout — Server Component
// Fetches profile once per request; hydrates EconomyContext + AgentContext.
// Server-only — no client directive. This IS the server fetch boundary.
// ═══════════════════════════════════════════════════════════════════

export default async function BridgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("gold, xp, energy, level, agent_id, display_name")
    .eq("id", user.id)
    .single();

  return (
    <AgentProvider initialAgent={(profile?.agent_id as AgentId) ?? "cooper"}>
      <EconomyProvider
        initialGold={profile?.gold ?? 0}
        initialXp={profile?.xp ?? 0}
        initialEnergy={profile?.energy ?? 100}
        initialLevel={profile?.level ?? 1}
      >
        {children}
      </EconomyProvider>
    </AgentProvider>
  );
}
