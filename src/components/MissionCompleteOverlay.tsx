// src/components/MissionCompleteOverlay.tsx
"use client";

import { useEffect, useState, useTransition, useMemo, type Dispatch } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import type { MissionConfig } from "@/lib/missions/registry";
import type { MissionAction } from "@/lib/missions/missionReducer";
import { completeMission } from "@/lib/actions/missions";

type MissionCompleteOverlayProps = {
  config: MissionConfig;
  rewardsCollected: boolean;
  dispatch: Dispatch<MissionAction>;
  isDamaged?: boolean;
};

const CONFETTI_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6"];
const PARTICLE_COUNT = 36;

type ConfettiParticle = {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  width: number;
  height: number;
  duration: number;
  delay: number;
};

function generateParticles(): ConfettiParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 400,   // -200 to +200
    y: -100 - Math.random() * 300,     // -100 to -400 (upward burst)
    rotation: Math.random() * 720,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    width: 6 + Math.random() * 4,      // 6-10px
    height: 4 + Math.random() * 4,     // 4-8px
    duration: 1.5 + Math.random() * 1, // 1.5-2.5s
    delay: Math.random() * 0.3,        // 0-0.3s stagger
  }));
}

function ConfettiBurst() {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const particles = useMemo(() => generateParticles(), []);

  if (prefersReducedMotion) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            borderRadius: 2,
            top: "30%",
            left: "50%",
            marginLeft: -p.width / 2,
            marginTop: -p.height / 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: 0,
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.2, 0.8, 0.4, 1],
          }}
        />
      ))}
    </div>
  );
}

export function MissionCompleteOverlay({
  config,
  rewardsCollected,
  dispatch,
  isDamaged = false,
}: MissionCompleteOverlayProps) {
  const router = useRouter();
  const [showRewards, setShowRewards] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [awarded, setAwarded] = useState<{ goldAwarded: number; xpAwarded: number } | null>(null);

  // Stagger: show rewards after the overlay fades in
  useEffect(() => {
    const timer = setTimeout(() => setShowRewards(true), 600);
    return () => clearTimeout(timer);
  }, []);

  function handleCollect() {
    startTransition(async () => {
      const result = await completeMission(config.id, isDamaged);
      if (!result.success) {
        // Already claimed is fine — still let them navigate
        if (result.error !== "Quest reward already claimed") {
          setError(result.error);
          return;
        }
      }
      if (result.success) {
        setAwarded(result.data);
      }
      dispatch({ type: "COLLECT_REWARDS" });
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#050B14]/90 backdrop-blur-sm" />

      {/* Confetti burst — behind card (no z-index, card is z-10) */}
      <ConfettiBurst />

      {/* Card */}
      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border-2 p-8"
        style={{
          background: "linear-gradient(180deg, #0A1423 0%, #050B14 100%)",
          borderColor: "#10B981",
          boxShadow: "0 0 48px #10B98133, 0 0 96px #10B98111",
        }}
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Success badge */}
        <motion.div
          className="flex h-20 w-20 items-center justify-center rounded-full border-2"
          style={{
            borderColor: "#10B981",
            background: "#10B98122",
            boxShadow: "0 0 24px #10B98144",
          }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>

        {/* Title */}
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#10B981]">
            MISSION COMPLETE
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-[#F0E6D3]">
            {config.title}
          </h2>
        </div>

        {/* Damage penalty label */}
        {showRewards && isDamaged && (
          <motion.p
            className="font-mono text-[10px] font-black uppercase tracking-[2px] text-[#EF4444]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            50% SIGNAL PENALTY
          </motion.p>
        )}

        {/* Rewards */}
        {showRewards && (
          <motion.div
            className="flex w-full gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* XP */}
            <div
              className="flex flex-1 flex-col items-center gap-1 rounded-xl border py-3"
              style={{
                background: "#3B82F611",
                borderColor: "#3B82F644",
              }}
            >
              <span className="font-mono text-[10px] uppercase tracking-[2px] text-[#3B82F6]">
                XP EARNED
              </span>
              {isDamaged && (
                <span className="text-sm font-bold text-[#3B82F644] line-through">
                  +{config.xpReward}
                </span>
              )}
              <motion.span
                className="text-2xl font-black text-[#3B82F6]"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                +{awarded?.xpAwarded ?? (isDamaged ? Math.floor(config.xpReward / 2) : config.xpReward)}
              </motion.span>
            </div>

            {/* Gold */}
            <div
              className="flex flex-1 flex-col items-center gap-1 rounded-xl border py-3"
              style={{
                background: "#F59E0B11",
                borderColor: "#F59E0B44",
              }}
            >
              <span className="font-mono text-[10px] uppercase tracking-[2px] text-[#F59E0B]">
                GOLD EARNED
              </span>
              {isDamaged && (
                <span className="text-sm font-bold text-[#F59E0B44] line-through">
                  +{config.goldReward}
                </span>
              )}
              <motion.span
                className="text-2xl font-black text-[#F59E0B]"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.35, duration: 0.4 }}
              >
                +{awarded?.goldAwarded ?? (isDamaged ? Math.floor(config.goldReward / 2) : config.goldReward)}
              </motion.span>
            </div>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        {/* Action buttons */}
        {showRewards && !rewardsCollected && (
          <motion.button
            onClick={handleCollect}
            disabled={isPending}
            className="w-full rounded-xl border-2 py-3 font-mono text-sm font-black uppercase tracking-widest disabled:opacity-50"
            style={{
              borderColor: "#10B981",
              backgroundColor: "#10B98122",
              color: "#10B981",
              boxShadow: "0 0 16px #10B98133",
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 17 }}
            whileTap={{
              scale: 0.95,
              boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: `0 0 12px rgba(var(--agent-accent-rgb), 0.3)`,
            }}
          >
            {isPending ? "COLLECTING..." : "COLLECT REWARDS"}
          </motion.button>
        )}

        {rewardsCollected && (
          <motion.button
            onClick={() => router.push("/bridge")}
            className="w-full rounded-xl border-2 py-3 font-mono text-sm font-black uppercase tracking-widest"
            style={{
              borderColor: "#3B82F6",
              backgroundColor: "#3B82F622",
              color: "#3B82F6",
              boxShadow: "0 0 16px #3B82F633",
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            whileTap={{
              scale: 0.95,
              boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: `0 0 12px rgba(var(--agent-accent-rgb), 0.3)`,
            }}
          >
            RETURN TO BASE
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
