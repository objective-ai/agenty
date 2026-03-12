"use client";

export interface Quest {
  id: string;
  title: string;
  description: string;
  agent: string;
  agentEmoji: string;
  xp: number;
  gold: number;
  difficulty: "Easy" | "Medium" | "Hard" | "Boss";
  progress: number; // 0-100
  status: "available" | "active" | "completed" | "locked";
  timeEstimate: string;
}

const DIFFICULTY_BADGE: Record<Quest["difficulty"], { label: string; color: string; bg: string }> = {
  Easy: { label: "Easy", color: "#10B981", bg: "rgba(16, 185, 129, 0.12)" },
  Medium: { label: "Medium", color: "#F5C542", bg: "rgba(245, 197, 66, 0.12)" },
  Hard: { label: "Hard", color: "#F97316", bg: "rgba(249, 115, 22, 0.12)" },
  Boss: { label: "Boss", color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)" },
};

export function QuestCard({ quest }: { quest: Quest }) {
  const diff = DIFFICULTY_BADGE[quest.difficulty];
  const isLocked = quest.status === "locked";
  const isCompleted = quest.status === "completed";

  return (
    <div
      className={`loot-card relative overflow-hidden p-[var(--space-5)] transition-all ${
        isLocked ? "opacity-40 pointer-events-none" : ""
      } ${isCompleted ? "opacity-70" : ""}`}
    >
      {/* Progress track at top */}
      {quest.status === "active" && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--bg-raised)]">
          <div
            className="h-full rounded-r-full transition-all duration-500"
            style={{
              width: `${quest.progress}%`,
              background: "var(--agent-accent)",
              boxShadow: `0 0 8px rgba(var(--agent-accent-rgb), 0.4)`,
            }}
          />
        </div>
      )}

      {/* Completed badge */}
      {isCompleted && (
        <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald/20 text-xs">
          ✓
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-[var(--space-3)]">
        <div className="flex items-center gap-[var(--space-3)]">
          <span className="text-lg">{quest.agentEmoji}</span>
          <div>
            <h3 className="text-sm font-bold text-ink-primary leading-tight">
              {quest.title}
            </h3>
            <span className="text-xs text-ink-tertiary">{quest.agent}</span>
          </div>
        </div>

        <span
          className="shrink-0 rounded-full px-[var(--space-2)] py-[2px] text-[10px] font-bold uppercase tracking-wider"
          style={{ color: diff.color, background: diff.bg }}
        >
          {diff.label}
        </span>
      </div>

      {/* Description */}
      <p className="mt-[var(--space-3)] text-xs leading-relaxed text-ink-secondary">
        {quest.description}
      </p>

      {/* Footer: Rewards + Time */}
      <div className="mt-[var(--space-4)] flex items-center justify-between">
        <div className="flex items-center gap-[var(--space-4)]">
          <span className="flex items-center gap-[var(--space-1)] text-xs font-semibold text-gold">
            <span className="text-sm">🪙</span> {quest.gold}
          </span>
          <span className="flex items-center gap-[var(--space-1)] text-xs font-semibold text-emerald">
            <span className="text-sm">⚡</span> {quest.xp} XP
          </span>
        </div>
        <span className="text-[10px] text-ink-muted">{quest.timeEstimate}</span>
      </div>

      {/* Action area */}
      {quest.status === "available" && (
        <button
          className="mt-[var(--space-4)] w-full rounded-[var(--radius-md)] py-[var(--space-2)] text-xs font-bold uppercase tracking-wider transition-all duration-200"
          style={{
            background: "rgba(var(--agent-accent-rgb), 0.12)",
            color: "var(--agent-accent)",
            border: "1px solid rgba(var(--agent-accent-rgb), 0.25)",
          }}
        >
          Accept Quest
        </button>
      )}

      {quest.status === "active" && (
        <button
          className="mt-[var(--space-4)] w-full rounded-[var(--radius-md)] py-[var(--space-2)] text-xs font-bold uppercase tracking-wider transition-all duration-200"
          style={{
            background: "var(--agent-accent)",
            color: "var(--bg-deep)",
          }}
        >
          Continue →
        </button>
      )}

      {isLocked && (
        <div className="mt-[var(--space-4)] flex items-center justify-center gap-[var(--space-2)] text-xs text-ink-muted">
          🔒 Complete prerequisites
        </div>
      )}
    </div>
  );
}
