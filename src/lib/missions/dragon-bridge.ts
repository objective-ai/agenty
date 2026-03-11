// src/lib/missions/dragon-bridge.ts
import { MISSION_REGISTRY } from "./registry";

MISSION_REGISTRY.push({
  id: "dragon-bridge",
  title: "Dragon Bridge · Da Nang",
  blueprintAsset: "dragon-bridge",
  accentColor: "#3B82F6",
  isCritical: false,
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
});
