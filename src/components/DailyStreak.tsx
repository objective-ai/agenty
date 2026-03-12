"use client";

import { useEconomy } from "@/contexts/EconomyContext";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function DailyStreak() {
  const { streakDays } = useEconomy();

  // Map streak count to day indicators: first N days are "done"
  const today = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const todayIndex = today === 0 ? 6 : today - 1; // Convert to M=0 ... S=6

  return (
    <div className="loot-card p-[var(--space-5)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
          Daily Streak
        </span>
        <span className="text-xs font-bold" style={{ color: "var(--amber)" }}>
          {"\uD83D\uDD25"} {streakDays} {streakDays === 1 ? "day" : "days"}
        </span>
      </div>

      <div className="mt-[var(--space-4)] flex items-center justify-between gap-[var(--space-2)]">
        {DAYS.map((day, i) => {
          // Show checkmarks for days before today up to streakDays count
          const done = i < todayIndex && i >= todayIndex - streakDays;
          const isToday = i === todayIndex;

          return (
            <div key={i} className="flex flex-col items-center gap-[var(--space-2)]">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-xs font-bold transition-all"
                style={{
                  background: done
                    ? "rgba(var(--agent-accent-rgb), 0.15)"
                    : isToday
                    ? "var(--bg-raised)"
                    : "var(--bg-abyss)",
                  color: done
                    ? "var(--agent-accent)"
                    : isToday
                    ? "var(--ink-primary)"
                    : "var(--ink-muted)",
                  border: isToday
                    ? "1px solid rgba(var(--agent-accent-rgb), 0.3)"
                    : "1px solid transparent",
                }}
              >
                {done ? "\u2713" : day}
              </div>
              <span
                className="text-[9px]"
                style={{
                  color: isToday ? "var(--agent-accent)" : "var(--ink-muted)",
                }}
              >
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
