// ═══════════════════════════════════════════════════════════════════
// /api/chat — Streaming chat route (Phase 2.5a: Provider Swap)
// Uses Vercel AI SDK v6 + Anthropic provider. Auth gated via Supabase.
// ═══════════════════════════════════════════════════════════════════

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAgentSystemPrompt } from "@/lib/agents/prompts";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import { resolveMission } from "@/lib/missions/registry";
import type { NextRequest } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Auth gate — Loot Guard pattern: validate before any AI call
  // DEV BYPASS: set NEXT_PUBLIC_DEV_SKIP_AUTH=true in .env.local to skip auth in dev
  const devSkipAuth = process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true";

  let user: { id: string } | null = null;
  if (devSkipAuth) {
    const { DEV_USER_ID } = await import("@/lib/supabase/server");
    user = { id: DEV_USER_ID };
  } else {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json() as {
    messages: UIMessage[];
    agentId?: string;
    id?: string;
    missionId?: string | null;
  };

  const { messages, agentId = "cooper", missionId } = body;

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Invalid messages" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let systemPrompt = getAgentSystemPrompt(agentId);
  const modelMessages = await convertToModelMessages(messages);

  // RAG: retrieve relevant knowledge from user's uploaded documents
  const lastUserMessage = messages
    .filter((m) => m.role === "user")
    .pop();
  if (lastUserMessage) {
    const queryText = lastUserMessage.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" ");
    if (queryText) {
      const matches = await retrieveKnowledge(queryText, user.id, 3);
      if (matches.length > 0) {
        const context = matches
          .map((m, i) => `[Source ${i + 1}] ${m.content}`)
          .join("\n\n");
        systemPrompt += `\n\nRelevant knowledge from the player's uploaded intel:\n${context}\n\nUse this knowledge to inform your responses when relevant. Cite it naturally without mentioning "chunks" or "embeddings."`;
      }
    }
  }

  // Mission Mode: register updateStat tool and append grounded instructions
  const missionConfig = missionId ? await resolveMission(missionId) : undefined;
  const missionTools = missionConfig
    ? {
        updateStat: tool({
          description:
            "Update a stat gauge on the briefing board when the student correctly identifies a value.",
          inputSchema: z.object({
            id: z
              .string()
              .describe(
                `Stat ID from mission config: ${missionConfig.stats.map((s) => `"${s.id}"`).join(", ")}.`
              ),
            value: z.number().describe("The numeric value to display."),
            objective: z
              .string()
              .optional()
              .describe("Updated objective text. Omit if unchanged."),
          }),
          execute: async () => ({ ok: true }),
        }),
        reportWrongAnswer: tool({
          description:
            "Report that the student gave a wrong answer. This drains their shields.",
          inputSchema: z.object({
            statId: z
              .string()
              .describe("The stat the student was trying to solve."),
            wrongValue: z
              .number()
              .describe("The incorrect value the student provided."),
          }),
          execute: async () => ({ ok: true }),
        }),
      }
    : undefined;

  if (missionConfig) {
    const statDescriptions = missionConfig.stats
      .map((s) => `- "${s.id}" (${s.label}): goal = ${s.goalValue} ${s.unit}`)
      .join("\n");

    systemPrompt += `\n\n## Mission Mode Instructions
You are running in Mission Mode: "${missionConfig.title}".
${missionConfig.description}

Address the student as "Agent Kai". Frame the conversation as a tactical briefing.
The student's first message will be "begin" — this is an auto-trigger, not a real message. Do not acknowledge it. Start by briefly introducing the mission and presenting the raw intel data (rates, dimensions, component counts) — but do NOT reveal the final stat values directly. Frame the briefing so the student must calculate each stat from the clues you give.

### The Math-First Rule
NEVER ask the student to simply repeat a number from the intel. Instead, provide component values (e.g., a rate and a duration, two dimensions to multiply, a fraction and a whole) and require the student to CALCULATE the final stat value. The stat goal is the ANSWER to a math problem, not a lookup.

Tiered difficulty by mission:
- "dragon-bridge": Focus on Area and multiplication (e.g., "The span is 666m and the deck width is 37.5m — what's the deck area?")
- "mars-rover": Focus on multi-digit multiplication and division (e.g., "The rover travels 15 km per sol for 30 sols — what's the total range?")
- "great-pyramid": Focus on place value and fractions (e.g., "The Great Pyramid used 2,300,000 blocks — if this layer is 1/1000 of the total, how many blocks?")

### Stats to solve (one at a time, after briefing):
${statDescriptions}

### updateStat Rules
- Only call \`updateStat\` AFTER the student has solved the math problem and given the correct numeric answer — never when they just quote a number from the text.
- When the student answers correctly, call \`updateStat\` with the matching stat id and the goal value, then follow with congratulatory text.
- If the student's answer is wrong, call \`reportWrongAnswer\` with the stat ID and the wrong value, then give a hint and let them try again. Do not call \`updateStat\` on incorrect answers.
- Always follow tool calls with spoken text.

### PROTOCOL 07: MATH ENFORCEMENT (Anti-Cheat)
If a student says "I don't know" or "You didn't tell me," do NOT provide the answer. Instead, refer them back to the Intel Drawer and give a hint based on the mathematical operation required (e.g., "Check the multiplication of the power rate, Agent Kai").`;
  }

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: modelMessages,
    ...(missionTools
      ? { tools: missionTools, toolChoice: "auto", stopWhen: stepCountIs(3) }
      : {}),
  });

  return result.toUIMessageStreamResponse();
}
