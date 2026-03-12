// src/lib/missions/validator.ts
// ═══════════════════════════════════════════════════════════════════
// Deterministic validator for LLM-generated mission configs.
// Runs code-level checks — no LLM calls. This is the hard gate.
// ═══════════════════════════════════════════════════════════════════

import type { TemplateManifest, ZoneCategory } from "./templates";

// ── Types ─────────────────────────────────────────────────────────

export type ValidationError = { field: string; message: string };
export type ValidationResult = { valid: boolean; errors: ValidationError[] };

export type GeneratedStat = {
  id: string;
  label: string;
  unit: string;
  goalValue: number;
  svgHighlightId: string;
};

export type GeneratedMission = {
  title: string;
  slug: string;
  defaultObjective: string;
  description: string;
  accentColor: string;
  stats: GeneratedStat[];
  xpReward: number;
  goldReward: number;
};

// ── Unit lookup by zone category ──────────────────────────────────

const UNITS_BY_CATEGORY: Record<ZoneCategory, string[]> = {
  length: ["m", "ft", "km", "mi", "cm", "mm", "cubits", "yd"],
  count: ["qty", "cables", "blocks", "pairs", "units", "tons"],
  area: ["m\u00B2", "ft\u00B2", "km\u00B2", "acres", "ha"],
  rate: ["%", "frac", "ratio", "dB", "MHz", "GHz", "bps"],
  percentage: ["%", "frac", "ratio"],
  mass: ["kg", "g", "tons", "lb", "oz"],
  energy: ["kW", "W", "MW", "kWh", "Wh", "J"],
  angle: ["deg", "rad", "rpm", "rev"],
};

// ── Grade-level goalValue constraints ─────────────────────────────

type GradeConstraint = {
  min: number;
  max: number;
  maxDecimalPlaces: number;
};

function getGradeConstraint(gradeLevel: number): GradeConstraint {
  if (gradeLevel <= 2) return { min: 1, max: 100, maxDecimalPlaces: 0 };
  if (gradeLevel <= 4) return { min: 1, max: 10_000, maxDecimalPlaces: 0 };
  if (gradeLevel <= 6) return { min: 1, max: 100_000, maxDecimalPlaces: 1 };
  return { min: 1, max: 1_000_000, maxDecimalPlaces: 2 };
}

function countDecimalPlaces(n: number): number {
  const str = String(n);
  const dot = str.indexOf(".");
  return dot === -1 ? 0 : str.length - dot - 1;
}

// ── Math verb check ───────────────────────────────────────────────

const MATH_VERBS = [
  "calculate",
  "multiply",
  "divide",
  "add",
  "subtract",
  "fraction",
  "decimal",
  "area",
  "perimeter",
  "sum",
  "product",
  "quotient",
  "difference",
  "equation",
  "solve",
  "compute",
  "measure",
  "estimate",
  "convert",
];

// ── Validator ─────────────────────────────────────────────────────

export function validateMission(
  input: GeneratedMission,
  template: TemplateManifest,
  gradeLevel: number,
  problemCount?: number
): ValidationResult {
  const errors: ValidationError[] = [];
  const expectedCount = problemCount ?? template.zones.length;

  // 1. Zone coverage (relaxed for variable problemCount):
  //    - Every stat must reference a valid zone from the template (no unknown zones)
  //    - Zone reuse is allowed when problemCount > zones
  //    - Partial coverage is allowed when problemCount < zones
  //    - Stat count must equal expectedCount
  const templateZoneIds = new Set(template.zones.map((z) => z.svgHighlightId));

  for (const stat of input.stats) {
    if (!templateZoneIds.has(stat.svgHighlightId)) {
      errors.push({
        field: "stats",
        message: `Unknown zone "${stat.svgHighlightId}" — not in template "${template.templateId}"`,
      });
    }
  }
  if (input.stats.length !== expectedCount) {
    errors.push({
      field: "stats",
      message: `Expected ${expectedCount} stats, got ${input.stats.length}`,
    });
  }

  // 2. goalValue range by grade
  const constraint = getGradeConstraint(gradeLevel);
  for (const stat of input.stats) {
    if (stat.goalValue <= 0) {
      errors.push({
        field: `stats.${stat.id}.goalValue`,
        message: `goalValue must be positive, got ${stat.goalValue}`,
      });
    } else if (stat.goalValue < constraint.min || stat.goalValue > constraint.max) {
      errors.push({
        field: `stats.${stat.id}.goalValue`,
        message: `goalValue ${stat.goalValue} out of range [${constraint.min}, ${constraint.max}] for grade ${gradeLevel}`,
      });
    }
    if (countDecimalPlaces(stat.goalValue) > constraint.maxDecimalPlaces) {
      errors.push({
        field: `stats.${stat.id}.goalValue`,
        message: `goalValue ${stat.goalValue} has too many decimal places (max ${constraint.maxDecimalPlaces} for grade ${gradeLevel})`,
      });
    }
  }

  // 3. No duplicate goalValues
  const goalValues = input.stats.map((s) => s.goalValue);
  const uniqueGoals = new Set(goalValues);
  if (uniqueGoals.size !== goalValues.length) {
    errors.push({
      field: "stats",
      message: "Duplicate goalValues detected — each stat must have a unique goal",
    });
  }

  // 4. Stat ID format
  const statIdPattern = /^[a-z][a-z0-9_]{1,20}$/;
  const statIds = new Set<string>();
  for (const stat of input.stats) {
    if (!statIdPattern.test(stat.id)) {
      errors.push({
        field: `stats.${stat.id}.id`,
        message: `Stat ID "${stat.id}" must match /^[a-z][a-z0-9_]{1,20}$/`,
      });
    }
    if (statIds.has(stat.id)) {
      errors.push({
        field: `stats.${stat.id}.id`,
        message: `Duplicate stat ID "${stat.id}"`,
      });
    }
    statIds.add(stat.id);
  }

  // 5. Label format: ALL CAPS, 2-4 words, under 25 chars
  for (const stat of input.stats) {
    if (stat.label !== stat.label.toUpperCase()) {
      errors.push({
        field: `stats.${stat.id}.label`,
        message: `Label "${stat.label}" must be ALL CAPS`,
      });
    }
    const wordCount = stat.label.trim().split(/\s+/).length;
    if (wordCount < 1 || wordCount > 4) {
      errors.push({
        field: `stats.${stat.id}.label`,
        message: `Label "${stat.label}" must be 1-4 words (got ${wordCount})`,
      });
    }
    if (stat.label.length > 25) {
      errors.push({
        field: `stats.${stat.id}.label`,
        message: `Label "${stat.label}" exceeds 25 characters`,
      });
    }
  }

  // 6. Unit matches zone category
  for (const stat of input.stats) {
    const zone = template.zones.find(
      (z) => z.svgHighlightId === stat.svgHighlightId
    );
    if (zone) {
      const allowed = UNITS_BY_CATEGORY[zone.category];
      if (allowed && !allowed.includes(stat.unit)) {
        errors.push({
          field: `stats.${stat.id}.unit`,
          message: `Unit "${stat.unit}" not valid for zone category "${zone.category}". Allowed: ${allowed.join(", ")}`,
        });
      }
    }
  }

  // 7. Description quality
  if (input.description.length < 50) {
    errors.push({
      field: "description",
      message: `Description too short (${input.description.length} chars, min 50)`,
    });
  }
  if (input.description.length > 500) {
    errors.push({
      field: "description",
      message: `Description too long (${input.description.length} chars, max 500)`,
    });
  }
  const descLower = input.description.toLowerCase();
  const hasMathVerb = MATH_VERBS.some((v) => descLower.includes(v));
  if (!hasMathVerb) {
    errors.push({
      field: "description",
      message: `Description must contain at least one math-related word (${MATH_VERBS.slice(0, 5).join(", ")}...)`,
    });
  }

  // 8. Slug format
  const slugPattern = /^[a-z0-9][a-z0-9-]{2,40}$/;
  if (!slugPattern.test(input.slug)) {
    errors.push({
      field: "slug",
      message: `Slug "${input.slug}" must match /^[a-z0-9][a-z0-9-]{2,40}$/`,
    });
  }

  // 9. Reward bounds
  if (input.xpReward < 100 || input.xpReward > 300) {
    errors.push({
      field: "xpReward",
      message: `XP reward ${input.xpReward} out of range [100, 300]`,
    });
  }
  if (input.goldReward < 50 || input.goldReward > 150) {
    errors.push({
      field: "goldReward",
      message: `Gold reward ${input.goldReward} out of range [50, 150]`,
    });
  }

  // 10. Title length
  if (input.title.length > 50) {
    errors.push({
      field: "title",
      message: `Title "${input.title}" exceeds 50 characters`,
    });
  }
  if (input.title.length < 5) {
    errors.push({
      field: "title",
      message: `Title too short (min 5 characters)`,
    });
  }

  // 11. Accent color format
  const colorPattern = /^#[0-9A-Fa-f]{6}$/;
  if (!colorPattern.test(input.accentColor)) {
    errors.push({
      field: "accentColor",
      message: `Accent color "${input.accentColor}" must be a 6-digit hex (#RRGGBB)`,
    });
  }

  return { valid: errors.length === 0, errors };
}
