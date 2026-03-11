// src/lib/missions/registry.ts

export const DEFAULT_MISSION_ID = "dragon-bridge";

export type MissionStatConfig = {
  id: string;
  label: string;
  unit: string;
  goalValue?: number;
  svgHighlightId: string;
};

export type MissionConfig = {
  id: string;
  title: string;
  blueprintAsset: string;
  accentColor: string;
  isCritical?: boolean;
  stats: MissionStatConfig[];
};

// Ordered array — first entry is the default
export const MISSION_REGISTRY: MissionConfig[] = [];

export function getMissionById(id: string): MissionConfig | undefined {
  return MISSION_REGISTRY.find((m) => m.id === id);
}
