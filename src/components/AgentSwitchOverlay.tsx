"use client";

import { useAgent, AGENTS, type AgentId } from "@/contexts/AgentContext";
import { HolographicAvatar } from "@/components/HolographicAvatar";

interface AgentSwitchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Overlay for switching the active AI companion.
 * Placeholder — full implementation in a later plan.
 */
export function AgentSwitchOverlay({ isOpen, onClose }: AgentSwitchOverlayProps) {
  const { activeAgent, setActiveAgent } = useAgent();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl border-2 border-white/10 bg-[#0A1423] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-[#F0E6D3]">
          Switch Companion
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(AGENTS) as AgentId[]).map((id) => {
            const agent = AGENTS[id];
            const isActive = id === activeAgent;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveAgent(id);
                  onClose();
                }}
                className="flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200"
                style={{
                  borderColor: isActive ? agent.color : "transparent",
                  backgroundColor: isActive ? `${agent.color}11` : "transparent",
                }}
              >
                <HolographicAvatar agent={agent} size={48} />
                <span
                  className="text-xs font-bold"
                  style={{ color: isActive ? agent.color : "#A8977E" }}
                >
                  {agent.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
