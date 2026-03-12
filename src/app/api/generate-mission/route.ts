// ═══════════════════════════════════════════════════════════════════
// /api/generate-mission — Mission Architect AI generation endpoint
// Takes topic + skill + template → returns validated MissionConfig JSON.
// Does NOT save to DB — parent previews first, then approves via Server Action.
// ═══════════════════════════════════════════════════════════════════

import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTemplateById } from "@/lib/missions/templates";
import {
  validateMission,
  type GeneratedMission,
} from "@/lib/missions/validator";
import type { NextRequest } from "next/server";

export const maxDuration = 60; // generation can take a moment

// ── Input schema ──────────────────────────────────────────────────

const GenerateInput = z.object({
  topic: z.string().min(2).max(100),
  skillFocus: z.enum([
    "multiplication",
    "division",
    "fractions",
    "decimals",
    "place-value",
    "area",
    "addition",
    "subtraction",
    "mixed",
  ]),
  gradeLevel: z.number().int().min(1).max(8).default(4),
  templateId: z.string(),
  problemCount: z.number().int().refine((v) => [3, 5, 10].includes(v), { message: "Must be 3, 5, or 10" }).default(3),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  narrativeTheme: z.enum(["space", "nature", "history", "fantasy"]).default("space"),
  timeEstimate: z.enum(["short", "medium", "long"]).default("medium"),
});

// ── Route handler ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth gate
  const devSkipAuth = process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true";
  let userId: string | null = null;

  if (devSkipAuth) {
    const { DEV_PARENT_ID } = await import("@/lib/supabase/server");
    userId = DEV_PARENT_ID; // generation is a parent action
  } else {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  }

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate input
  const body = await req.json();
  const parsed = GenerateInput.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { topic, skillFocus, gradeLevel, templateId, problemCount, difficulty, narrativeTheme, timeEstimate } = parsed.data;

  // Validate template exists
  const template = getTemplateById(templateId);
  if (!template) {
    return Response.json(
      { error: `Unknown template: "${templateId}"` },
      { status: 400 }
    );
  }

  // Build the zone description for the prompt
  const zoneDescriptions = template.zones
    .map(
      (z) =>
        `- svgHighlightId: "${z.svgHighlightId}" | zone label: "${z.label}" | category: ${z.category} | suggested units: ${z.suggestedUnits.join(", ")}`
    )
    .join("\n");

  // Build grade constraint description
  const gradeHint =
    gradeLevel <= 2
      ? "Whole numbers only, range 1-100."
      : gradeLevel <= 4
        ? "Whole numbers only, range 1-10,000."
        : gradeLevel <= 6
          ? "Up to 1 decimal place allowed, range 1-100,000."
          : "Up to 2 decimal places allowed, range 1-1,000,000.";

  // Difficulty-based goalValue hints
  const difficultyHint =
    difficulty === "easy"
      ? "Use simple, round numbers (multiples of 5 or 10). Keep calculations straightforward — single-step operations."
      : difficulty === "hard"
        ? "Use more challenging numbers. Multi-step calculations encouraged. Larger values within grade range."
        : "Use moderate numbers appropriate for grade level. Standard difficulty calculations.";

  // Difficulty-based reward hints
  const rewardHint =
    difficulty === "easy"
      ? "XP reward: 100-150. Gold reward: 50-75."
      : difficulty === "hard"
        ? "XP reward: 200-300. Gold reward: 100-150."
        : "XP reward: 150-200. Gold reward: 75-100.";

  const systemPrompt = `You are the Agenty Mission Architect. Your task is to create an educational math mission for a grade ${gradeLevel} student.

## Input
- Topic: ${topic}
- Math Skill: ${skillFocus}
- Grade Level: ${gradeLevel}
- Template: ${template.displayName}
- Problem Count: ${problemCount}
- Difficulty: ${difficulty}
- Narrative Theme: ${narrativeTheme}
- Time Estimate: ${timeEstimate}

## Template Zones (assign stats to these zones — zone reuse allowed if needed)
${zoneDescriptions}

## Rules
1. TITLE format: "Topic Name · Location/Context", under 50 characters total.
2. SLUG: URL-safe lowercase with hyphens, 3-40 characters (e.g., "jupiter-moons-3rd").
3. Generate exactly ${problemCount} stats. Each stat goalValue must be a NUMBER that a grade-${gradeLevel} student would CALCULATE from clues — not look up. ${gradeHint} ${difficultyHint}
4. Each stat must map to a template zone via svgHighlightId. Only use zones from the template. Zone reuse is allowed when ${problemCount} > ${template.zones.length} (assign multiple stats to the same zone). Partial coverage is fine when ${problemCount} < ${template.zones.length}.
5. The DESCRIPTION (50-500 chars) must explain the real-world context AND specify what math operations the agent should use. Include at least one math-related word (calculate, multiply, divide, etc.).
6. The DEFAULT_OBJECTIVE must be a single sentence starting with a verb.
7. Stat labels: ALL CAPS, 1-4 words, under 25 characters.
8. Stat IDs: snake_case, match the conceptual meaning (not the SVG zone name).
9. Each stat must have a UNIQUE goalValue — no duplicates.
10. Pick a unit for each stat from the zone's suggested units list. The unit MUST match the zone's category.
11. ${rewardHint}
12. Accent color: always "#3B82F6" (Adventure Blue).

## Narrative Theme
Set the mission in a **${narrativeTheme}** theme. Use ${narrativeTheme}-flavored language in the title, description, and objective. Examples:
- space: cosmic, orbital, stellar, interplanetary
- nature: wilderness, ecosystem, botanical, geological
- history: ancient, archaeological, expedition, civilization
- fantasy: enchanted, mythical, arcane, legendary

## Math Problem Design
The description should frame each stat as a math problem:
- For multiplication: provide two factors the student multiplies
- For division: provide a total and a divisor
- For fractions: provide a whole and a fraction to apply
- For area: provide length × width dimensions
- For addition/subtraction: provide component values to combine

Call the createMission tool with your result.`;

  // Structured output schema
  const missionSchema = z.object({
    title: z.string(),
    slug: z.string(),
    defaultObjective: z.string(),
    description: z.string(),
    accentColor: z.string(),
    stats: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          unit: z.string(),
          goalValue: z.number(),
          svgHighlightId: z.string(),
        })
      )
      .length(problemCount),
    xpReward: z.number().int(),
    goldReward: z.number().int(),
  });

  // Attempt generation with one retry on validation failure
  let lastErrors: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const userPrompt =
      attempt === 0
        ? `Create a grade ${gradeLevel} math mission about "${topic}" focusing on ${skillFocus}. Use the ${template.displayName} template.`
        : `Create a grade ${gradeLevel} math mission about "${topic}" focusing on ${skillFocus}. Use the ${template.displayName} template.\n\nYour previous attempt had validation errors. Fix these issues:\n${lastErrors}`;

    const result = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      prompt: userPrompt,
      schema: missionSchema,
    });

    const generated = result.object as GeneratedMission;

    // Run deterministic validator
    const validation = validateMission(generated, template, gradeLevel, problemCount);

    if (validation.valid) {
      return Response.json({
        mission: {
          ...generated,
          templateId,
          gradeLevel,
          topic,
          skillFocus,
          problemCount,
          difficulty,
          narrativeTheme,
          timeEstimate,
        },
      });
    }

    // Validation failed — format errors for retry
    lastErrors = validation.errors
      .map((e) => `- ${e.field}: ${e.message}`)
      .join("\n");
  }

  // Both attempts failed
  return Response.json(
    {
      error: "Generation failed validation after 2 attempts",
      validationErrors: lastErrors,
    },
    { status: 422 }
  );
}
