"use client";

import { useAgent, AGENTS, type AgentId } from "@/contexts/AgentContext";

const AGENT_COLORS: Record<AgentId, string> = {
  cooper: "#3B82F6",
  arlo: "#F97316",
  minh: "#10B981",
  maya: "#8B5CF6",
};

export function AgentSelector() {
  const { activeAgent, setActiveAgent } = useAgent();

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      {(Object.keys(AGENTS) as AgentId[]).map((id) => {
        const agent = AGENTS[id];
        const isActive = activeAgent === id;
        const color = AGENT_COLORS[id];

        return (
          <button
            key={id}
            onClick={() => setActiveAgent(id)}
            className="group relative flex items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] px-[var(--space-4)] py-[var(--space-3)] text-left transition-all duration-200"
            style={{
              background: isActive
                ? `rgba(${hexToRgb(color)}, 0.1)`
                : "transparent",
              borderLeft: isActive
                ? `3px solid ${color}`
                : "3px solid transparent",
            }}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-lg"
              style={{
                background: isActive
                  ? `rgba(${hexToRgb(color)}, 0.15)`
                  : "var(--bg-raised)",
              }}
            >
              {agent.emoji}
            </span>
            <div className="flex flex-col">
              <span
                className="text-sm font-semibold transition-colors"
                style={{
                  color: isActive ? color : "var(--ink-primary)",
                }}
              >
                {agent.name}
              </span>
              <span className="text-xs text-ink-tertiary">{agent.domain}</span>
            </div>
            {isActive && (
              <div
                className="absolute right-3 h-2 w-2 rounded-full"
                style={{ background: color }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
