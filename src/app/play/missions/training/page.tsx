"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { completeTraining } from "@/lib/actions/training";
import { useEconomy } from "@/contexts/EconomyContext";
import { useAgent } from "@/contexts/AgentContext";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { HudStatusRail } from "@/components/HudStatusRail";

// ═══════════════════════════════════════════════════════════════════
// Training Room — 3 interactive calibration stations
// Teaches Energy, Gold, and XP mechanics. Awards 50 Gold on completion.
// Comms Patch: 1st-person tactical voice (Cooper mission-controller tone).
// ═══════════════════════════════════════════════════════════════════

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const STATIONS = [
  {
    id: "energy",
    title: "THE ENERGY LAB",
    emoji: "\u26A1",
    visualClass: "station-pulse-glow",
    headline: "Energy is Your Fuel",
    description:
      "I need Energy to power every mission we run together. You start with 100 units. It regenerates over time, so spend it wisely \u2014 pick the quests that match your focus today.",
    mechanic: "Starting a quest costs 10 Energy. Running out means waiting for recharge.",
    demoValue: 100,
    suffix: "\u26A1",
  },
  {
    id: "gold",
    title: "THE LOOT VAULT",
    emoji: "\uD83E\uDE99",
    visualClass: "station-spin-coin",
    headline: "Gold Unlocks Gear and Upgrades",
    description:
      "I'll award you Gold for every mission we complete. It's your lifetime score \u2014 it never drops, only climbs. Use it to unlock gear and upgrades in the Lab.",
    mechanic: "Completing Training awards 50 Gold. Daily bonus: +25 Gold.",
    demoValue: 50,
    suffix: " Gold",
  },
  {
    id: "xp",
    title: "THE XP CORE",
    emoji: "\u2728",
    visualClass: "",
    headline: "Every Mission Makes Me Smarter",
    description:
      "XP fills my progress bar at the top of your HUD. When it maxes out, I level up \u2014 and we unlock harder quests with bigger payouts. Each of us agents levels independently, so choose wisely.",
    mechanic: "Each quest awards XP based on difficulty. Harder quests = more XP.",
    demoValue: 120,
    suffix: " XP",
  },
] as const;

export default function TrainingPage() {
  const { agent } = useAgent();
  const { setGold } = useEconomy();
  const [activeStation, setActiveStation] = useState<number | null>(null);
  const [completedStations, setCompletedStations] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allStationsCompleted = completedStations.size === STATIONS.length;

  function handleStationActivate(index: number) {
    setActiveStation(activeStation === index ? null : index);
    const stationId = STATIONS[index].id;
    setCompletedStations((prev) => new Set([...prev, stationId]));
  }

  function handleComplete() {
    if (isPending || isComplete || !allStationsCompleted) return;
    startTransition(async () => {
      const result = await completeTraining();
      if (result.success) {
        setGold(result.data.newGold);
        setIsComplete(true);
        setError(null);
      } else {
        // Already claimed is treated as complete
        if (result.error?.includes("already claimed")) {
          setIsComplete(true);
        } else {
          setError(result.error ?? "Failed to complete training");
        }
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#050B14]">
      <HudStatusRail />
      <div className="px-4 py-10">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <div className="mb-1 flex items-center gap-3">
            <Link
              href="/bridge"
              className="text-xs uppercase tracking-[0.3em] text-[#A8977E] transition-colors hover:text-[#F0E6D3]"
            >
              ← BRIDGE
            </Link>
            <span className="text-xs text-[#A8977E]/40">/</span>
            <p className="text-xs uppercase tracking-[0.3em] text-[#A8977E]">
              Mission Control
            </p>
          </div>
          <h1 className="text-3xl font-black uppercase text-[#F0E6D3]">
            TRAINING ROOM
          </h1>
          <p className="mt-2 text-sm text-[#A8977E]">
            Calibrate your HUD. Learn the mechanics. Earn your first reward.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-6 flex gap-2">
          {STATIONS.map((station) => (
            <div
              key={station.id}
              className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{
                backgroundColor: completedStations.has(station.id)
                  ? agent.color
                  : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>

        {/* Calibration Stations */}
        <motion.div className="flex flex-col gap-4" initial="hidden" animate="visible" variants={staggerContainer}>
          {STATIONS.map((station, index) => {
            const done = completedStations.has(station.id);
            const isActive = activeStation === index;

            return (
              <motion.div key={station.id} variants={staggerChild}>
              <motion.div
                className="overflow-hidden rounded-2xl border-2 bg-[#0A1423]"
                style={{
                  borderColor: done
                    ? `${agent.color}88`
                    : isActive
                    ? `${agent.color}44`
                    : "rgba(255,255,255,0.1)",
                }}
                animate={done ? { boxShadow: `0 0 16px ${agent.color}33` } : {}}
              >
                {/* Station header -- always visible, tappable */}
                <motion.button
                  className="flex w-full items-center gap-4 p-5 text-left"
                  onClick={() => handleStationActivate(index)}
                  whileTap={{
                    scale: 0.95,
                    boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <motion.span
                    className={`text-3xl ${isActive || done ? station.visualClass : ""}`}
                    animate={done ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {station.emoji}
                  </motion.span>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#A8977E]">
                      {station.title}
                    </p>
                    <p className="font-bold text-[#F0E6D3]">{station.headline}</p>
                  </div>
                  <span
                    className="text-xs font-bold uppercase"
                    style={{ color: done ? agent.color : "#A8977E" }}
                  >
                    {done ? "CALIBRATED \u2713" : "TAP TO OPEN"}
                  </span>
                </motion.button>

                {/* Expanded station content */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/10 px-5 pb-5 pt-4">
                        <p className="mb-3 text-sm text-[#A8977E]">
                          {station.description}
                        </p>
                        <div
                          className="mb-3 rounded-xl border px-4 py-3"
                          style={{ borderColor: `${agent.color}44`, backgroundColor: `${agent.color}11` }}
                        >
                          <p className="text-xs text-[#A8977E]">{station.mechanic}</p>
                        </div>
                        {/* Station-specific visual demo */}
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-[#A8977E]">Live demo:</span>
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <AnimatedNumber
                              value={station.demoValue}
                              suffix={station.suffix}
                              className="text-lg font-bold"
                            />
                          </motion.div>
                          {/* XP station: show a filling bar that triggers Scale Bounce */}
                          {station.id === "xp" && (
                            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: agent.color }}
                                initial={{ width: "0%" }}
                                animate={{ width: "60%" }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Complete Training CTA */}
        <div className="mt-8">
          {isComplete ? (
            <motion.div
              className="rounded-2xl border-2 border-[#10B981] bg-[#10B981]/10 p-6 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <p className="text-xl font-black text-[#F0E6D3]">TRAINING CERTIFIED</p>
              <p className="mt-1 text-sm text-[#10B981]">+50 Gold awarded. Badge unlocked.</p>
              <Link
                href="/bridge"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-[#10B981]
                           bg-[#10B981]/20 px-6 py-3 text-sm font-bold uppercase tracking-wider
                           text-[#10B981] transition-all hover:bg-[#10B981]/30"
              >
                RETURN TO BRIDGE →
              </Link>
            </motion.div>
          ) : (
            <motion.button
              onClick={handleComplete}
              disabled={isPending || !allStationsCompleted}
              className="w-full rounded-2xl border-2 font-black uppercase tracking-wider
                         text-[#050B14] disabled:opacity-40"
              style={{
                minHeight: 64,
                backgroundColor: allStationsCompleted ? agent.color : "#A8977E",
                borderColor: allStationsCompleted ? agent.color : "#A8977E",
                boxShadow: allStationsCompleted ? `0 0 20px ${agent.color}66` : "none",
              }}
              whileTap={{
                scale: 0.95,
                boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: `0 0 12px rgba(var(--agent-accent-rgb), 0.3)`,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {isPending
                ? "PROCESSING..."
                : !allStationsCompleted
                ? `CALIBRATE ALL STATIONS FIRST (${completedStations.size}/${STATIONS.length})`
                : "COMPLETE TRAINING \u00B7 +50 GOLD"}
            </motion.button>
          )}
          {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
        </div>
      </div>
      </div>
    </div>
  );
}
