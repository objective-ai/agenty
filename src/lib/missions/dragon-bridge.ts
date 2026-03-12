// src/lib/missions/dragon-bridge.ts
import type { MissionConfig } from "./registry";

export const DRAGON_BRIDGE_MISSION: MissionConfig = {
  id: "dragon-bridge",
  title: "Dragon Bridge · Da Nang",
  blueprintAsset: "dragon-bridge",
  accentColor: "#3B82F6",
  isCritical: false,
  defaultObjective:
    "Analyze the Dragon Bridge blueprint and identify key structural measurements",
  description:
    "The Dragon Bridge (Cầu Rồng) in Da Nang, Vietnam is a cable-stayed bridge spanning the Hàn River. Cooper will brief Agent Kai on the bridge's three key measurements — main span (666m), support cables (36), and tower height (91m) — then quiz them on each value. Present the facts conversationally first, then ask one question at a time.",
  xpReward: 150,
  goldReward: 75,
  stats: [
    {
      id: "span",
      label: "SPAN LENGTH",
      unit: "m",
      goalValue: 666,
      svgHighlightId: "span",
    },
    {
      id: "cables",
      label: "CABLE COUNT",
      unit: "cables",
      goalValue: 36,
      svgHighlightId: "cables",
    },
    {
      id: "towers",
      label: "TOWER HEIGHT",
      unit: "m",
      goalValue: 91,
      svgHighlightId: "towers",
    },
  ],
};
