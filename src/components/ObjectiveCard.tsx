// src/components/ObjectiveCard.tsx
"use client";

import { AnimatePresence, motion } from "motion/react";

type ObjectiveCardProps = {
  objective: string;
};

export function ObjectiveCard({ objective }: ObjectiveCardProps) {
  return (
    <div
      className="rounded-xl p-3 mt-auto"
      style={{
        background: "#0A1423",
        border: "2px solid #3B82F644",
      }}
    >
      <p
        className="mb-1 font-mono text-[8px] uppercase tracking-[3px]"
        style={{ color: "#A8977E" }}
      >
        CURRENT OBJECTIVE
      </p>
      {/* AnimatePresence keyed on objective text — slides in new text on change */}
      <AnimatePresence mode="wait">
        <motion.p
          key={objective || "empty"}
          className="text-[10px] font-bold leading-relaxed"
          style={{ color: "#F0E6D3" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          {objective || "Awaiting mission data…"}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
