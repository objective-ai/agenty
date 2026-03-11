import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/lib/actions/auth";

// ═══════════════════════════════════════════════════════════════════
// /bridge — Placeholder dashboard (Phase 2 replaces this)
// ═══════════════════════════════════════════════════════════════════

export default async function BridgePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch display name from profiles table
  let displayName = "Agent";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    if (profile?.display_name) {
      displayName = profile.display_name;
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#050B14] px-4"
      data-agent="cooper"
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="mb-1 text-2xl font-black tracking-tight text-[#F0E6D3]">
          AGENTY
        </h1>
        <p className="text-xs text-[#A8977E]">Quest for Knowledge</p>
      </div>

      {/* Welcome */}
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[#3B82F6]">
          Welcome to The Bridge, {displayName}!
        </h2>
        <p className="mt-2 text-sm text-[#A8977E]">
          Your quest headquarters is being constructed. Check back soon for
          missions.
        </p>
      </div>

      {/* Placeholder card */}
      <div className="w-full max-w-sm rounded-2xl border-2 border-white/10 bg-[#0A1423] p-6 shadow-lg">
        <div className="text-center">
          <div className="mb-3 text-3xl">&#x1F3AF;</div>
          <p className="text-sm text-[#A8977E]">
            Cooper says: &quot;Base is operational. Stand by for mission
            briefing.&quot;
          </p>
        </div>
      </div>

      {/* Logout */}
      <form action={logOut} className="mt-8">
        <button
          type="submit"
          className="rounded-xl border-2 border-white/10 bg-[#0A1423] px-6 py-2
                     text-xs font-medium text-[#A8977E]
                     hover:border-red-500/30 hover:text-red-400
                     transition-all duration-150"
        >
          Log Out
        </button>
      </form>
    </div>
  );
}
