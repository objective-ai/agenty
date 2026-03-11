// ═══════════════════════════════════════════════════════════════════
// /api/chat — Streaming chat route (Phase 2.5a: Provider Swap)
// Uses Vercel AI SDK v6 + Anthropic provider. Auth gated via Supabase.
// ═══════════════════════════════════════════════════════════════════

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
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
  };

  const { messages, agentId = "cooper" } = body;

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

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
