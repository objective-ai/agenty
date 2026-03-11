import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScanProgress } from "@/components/ScanProgress";
import { CommsRipple } from "@/components/CommsRipple";

// ═══════════════════════════════════════════════════════════════════
// Mission Control: Offline — Phase 2 briefing page
// Full content per user spec. Animated scan ticker + ghost board + training CTA.
// Comms Patch: 1st-person tactical dialogue with CommsRipple voice pulse.
// ═══════════════════════════════════════════════════════════════════

export default async function MissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("training_certified")
    .eq("id", user.id)
    .single();

  const trainingDone = profile?.training_certified ?? false;

  return (
    <div className="relative flex min-h-screen flex-col bg-[#050B14]">
      {/* Digital Scanline overlay */}
      <div className="scanlines-overlay pointer-events-none absolute inset-0 z-10" />

      <div className="relative z-20 flex flex-1 flex-col items-center justify-start px-6 py-10">

        {/* MISSION CONTROL: OFFLINE header */}
        <div className="mb-8 w-full max-w-2xl">
          <h1 className="text-3xl font-black uppercase tracking-tight text-[#F0E6D3]">
            MISSION CONTROL: OFFLINE
          </h1>
          <div className="mt-3 rounded-xl border border-[#3B82F6]/30 bg-[#0A1423] p-4">
            <p className="font-mono text-sm text-[#A8977E]">
              &gt; &quot;Welcome to the Bridge, Agent. Mission Control is currently running
              a deep-scan of the knowledge grid. We&apos;re looking for high-priority
              objectives in Science, Logic, and Technology.&quot;
            </p>
          </div>
        </div>

        {/* Cooper hologram + Comms Ripple voice pulse */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div
            className="overflow-hidden rounded-full border-2 border-[#3B82F6]"
            style={{ boxShadow: "0 0 32px #3B82F666, 0 0 64px #3B82F622" }}
          >
            <Image
              src="/cooper-hologram.png"
              alt="Cooper"
              width={160}
              height={160}
              className="rounded-full object-cover"
              priority
            />
          </div>
          <CommsRipple color="#3B82F6" active={false} />
        </div>

        {/* Scan Status — animated progress ticker */}
        <div className="mb-6 w-full max-w-2xl rounded-xl border-2 border-white/10 bg-[#0A1423] p-5">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
            SCAN STATUS
          </h3>
          <ScanProgress />
        </div>

        {/* Intel */}
        <div className="mb-6 w-full max-w-2xl rounded-xl border-2 border-white/10 bg-[#0A1423] p-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#A8977E]">
            INTEL
          </h3>
          <p className="mb-4 text-sm text-[#A8977E]">
            New missions will appear here once the &apos;Quest for Knowledge&apos; protocol is fully initialized.
          </p>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#F0E6D3]">
            STUCK?
          </p>
          <p className="text-sm text-[#A8977E]">
            While we wait for the scan, enter the Training Room to calibrate your HUD and learn the field mechanics.
          </p>
        </div>

        {/* Ghost Board — silhouettes of future Quest Cards */}
        <div className="mb-8 grid w-full max-w-2xl grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex h-28 items-center justify-center rounded-2xl border-2 border-dashed
                         border-white/8 bg-[#0A1423]/50"
            >
              <span className="text-xs text-white/15">QUEST {i}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex w-full max-w-2xl flex-col gap-3">
          {/* START TRAINING — primary CTA */}
          <Link
            href="/bridge/missions/training"
            className="flex w-full items-center justify-center rounded-2xl border-2
                       font-black uppercase tracking-wider text-[#050B14] transition-all duration-200
                       hover:opacity-90"
            style={{
              minHeight: 64,
              backgroundColor: trainingDone ? "#10B981" : "#3B82F6",
              borderColor: trainingDone ? "#10B981" : "#3B82F6",
              boxShadow: trainingDone ? "0 0 20px #10B98166" : "0 0 20px #3B82F666",
            }}
          >
            {trainingDone ? "TRAINING COMPLETE \u2014 REVIEW" : "START TRAINING"}
          </Link>

          {/* RETURN TO BASE — secondary nav so kid never feels stuck */}
          <Link
            href="/bridge"
            className="flex w-full items-center justify-center rounded-2xl border-2
                       border-white/10 font-bold uppercase tracking-wider text-[#A8977E]
                       transition-all duration-200 hover:border-white/20 hover:text-[#F0E6D3]"
            style={{ minHeight: 64 }}
          >
            {"\u2190"} RETURN TO BASE
          </Link>
        </div>
      </div>
    </div>
  );
}
