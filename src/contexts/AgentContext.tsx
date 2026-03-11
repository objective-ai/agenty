"use client";

import {
  createContext, useContext, useState, useCallback,
  useLayoutEffect, useEffect, type ReactNode
} from "react";

// SSR-safe layout effect: runs synchronously before paint on client, falls back to useEffect on server
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type AgentId = "cooper" | "arlo" | "minh" | "maya";

export interface Agent {
  id: AgentId;
  name: string;
  title: string;
  emoji: string;       // mechanic icon fallback (kept for non-avatar contexts)
  avatar: string | null; // path to holographic portrait image (null = use HolographicAvatar initial)
  domain: string;
  specialty: string;   // shown on AgentPicker card
  color: string;       // hex value for neon glow
}

export const AGENTS: Record<AgentId, Agent> = {
  cooper: {
    id: "cooper",
    name: "Cooper",           // strict name policy: first name only per AGENTS.md
    title: "Tactician",
    emoji: "\u{1F9E0}",
    avatar: "/cooper-hologram.png",  // Comms Patch: real holographic portrait
    domain: "Strategy & Math",
    specialty: "Math, Logic & Economy",
    color: "#3B82F6",
  },
  arlo: {
    id: "arlo",
    name: "Arlo",
    title: "Builder",
    emoji: "\u2699\uFE0F",
    avatar: null,  // Comms Patch: HolographicAvatar renders styled initial "A" + orange glow
    domain: "Technology & Maker Skills",
    specialty: "Technology & Maker Skills",
    color: "#F97316",
  },
  minh: {
    id: "minh",
    name: "Minh",
    title: "Explorer",
    emoji: "\u{1F409}",
    avatar: null,  // Comms Patch: HolographicAvatar renders styled initial "M" + jade glow
    domain: "Science & Discovery",
    specialty: "Science & Discovery",
    color: "#10B981",
  },
  maya: {
    id: "maya",
    name: "Maya",
    title: "Lorekeeper",
    emoji: "\u2728",
    avatar: null,  // Comms Patch: HolographicAvatar renders styled initial "M" + violet glow
    domain: "Reading & Creative Writing",
    specialty: "Reading & Creative Writing",
    color: "#8B5CF6",
  },
};

interface AgentContextValue {
  activeAgent: AgentId;
  setActiveAgent: (id: AgentId) => void;
  agent: Agent;
}

const AgentContext = createContext<AgentContextValue | null>(null);

interface AgentProviderProps {
  children: ReactNode;
  initialAgent?: AgentId;
}

export function AgentProvider({ children, initialAgent = "cooper" }: AgentProviderProps) {
  const [activeAgent, setActiveAgentState] = useState<AgentId>(initialAgent);

  // FIXED: was in render body causing hydration mismatch — now in useIsomorphicLayoutEffect
  useIsomorphicLayoutEffect(() => {
    document.documentElement.setAttribute("data-agent", activeAgent);
  }, [activeAgent]);

  const setActiveAgent = useCallback((id: AgentId) => {
    setActiveAgentState(id);
    // useIsomorphicLayoutEffect above handles the DOM update reactively
  }, []);

  return (
    <AgentContext.Provider
      value={{
        activeAgent,
        setActiveAgent,
        agent: AGENTS[activeAgent],
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used within AgentProvider");
  return ctx;
}
