"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useAgent } from "@/contexts/AgentContext";

export function StartQuestButton() {
  const { agent } = useAgent();

  return (
    <motion.div
      animate={{
        boxShadow: [
          `0 0 12px ${agent.color}44`,
          `0 0 24px ${agent.color}88`,
          `0 0 12px ${agent.color}44`,
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="rounded-2xl"
    >
      <Link
        href="/bridge/missions/training"
        className="flex w-full items-center justify-center rounded-2xl border-2 font-black
                   uppercase tracking-wider transition-all duration-200"
        style={{
          minHeight: 64,
          borderColor: agent.color,
          color: agent.color,
          backgroundColor: `${agent.color}11`,
        }}
      >
        ENTER TRAINING ROOM {"\u2192"}
      </Link>
    </motion.div>
  );
}
