// src/lib/missions/templates.ts
// ═══════════════════════════════════════════════════════════════════
// SVG Template Manifest System — maps master blueprints to highlight zones
// The LLM doesn't draw SVGs; it selects a template and assigns stats to zones.
// ═══════════════════════════════════════════════════════════════════

export type ZoneCategory =
  | "length"
  | "count"
  | "area"
  | "rate"
  | "percentage"
  | "mass"
  | "energy"
  | "angle";

export type TemplateZone = {
  svgHighlightId: string;
  label: string;
  suggestedUnits: string[];
  category: ZoneCategory;
};

export type TemplateManifest = {
  templateId: string;
  displayName: string;
  svgFile: string; // filename in /public/blueprints/ (no .svg extension)
  zones: TemplateZone[];
  suggestedTopics: string[];
  gradeRange: [number, number];
};

// ── Master Templates ──────────────────────────────────────────────

export const TEMPLATE_MANIFESTS: TemplateManifest[] = [
  {
    templateId: "bridge",
    displayName: "Cable-Stayed Bridge",
    svgFile: "dragon-bridge",
    zones: [
      {
        svgHighlightId: "span",
        label: "Deck Span",
        suggestedUnits: ["m", "ft", "km"],
        category: "length",
      },
      {
        svgHighlightId: "cables",
        label: "Support Cables",
        suggestedUnits: ["cables", "qty", "pairs"],
        category: "count",
      },
      {
        svgHighlightId: "towers",
        label: "Tower Structures",
        suggestedUnits: ["m", "ft"],
        category: "length",
      },
    ],
    suggestedTopics: ["architecture", "engineering", "geography", "bridges"],
    gradeRange: [3, 5],
  },
  {
    templateId: "rover",
    displayName: "Planetary Rover",
    svgFile: "mars-rover",
    zones: [
      {
        svgHighlightId: "rover_chassis",
        label: "Main Body",
        suggestedUnits: ["kWh", "kg", "units"],
        category: "energy",
      },
      {
        svgHighlightId: "rover_wheels",
        label: "Wheels / Locomotion",
        suggestedUnits: ["km", "mi", "m"],
        category: "length",
      },
      {
        svgHighlightId: "rover_antenna",
        label: "Antenna / Comms",
        suggestedUnits: ["%", "dB", "MHz"],
        category: "rate",
      },
    ],
    suggestedTopics: ["space", "robotics", "planets", "exploration"],
    gradeRange: [3, 6],
  },
  {
    templateId: "pyramid",
    displayName: "Ancient Pyramid",
    svgFile: "pyramid",
    zones: [
      {
        svgHighlightId: "pyramid_base",
        label: "Foundation",
        suggestedUnits: ["m\u00B2", "ft\u00B2", "m"],
        category: "area",
      },
      {
        svgHighlightId: "pyramid_apex",
        label: "Peak / Apex",
        suggestedUnits: ["m", "ft", "cubits"],
        category: "length",
      },
      {
        svgHighlightId: "pyramid_blocks",
        label: "Building Blocks",
        suggestedUnits: ["qty", "blocks", "tons"],
        category: "count",
      },
    ],
    suggestedTopics: ["ancient history", "architecture", "Egypt", "construction"],
    gradeRange: [3, 6],
  },
  {
    templateId: "solar",
    displayName: "Space Station",
    svgFile: "solar-iss",
    zones: [
      {
        svgHighlightId: "solar_panels",
        label: "Solar Panels",
        suggestedUnits: ["frac", "%", "ratio"],
        category: "rate",
      },
      {
        svgHighlightId: "panel_pivot",
        label: "Pivot / Rotation",
        suggestedUnits: ["deg", "rad", "rpm"],
        category: "angle",
      },
      {
        svgHighlightId: "station_core",
        label: "Station Core",
        suggestedUnits: ["kW", "W", "MW"],
        category: "energy",
      },
    ],
    suggestedTopics: ["space station", "solar energy", "orbital mechanics", "ISS"],
    gradeRange: [4, 7],
  },
];

// ── Lookups ───────────────────────────────────────────────────────

export function getTemplateById(id: string): TemplateManifest | undefined {
  return TEMPLATE_MANIFESTS.find((t) => t.templateId === id);
}

export function getTemplateZoneIds(templateId: string): string[] {
  const template = getTemplateById(templateId);
  return template ? template.zones.map((z) => z.svgHighlightId) : [];
}
