import { MissionConfig } from './registry';
export const SOLAR_ISS_MISSION: MissionConfig = {
  id: "solar-iss",
  title: "ISS Solar Array · Array Alignment",
  blueprintAsset: "solar-iss",
  accentColor: "#3B82F6",
  defaultObjective:
    "Calculate the ISS solar array's operational parameters for optimal power generation",
  description:
    "The International Space Station relies on massive solar arrays for power. Cooper will brief Agent Kai on the array's three parameters — panel efficiency (0.75), array alignment (180°), and energy output (12.5 kW) — then quiz them on each value. Focus on decimals, fractions, and unit conversion.",
  xpReward: 300,
  goldReward: 150,
  stats: [
    { id: "panel_eff", label: "PANEL EFFICIENCY", unit: "frac", goalValue: 0.75, svgHighlightId: "solar_panels" },
    { id: "rotation", label: "ARRAY ALIGNMENT", unit: "deg", goalValue: 180, svgHighlightId: "panel_pivot" },
    { id: "output", label: "ENERGY OUTPUT", unit: "kW", goalValue: 12.5, svgHighlightId: "station_core" }
  ]
};
