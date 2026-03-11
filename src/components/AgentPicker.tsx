"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AGENTS, type AgentId } from "@/contexts/AgentContext";
import { saveAgentSelection } from "@/lib/actions/agent";
import { useAgent } from "@/contexts/AgentContext";
import { HolographicAvatar } from "@/components/HolographicAvatar";

export function AgentPicker() {
  const { setActiveAgent } = useAgent();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<AgentId | null>(null);

  function handleSelect(id: AgentId) {
    if (isPending) return;
    setSelectedId(id);
    setActiveAgent(id); // optimistic — context + CSS update immediately

    startTransition(async () => {
      const result = await saveAgentSelection(id);
      // Delay refresh by 850ms to let portal animation complete
      await new Promise((r) => setTimeout(r, 850));
      if (result.success) {
        router.refresh();
      } else {
        // Non-blocking toast (discretion: inline message)
        setSelectedId(null);
      }
    });
  }

  return (
    <div className="holo-grid-bg relative flex min-h-screen flex-col items-center justify-center bg-[#050B14] px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs tracking-[0.3em] text-[#A8977E] uppercase">
          Agenty — Quest for Knowledge
        </p>
        <h1 className="text-4xl font-black tracking-tight text-[#F0E6D3]">
          CHOOSE YOUR COMPANION
        </h1>
        <p className="mt-2 text-sm text-[#A8977E]">
          Your agent determines your quest domain and neon signature
        </p>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
        {(Object.values(AGENTS) as typeof AGENTS[AgentId][]).map((agent) => (
          <motion.button
            key={agent.id}
            onClick={() => handleSelect(agent.id)}
            disabled={isPending}
            className="loot-card group relative flex flex-col items-center gap-3 p-5 text-left
                       transition-all duration-200 disabled:opacity-60"
            whileHover={{ y: -4, boxShadow: `0 0 24px ${agent.color}44` }}
            whileTap={{ scale: 0.97 }}
            animate={selectedId === agent.id ? { scale: [1, 1.08, 40], opacity: [1, 1, 0] } : {}}
            transition={selectedId === agent.id ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] } : {}}
          >
            {/* Agent Holographic Portrait (Comms Patch) */}
            <HolographicAvatar agent={agent} size={80} />

            {/* Agent Info */}
            <div className="w-full text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-black text-[#F0E6D3]">{agent.name}</span>
                <span
                  className="rounded-full border px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ borderColor: agent.color, color: agent.color }}
                >
                  LV1
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#A8977E]">{agent.specialty}</p>
              <span
                className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{ backgroundColor: `${agent.color}22`, color: agent.color }}
              >
                Ready
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Portal Warp Overlay */}
      <AnimatePresence>
        {isPending && selectedId && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: AGENTS[selectedId].color + "11" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: AGENTS[selectedId].color }}
              animate={{ scale: [1, 100], opacity: [1, 0.3, 0] }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
