// src/__tests__/missions/validator-relaxed.test.ts
// Tests for relaxed zone coverage in validateMission with variable problemCount.

import { validateMission, type GeneratedMission } from "@/lib/missions/validator";
import type { TemplateManifest } from "@/lib/missions/templates";

// ── Fixtures ──────────────────────────────────────────────────────

const TEMPLATE_3_ZONES: TemplateManifest = {
  templateId: "bridge",
  displayName: "Cable-Stayed Bridge",
  svgFile: "dragon-bridge",
  zones: [
    { svgHighlightId: "span", label: "Deck Span", suggestedUnits: ["m", "ft", "km"], category: "length" },
    { svgHighlightId: "cables", label: "Support Cables", suggestedUnits: ["cables", "qty", "pairs"], category: "count" },
    { svgHighlightId: "towers", label: "Tower Structures", suggestedUnits: ["m", "ft"], category: "length" },
  ],
  suggestedTopics: ["architecture"],
  gradeRange: [3, 5],
};

function makeStat(overrides: Partial<{ id: string; label: string; unit: string; goalValue: number; svgHighlightId: string }> = {}) {
  return {
    id: overrides.id ?? "stat_a",
    label: overrides.label ?? "TEST STAT",
    unit: overrides.unit ?? "m",
    goalValue: overrides.goalValue ?? 100,
    svgHighlightId: overrides.svgHighlightId ?? "span",
  };
}

function makeBaseMission(statsOverride?: GeneratedMission["stats"]): GeneratedMission {
  return {
    title: "Test Mission Title Here",
    slug: "test-mission-title",
    defaultObjective: "Calculate the span of the bridge.",
    description: "Calculate the total span length using multiplication and area measurement for bridge construction planning.",
    accentColor: "#3B82F6",
    stats: statsOverride ?? [
      makeStat({ id: "deck_span", goalValue: 100, svgHighlightId: "span", unit: "m" }),
      makeStat({ id: "cable_count", goalValue: 200, svgHighlightId: "cables", unit: "cables", label: "CABLE COUNT" }),
      makeStat({ id: "tower_ht", goalValue: 300, svgHighlightId: "towers", unit: "m", label: "TOWER HEIGHT" }),
    ],
    xpReward: 150,
    goldReward: 75,
  };
}

// ── Tests ─────────────────────────────────────────────────────────

describe("validateMission with problemCount", () => {
  it("accepts problemCount=5 with 3 template zones (zone reuse)", () => {
    const stats = [
      makeStat({ id: "stat_a", goalValue: 100, svgHighlightId: "span", unit: "m" }),
      makeStat({ id: "stat_b", goalValue: 200, svgHighlightId: "cables", unit: "cables", label: "CABLE COUNT" }),
      makeStat({ id: "stat_c", goalValue: 300, svgHighlightId: "towers", unit: "m", label: "TOWER HEIGHT" }),
      makeStat({ id: "stat_d", goalValue: 400, svgHighlightId: "span", unit: "m", label: "EXTRA SPAN" }),
      makeStat({ id: "stat_e", goalValue: 500, svgHighlightId: "cables", unit: "cables", label: "MORE CABLES" }),
    ];
    const mission = makeBaseMission(stats);
    const result = validateMission(mission, TEMPLATE_3_ZONES, 4, 5);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts problemCount=3 with 5 template zones (partial coverage)", () => {
    // Template with 5 zones
    const template5: TemplateManifest = {
      ...TEMPLATE_3_ZONES,
      zones: [
        ...TEMPLATE_3_ZONES.zones,
        { svgHighlightId: "arch", label: "Arch", suggestedUnits: ["m", "ft"], category: "length" },
        { svgHighlightId: "foundation", label: "Foundation", suggestedUnits: ["m\u00B2", "ft\u00B2"], category: "area" },
      ],
    };
    const stats = [
      makeStat({ id: "stat_a", goalValue: 100, svgHighlightId: "span", unit: "m" }),
      makeStat({ id: "stat_b", goalValue: 200, svgHighlightId: "cables", unit: "cables", label: "CABLE COUNT" }),
      makeStat({ id: "stat_c", goalValue: 300, svgHighlightId: "towers", unit: "m", label: "TOWER HEIGHT" }),
    ];
    const mission = makeBaseMission(stats);
    const result = validateMission(mission, template5, 4, 3);
    expect(result.valid).toBe(true);
  });

  it("accepts problemCount=3 with 3 template zones (1:1 still works)", () => {
    const mission = makeBaseMission();
    const result = validateMission(mission, TEMPLATE_3_ZONES, 4, 3);
    expect(result.valid).toBe(true);
  });

  it("rejects unknown zone IDs even with relaxed coverage", () => {
    const stats = [
      makeStat({ id: "stat_a", goalValue: 100, svgHighlightId: "span", unit: "m" }),
      makeStat({ id: "stat_b", goalValue: 200, svgHighlightId: "FAKE_ZONE", unit: "m", label: "FAKE ZONE" }),
      makeStat({ id: "stat_c", goalValue: 300, svgHighlightId: "towers", unit: "m", label: "TOWER HEIGHT" }),
    ];
    const mission = makeBaseMission(stats);
    const result = validateMission(mission, TEMPLATE_3_ZONES, 4, 3);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("Unknown zone"))).toBe(true);
  });

  it("rejects when stat count does not match problemCount", () => {
    // 2 stats but problemCount=3
    const stats = [
      makeStat({ id: "stat_a", goalValue: 100, svgHighlightId: "span", unit: "m" }),
      makeStat({ id: "stat_b", goalValue: 200, svgHighlightId: "cables", unit: "cables", label: "CABLE COUNT" }),
    ];
    const mission = makeBaseMission(stats);
    const result = validateMission(mission, TEMPLATE_3_ZONES, 4, 3);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("Expected 3 stats"))).toBe(true);
  });

  it("defaults to template zone count when problemCount is not provided", () => {
    // 3 stats, 3 zones, no problemCount — backward compatible
    const mission = makeBaseMission();
    const result = validateMission(mission, TEMPLATE_3_ZONES, 4);
    expect(result.valid).toBe(true);
  });
});
