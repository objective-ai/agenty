import type { MissionConfig } from "./registry";

/**
 * MISSION: Red Planet Rover · Jezero Crater
 * Focus: Multi-digit Multiplication and Division (4th Grade Standards)
 */
export const MARS_ROVER_MISSION: MissionConfig = {
  id: "mars-rover",
  title: "Red Planet Rover · Jezero Crater",
  blueprintAsset: "mars-rover",
  accentColor: "#3B82F6",
  isCritical: false,
  defaultObjective:
    "Calculate the rover's key operational parameters for the Jezero Crater mission",
  description:
    "NASA's Perseverance rover is exploring Jezero Crater on Mars. Cooper will brief Agent Kai on the rover's three operational parameters — battery charge (450 kWh), exploration range (125 km), and signal strength (98%) — then quiz them on each value. Present the facts conversationally first, then ask one question at a time.",
  xpReward: 200,
  goldReward: 100,
  stats: [
    {
      id: "battery",           // Tool call ID: updateStat({ id: "battery", ... })
      label: "BATTERY CHARGE",
      unit: "kWh",
      goalValue: 450,          // Triggers success state at 450
      svgHighlightId: "rover_chassis" // ID attribute in the SVG file
    },
    {
      id: "distance",
      label: "EXPLORATION RANGE",
      unit: "km",
      goalValue: 125,
      svgHighlightId: "rover_wheels"
    },
    {
      id: "signal",
      label: "SIGNAL STRENGTH",
      unit: "%",
      goalValue: 98,
      svgHighlightId: "rover_antenna"
    }
  ]
};
