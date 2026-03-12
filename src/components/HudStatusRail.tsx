"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useAgent } from "@/contexts/AgentContext";
import { useEconomy } from "@/contexts/EconomyContext";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { AgentSwitchOverlay } from "@/components/AgentSwitchOverlay";
import { HolographicAvatar } from "@/components/HolographicAvatar";

const XP_PER_LEVEL = 500; // simple linear for v1

export function HudStatusRail() {
  const { agent, activeAgent } = useAgent();
  const { gold, xp, energy, level } = useEconomy();
  const [switchOpen, setSwitchOpen] = useState(false);

  const xpPercent = Math.min((xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100, 100);
  const nextLevelXp = (Math.floor(xp / XP_PER_LEVEL) + 1) * XP_PER_LEVEL;

  return (
    <>
      <div
        className="flex h-16 items-center gap-4 border-b-2 border-white/10
                   bg-[#0A1423] px-4"
        style={{ borderBottomColor: `${agent.color}33` }}
      >
        {/* Mini Agent Holographic Portrait -- tappable for switch (Comms Patch) */}
        <motion.button
          onClick={() => setSwitchOpen(true)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={`Switch agent (currently ${agent.name})`}
          whileTap={{
            scale: 0.95,
            boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <HolographicAvatar agent={agent} size={40} />
        </motion.button>

        {/* XP Bar -- center */}
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex justify-between text-[10px] text-[#A8977E]">
            <span>{agent.name} · Lv{level}</span>
            <span>{xp} / {nextLevelXp} XP</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: agent.color }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* Gold + Energy counters -- right */}
        <div className="flex shrink-0 items-center gap-4 text-sm font-bold">
          <div className="flex items-center gap-1">
            <span className="text-[#FFD700]">{"\u26A1"}</span>
            <AnimatedNumber
              value={energy}
              className="text-[#F0E6D3]"
            />
          </div>
          <div className="flex items-center gap-1">
            <span>{"\u{1FA99}"}</span>
            <AnimatedNumber
              value={gold}
              className="text-[#FFD700]"
            />
          </div>
        </div>
      </div>

      <AgentSwitchOverlay
        isOpen={switchOpen}
        onClose={() => setSwitchOpen(false)}
      />
    </>
  );
}
