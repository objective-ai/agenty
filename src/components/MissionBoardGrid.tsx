"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type { MissionConfig } from "@/lib/missions/registry";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function MissionBoardGrid({ missions }: { missions: MissionConfig[] }) {
  const prefersReduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  return (
    <motion.div
      className="grid grid-cols-3 gap-3"
      initial={prefersReduced ? undefined : "hidden"}
      animate={prefersReduced ? undefined : "visible"}
      variants={prefersReduced ? undefined : staggerContainer}
    >
      {missions.map((m) => (
        <motion.div
          key={m.id}
          variants={prefersReduced ? undefined : staggerChild}
          whileHover={
            prefersReduced
              ? undefined
              : {
                  y: -4,
                  boxShadow: `0 8px 32px -4px rgba(var(--agent-accent-rgb), 0.15)`,
                }
          }
          whileTap={
            prefersReduced
              ? undefined
              : {
                  scale: 0.95,
                  boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
                }
          }
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link
            href={`/bridge/lab?mission=${m.id}`}
            className="flex h-28 flex-col items-center justify-center rounded-2xl border-2
                       border-[#3B82F644] bg-[#0A1423]"
          >
            <span className="font-mono text-xs font-bold text-[#F0E6D3]">
              {m.title.split(" · ")[0]?.toUpperCase()}
            </span>
            <span className="mt-1 font-mono text-[9px] text-[#A8977E]">
              {m.stats.length} STATS | {m.xpReward} XP
            </span>
          </Link>
        </motion.div>
      ))}
      {/* Ghost slots — fill remaining cells up to 3 total, no animation needed */}
      {Array.from({ length: Math.max(0, 3 - missions.length) }).map((_, i) => (
        <div
          key={`ghost-${i}`}
          className="flex h-28 items-center justify-center rounded-2xl border-2 border-dashed
                     border-white/8 bg-[#0A1423]/50"
        >
          <span className="text-xs text-white/15">QUEST {missions.length + i + 1}</span>
        </div>
      ))}
    </motion.div>
  );
}
