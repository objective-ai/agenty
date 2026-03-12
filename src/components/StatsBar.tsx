"use client";

import { useRef, useEffect, useState } from "react";
import { useMotionValue, useTransform, animate } from "motion/react";
import { useEconomy } from "@/contexts/EconomyContext";
import { getRankTitle } from "@/lib/ranks";

interface StatProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  glowColor: string;
}

function Stat({ icon, label, value, color, glowColor }: StatProps) {
  return (
    <div
      className="flex items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] px-[var(--space-4)] py-[var(--space-3)]"
      style={{ background: glowColor }}
    >
      <span className="text-lg">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-ink-tertiary">
          {label}
        </span>
        <span className="text-sm font-bold" style={{ color }}>
          {value}
        </span>
      </div>
    </div>
  );
}

/** Animated gold counter -- counts up over ~800ms when value changes (ECON-04) */
function AnimatedGoldStat() {
  const { gold } = useEconomy();
  const prevGoldRef = useRef(gold);
  const motionGold = useMotionValue(gold);
  const rounded = useTransform(motionGold, (v) => Math.round(v).toLocaleString());
  const [display, setDisplay] = useState(gold.toLocaleString());

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    return unsubscribe;
  }, [rounded]);

  useEffect(() => {
    if (prevGoldRef.current !== gold) {
      const controls = animate(motionGold, gold, {
        duration: 0.8,
        ease: "easeOut",
      });
      prevGoldRef.current = gold;
      return () => controls.stop();
    }
  }, [gold, motionGold]);

  return (
    <Stat
      icon={"\uD83E\uDE99"}
      label="Gold"
      value={display}
      color="var(--gold)"
      glowColor="var(--gold-glow)"
    />
  );
}

export function StatsBar() {
  const { energy, level } = useEconomy();
  const rankTitle = getRankTitle(level);

  return (
    <div className="flex items-center gap-[var(--space-3)]">
      <AnimatedGoldStat />
      <Stat
        icon={"\u26A1"}
        label="Energy"
        value={`${energy} min`}
        color="var(--amber)"
        glowColor="var(--amber-glow)"
      />
      <Stat
        icon={"\uD83C\uDFC6"}
        label={rankTitle}
        value={`Lv. ${level}`}
        color="var(--emerald)"
        glowColor="var(--emerald-glow)"
      />
    </div>
  );
}
