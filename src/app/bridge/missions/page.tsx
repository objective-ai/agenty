// ═══════════════════════════════════════════════════════════════════
// /bridge/missions — Mission Control shell
// Full briefing page built in Plan 02-06
// ═══════════════════════════════════════════════════════════════════
export default function MissionsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050B14] p-8">
      <div className="mb-6 border-b-2 border-[var(--agent-accent)]/30 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-[#F0E6D3]">
          MISSION CONTROL
        </h1>
        <p className="text-xs text-[#A8977E]">Tactical briefings and field assignments</p>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-2xl border-2 border-white/10 bg-[#0A1423] p-8 text-center">
          <p className="font-mono text-sm text-[#A8977E]">
            &gt; &quot;Mission briefing incoming... Stand by, Agent.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
