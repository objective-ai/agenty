"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { motion } from "motion/react";
import { spendEnergy } from "@/lib/actions/economy";
import { useEconomy } from "@/contexts/EconomyContext";
import { useAgent } from "@/contexts/AgentContext";

export function StartQuestButton() {
  const { energy, setEnergy } = useEconomy();
  const { agent } = useAgent();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [questStarted, setQuestStarted] = useState(false);

  const energyCost = 10;
  const hasEnergy = energy >= energyCost;

  function handleStart() {
    if (isPending || questStarted || !hasEnergy) return;
    startTransition(async () => {
      const result = await spendEnergy(energyCost, "training_quest");
      if (result.success) {
        setEnergy(result.data.remainingEnergy);
        setQuestStarted(true);
        setError(null);
      } else {
        setError(result.error ?? "Failed to start quest");
      }
    });
  }

  if (questStarted) {
    return (
      <Link
        href="/bridge/missions/training"
        className="flex w-full items-center justify-center rounded-2xl border-2 font-black
                   uppercase tracking-wider text-[#F0E6D3] transition-all duration-200"
        style={{
          minHeight: 64,
          borderColor: agent.color,
          backgroundColor: `${agent.color}22`,
        }}
      >
        ENTER TRAINING ROOM {"\u2192"}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        onClick={handleStart}
        disabled={isPending || !hasEnergy}
        className="w-full rounded-2xl border-2 font-black uppercase tracking-wider
                   transition-all duration-200 disabled:opacity-50"
        style={{
          minHeight: 64,
          borderColor: agent.color,
          color: agent.color,
          backgroundColor: `${agent.color}11`,
        }}
        animate={!isPending && hasEnergy ? {
          boxShadow: [
            `0 0 12px ${agent.color}44`,
            `0 0 24px ${agent.color}88`,
            `0 0 12px ${agent.color}44`,
          ]
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.97 }}
      >
        {isPending
          ? "LAUNCHING..."
          : !hasEnergy
          ? `NOT ENOUGH ENERGY (need ${energyCost}\u26A1)`
          : `START TRAINING \u00B7 -${energyCost}\u26A1`}
      </motion.button>
      {error && <p className="text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
