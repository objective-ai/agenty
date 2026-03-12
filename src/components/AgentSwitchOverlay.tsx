"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AGENTS, type AgentId, useAgent } from "@/contexts/AgentContext";
import { saveAgentSelection } from "@/lib/actions/agent";
import { HolographicAvatar } from "@/components/HolographicAvatar";

interface AgentSwitchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentSwitchOverlay({ isOpen, onClose }: AgentSwitchOverlayProps) {
  const { activeAgent, setActiveAgent } = useAgent();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function triggerGlitch() {
    document.documentElement.classList.add("agent-glitch-active");
    setTimeout(() => {
      document.documentElement.classList.remove("agent-glitch-active");
    }, 800);
  }

  function handleSwitch(id: AgentId) {
    if (id === activeAgent || isPending) return;
    triggerGlitch();
    setActiveAgent(id); // optimistic
    onClose();

    startTransition(async () => {
      const result = await saveAgentSelection(id);
      if (result.success) {
        router.refresh();
      } else {
        setError("Couldn't save your choice — it'll reset on reload");
        // Per CONTEXT.md: theme changes optimistically, error is non-intrusive toast
      }
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Blurred backdrop */}
          <motion.div
            className="absolute inset-0 bg-[#050B14]/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Overlay panel */}
          <motion.div
            className="relative z-10 w-full max-w-sm rounded-3xl border-2 border-white/10
                       bg-[#0A1423] p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <h2 className="mb-4 text-lg font-black text-[#F0E6D3]">SWITCH AGENT</h2>

            <div className="flex flex-col gap-2">
              {(Object.values(AGENTS) as typeof AGENTS[AgentId][]).map((agent) => (
                <motion.button
                  key={agent.id}
                  onClick={() => handleSwitch(agent.id)}
                  disabled={isPending}
                  className="flex items-center gap-3 rounded-xl border-2 p-3 text-left
                             disabled:opacity-50"
                  style={{
                    borderColor: agent.id === activeAgent ? agent.color : "rgba(255,255,255,0.1)",
                    backgroundColor: agent.id === activeAgent ? `${agent.color}11` : "transparent",
                  }}
                  whileTap={{
                    scale: 0.95,
                    boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {/* Agent Holographic Portrait (Comms Patch) with dissolve animation */}
                  <motion.div
                    animate={agent.id === activeAgent ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0.7 }}
                  >
                    <HolographicAvatar agent={agent} size={40} />
                  </motion.div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#F0E6D3]">{agent.name}</span>
                      {agent.id === activeAgent && (
                        <span
                          className="rounded-full px-1.5 text-[10px] font-bold"
                          style={{ backgroundColor: `${agent.color}22`, color: agent.color }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#A8977E]">{agent.specialty}</p>
                    {/* Per-agent quest stats — placeholder for Phase 2; real data wired in Phase 3 */}
                    <p className="mt-0.5 text-[10px] text-[#A8977E]/60">0 quests completed</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {error && (
              <p className="mt-3 text-xs text-amber-400/80">{error}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
