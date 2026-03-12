"use client";

import { useEconomy } from "@/contexts/EconomyContext";
import { getRankTitle } from "@/lib/ranks";

const XP_PER_LEVEL = 500;

export function XPProgress() {
  const { xp, level } = useEconomy();
  const rankTitle = getRankTitle(level);
  const xpInLevel = xp % XP_PER_LEVEL;
  const percent = (xpInLevel / XP_PER_LEVEL) * 100;

  return (
    <div className="loot-card p-[var(--space-5)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[var(--space-3)]">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-sm font-black"
            style={{
              background: "rgba(var(--agent-accent-rgb), 0.15)",
              color: "var(--agent-accent)",
            }}
          >
            {level}
          </div>
          <div>
            <span className="text-sm font-bold text-ink-primary">
              Level {level}
            </span>
            <span className="block text-[10px] text-ink-tertiary">
              {rankTitle}
            </span>
          </div>
        </div>
        <span className="text-xs font-semibold text-ink-secondary">
          {xpInLevel.toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP
        </span>
      </div>

      {/* XP Gauge */}
      <div className="mt-[var(--space-4)] h-3 overflow-hidden rounded-full bg-[var(--bg-raised)]">
        <div
          className="relative h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, var(--agent-accent-dim), var(--agent-accent))`,
          }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)",
            }}
          />
        </div>
      </div>

      {/* Milestone markers */}
      <div className="relative mt-[var(--space-2)] flex justify-between px-1">
        {[25, 50, 75, 100].map((milestone) => {
          const reached = percent >= milestone;
          return (
            <div key={milestone} className="flex flex-col items-center">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: reached
                    ? "var(--agent-accent)"
                    : "var(--border-emphasis)",
                }}
              />
              {milestone === 100 && (
                <span className="mt-1 text-[9px] text-ink-muted">{"\uD83C\uDF81"}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
