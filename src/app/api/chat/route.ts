// ═══════════════════════════════════════════════════════════════════
// /api/chat — Streaming chat route (Phase 2.5a: Provider Swap)
// Uses Vercel AI SDK v6 + Anthropic provider. Auth gated via Supabase.
// ═══════════════════════════════════════════════════════════════════

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAgentSystemPrompt } from "@/lib/agents/prompts";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import type { NextRequest } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Auth gate — Loot Guard pattern: validate before any AI call
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Mission Mode: register tools and append tool instructions to system prompt
  const missionTools = missionId
    ? {
        initMission: tool({
          description: "Initialize the mission briefing board with the opening objective.",
          inputSchema: z.object({
            objective: z
              .string()
              .describe("The first objective shown on the briefing board."),
          }),
        }),
        updateStat: tool({
          description:
            "Update a stat gauge on the briefing board and highlight the corresponding blueprint element.",
          inputSchema: z.object({
            id: z
              .string()
              .describe(
                'Stat ID from mission config. For Dragon Bridge: "span", "cables", or "towers".'
              ),
            value: z.number().describe("The numeric value to display."),
            objective: z
              .string()
              .optional()
              .describe("Updated objective text. Omit if unchanged."),
          }),
        }),
      }
    : undefined;

  if (missionId) {
    systemPrompt += `\n\n## Mission Mode Instructions\nYou are running in Mission Mode for mission "${missionId}". On your very first response, call the \`initMission\` tool with a one-sentence opening objective. As the student correctly identifies values, call \`updateStat\` with the matching stat id ("span", "cables", or "towers"), the confirmed numeric value, and an optional updated objective. Do not call \`updateStat\` until the student's answer is confirmed correct.`;
  }

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: modelMessages,
    ...(missionTools
      ? { tools: missionTools, toolChoice: "auto", maxSteps: 2 }
      : {}),
  });

  return result.toUIMessageStreamResponse();
}
