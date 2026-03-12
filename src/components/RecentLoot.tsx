"use client";

import { useState, useEffect } from "react";
import { getRecentLoot, type LootEntry } from "@/lib/actions/economy";

const SOURCE_LABELS: Record<string, string> = {
  daily_bonus: "Daily Reward",
  quest_complete: "Quest Complete",
};

function formatSource(source: string): string {
  if (SOURCE_LABELS[source]) return SOURCE_LABELS[source];
  if (source.startsWith("mission:")) return "Mission Reward";
  // Fallback: capitalize
  return source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function RecentLoot() {
  const [loot, setLoot] = useState<LootEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getRecentLoot(10).then((result) => {
      if (cancelled) return;
      if (result.success) setLoot(result.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="loot-card p-[var(--space-5)]">
      <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
        Recent Loot
      </span>

      <div className="mt-[var(--space-4)] flex flex-col gap-[var(--space-3)]">
        {loading ? (
          <div className="py-4 text-center text-xs text-ink-muted">Loading...</div>
        ) : loot.length === 0 ? (
          <div className="py-4 text-center text-xs text-ink-muted">
            No loot yet -- complete a quest!
          </div>
        ) : (
          loot.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)]"
              style={{ background: "var(--bg-raised)" }}
            >
              <span className="text-base">{"\uD83E\uDE99"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-primary truncate">
                    {formatSource(entry.source)}
                  </span>
                  <span
                    className="text-xs font-bold shrink-0 ml-2"
                    style={{ color: "var(--gold)" }}
                  >
                    +{entry.amount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-tertiary truncate">
                    {entry.description ?? formatSource(entry.source)}
                  </span>
                  <span className="text-[10px] text-ink-muted shrink-0 ml-2">
                    {formatRelativeTime(entry.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
