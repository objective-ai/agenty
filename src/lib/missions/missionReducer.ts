// src/lib/missions/missionReducer.ts
import type { MissionConfig } from "./registry";

export type MissionStatus = "ghost" | "active" | "complete";

export type StatEntry = {
  value: number | null;
  unit: string;
  goalValue?: number;
  solved: boolean;
};

export type MissionState = {
  status: MissionStatus;
  isDrawerOpen: boolean;
  currentObjective: string;
  stats: Record<string, StatEntry>;
  activeHighlight: string | null;
};

export type MissionAction =
  | { type: "MISSION_INIT"; payload: { objective: string } }
  | { type: "STAT_UPDATE"; payload: { id: string; value: number; objective?: string } }
  | { type: "HIGHLIGHT_CLEAR" }
  | { type: "OPEN_INTEL_DRAWER" }
  | { type: "CLOSE_INTEL_DRAWER" };

export function initialState(config: MissionConfig): MissionState {
  return {
    status: "ghost",
    isDrawerOpen: false,
    currentObjective: "",
    activeHighlight: null,
    stats: Object.fromEntries(
      config.stats.map((s) => [
        s.id,
        { value: null, unit: s.unit, goalValue: s.goalValue, solved: false },
      ])
    ),
  };
}

export function missionReducer(
  state: MissionState,
  action: MissionAction
): MissionState {
  switch (action.type) {
    case "MISSION_INIT":
      return { ...state, status: "active", currentObjective: action.payload.objective };

    case "STAT_UPDATE": {
      const { id, value, objective } = action.payload;
      // Guard: ignore hallucinated stat IDs
      if (!state.stats[id]) return state;

      const entry = state.stats[id];
      const solved = entry.goalValue !== undefined ? value >= entry.goalValue : false;
      const updatedStats = {
        ...state.stats,
        [id]: { ...entry, value, solved },
      };

      const allSolved = Object.values(updatedStats)
        .filter((s) => s.goalValue !== undefined)
        .every((s) => s.solved);

      return {
        ...state,
        stats: updatedStats,
        activeHighlight: id,
        currentObjective: objective ?? state.currentObjective,
        status: allSolved ? "complete" : state.status,
      };
    }

    case "HIGHLIGHT_CLEAR":
      return { ...state, activeHighlight: null };

    case "OPEN_INTEL_DRAWER":
      return { ...state, isDrawerOpen: true };

    case "CLOSE_INTEL_DRAWER":
      return { ...state, isDrawerOpen: false };

    default:
      return state;
  }
}
