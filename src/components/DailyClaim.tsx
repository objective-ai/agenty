"use client";

import { useTransition, useState } from "react";
import { motion } from "motion/react";
import { awardLoot } from "@/lib/actions/economy";
import { useEconomy } from "@/contexts/EconomyContext";
import { useAgent } from "@/contexts/AgentContext";

export function DailyClaim() {
  const { gold, setGold } = useEconomy();
  const { agent } = useAgent();
  const [isPending, startTransition] = useTransition();
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClaim() {
    if (isPending || claimed) return;
    startTransition(async () => {
      // Loot Guard: amount is server-side constant -- client does NOT supply 25
      const result = await awardLoot(25, "daily_bonus");
      if (result.success) {
        setGold(result.data.newGold);
        setClaimed(true);
        setError(null);
      } else {
        if (result.error === "Quest reward already claimed") {
          setClaimed(true); // treat as already-claimed
        } else {
          setError(result.error);
        }
      }
    });
  }

  if (claimed) {
    return (
      <div
        className="rounded-2xl border-2 p-4 text-center"
        style={{ borderColor: `${agent.color}44`, backgroundColor: `${agent.color}11` }}
      >
        <p className="text-sm font-bold text-[#F0E6D3]">Daily Reward Claimed!</p>
        <p className="mt-1 text-xs text-[#A8977E]">Next reward in 23h 00m</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        onClick={handleClaim}
        disabled={isPending}
        className="w-full rounded-2xl border-2 font-black uppercase tracking-wider
                   text-[#050B14] transition-all duration-200 disabled:opacity-60"
        style={{
          minHeight: 64,
          backgroundColor: agent.color,
          borderColor: agent.color,
          boxShadow: `0 0 20px ${agent.color}66`,
        }}
        whileTap={{ scale: 0.97 }}
      >
        {isPending ? "CLAIMING..." : "CLAIM DAILY REWARD \u00B7 +25 GOLD"}
      </motion.button>
      {error && <p className="text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
