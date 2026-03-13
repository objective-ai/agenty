"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { spendEnergy } from "@/lib/actions/economy";
import { useEconomy } from "@/contexts/EconomyContext";
import { useAgent } from "@/contexts/AgentContext";

const energyCost = 10;

export function StartQuestButton() {
  const { energy, setEnergy } = useEconomy();
  const { agent } = useAgent();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasEnergy = energy >= energyCost;

  function handleStart() {
    if (isPending || !hasEnergy) return;
    startTransition(async () => {
      const result = await spendEnergy(energyCost, "training_quest");
      if (result.success) {
        setEnergy(result.data.remainingEnergy);
        setError(null);
        router.push("/play/missions/training");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: 1,
          boxShadow: hasEnergy
            ? [
                `0 0 12px ${agent.color}44`,
                `0 0 24px ${agent.color}88`,
                `0 0 12px ${agent.color}44`,
              ]
            : "none",
        }}
        transition={{
          opacity: { duration: 0.4, ease: "easeOut" },
          scale: { duration: 0.4, ease: "easeOut" },
          boxShadow: hasEnergy
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0 },
        }}
        whileTap={hasEnergy ? { scale: 0.95 } : undefined}
        whileHover={hasEnergy ? { scale: 1.02 } : undefined}
        className="rounded-2xl"
      >
        <button
          onClick={handleStart}
          disabled={isPending || !hasEnergy}
          className="flex w-full items-center justify-center rounded-2xl border-2 font-black
                     uppercase tracking-wider transition-all duration-200 disabled:opacity-60"
          style={{
            minHeight: 64,
            borderColor: agent.color,
            color: hasEnergy ? agent.color : "#6B7280",
            backgroundColor: hasEnergy ? `${agent.color}11` : "#6B728011",
          }}
        >
          {isPending
            ? "STARTING..."
            : hasEnergy
              ? `ENTER TRAINING ROOM \u2192`
              : "NOT ENOUGH ENERGY"}
        </button>
      </motion.div>
      {error && <p className="text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
