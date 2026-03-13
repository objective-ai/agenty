import { redirect } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { AgentProvider } from "@/contexts/AgentContext";
import { EconomyProvider } from "@/contexts/EconomyContext";
import { PageTransition } from "@/components/PageTransition";
import type { AgentId } from "@/contexts/AgentContext";

// ═══════════════════════════════════════════════════════════════════
// /play layout — Server Component
// Fetches profile once per request; hydrates EconomyContext + AgentContext.
// Server-only — no client directive. This IS the server fetch boundary.
// ═══════════════════════════════════════════════════════════════════

export default async function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  if (!user) {
    return redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("gold, xp, energy, level, streak_days, agent_id, display_name, training_certified, role")
    .eq("id", user.id)
    .single();

  // Parents cannot access the student portal
  if (profile?.role === "parent") {
    return redirect("/parent");
  }

  return (
    <AgentProvider initialAgent={(profile?.agent_id as AgentId) ?? "cooper"}>
      <EconomyProvider
        initialGold={profile?.gold ?? 0}
        initialXp={profile?.xp ?? 0}
        initialEnergy={profile?.energy ?? 100}
        initialLevel={profile?.level ?? 1}
        initialStreakDays={profile?.streak_days ?? 0}
      >
        <PageTransition>
          {children}
        </PageTransition>
      </EconomyProvider>
    </AgentProvider>
  );
}
