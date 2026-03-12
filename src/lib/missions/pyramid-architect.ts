import { MissionConfig } from './registry';
export const PYRAMID_MISSION: MissionConfig = {
  id: "pyramid-architect",
  title: "Giza Architect · Structural Analysis",
  blueprintAsset: "pyramid",
  accentColor: "#3B82F6",
  defaultObjective:
    "Analyze the Great Pyramid's structural dimensions and calculate key measurements",
  description:
    "The Great Pyramid of Giza is one of the Seven Wonders of the Ancient World. Cooper will brief Agent Kai on the pyramid's three key parameters — foundation area (52,900 m²), peak altitude (146m), and stone block count (2,300) — then quiz them on each value. Focus on place value and large number multiplication.",
  xpReward: 250,
  goldReward: 125,
  stats: [
    { id: "base_area", label: "FOUNDATION AREA", unit: "m²", goalValue: 52900, svgHighlightId: "pyramid_base" },
    { id: "height", label: "PEAK ALTITUDE", unit: "m", goalValue: 146, svgHighlightId: "pyramid_apex" },
    { id: "blocks", label: "STONE COUNT", unit: "qty", goalValue: 2300, svgHighlightId: "pyramid_blocks" }
  ]
};
