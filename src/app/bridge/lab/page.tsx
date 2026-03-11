// ═══════════════════════════════════════════════════════════════════
// /bridge/lab — Intel Station: Knowledge Dropzone + Agent Comms
// ═══════════════════════════════════════════════════════════════════
import { CommsPanel } from "@/components/CommsPanel";
import { KnowledgeDropzone } from "@/components/KnowledgeDropzone";

export default function LabPage() {
  return (
    <div className="flex h-screen flex-col bg-[#050B14] p-6">
      {/* Page header */}
      <div className="mb-4 border-b-2 border-[var(--agent-accent)]/30 pb-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-black tracking-tight text-[#F0E6D3]">
            INTEL STATION
          </h1>
          <span className="font-mono text-xs text-[#A8977E]">
            // knowledge vault active
          </span>
        </div>
        <p className="text-xs text-[#A8977E]">
          Upload classified documents · Agent comms
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left panel — Knowledge Dropzone */}
        <div className="rounded-2xl border-2 border-white/10 bg-[#0A1423] p-6">
          <KnowledgeDropzone />
        </div>

        {/* Right panel — CommsPanel (live agent chat) */}
        <div className="min-h-0 overflow-hidden rounded-2xl border-2 border-white/10">
          <CommsPanel />
        </div>
      </div>
    </div>
  );
}
