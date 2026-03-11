import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { KnowledgeMatch } from "@/lib/types/knowledge";

const openai = new OpenAI(); // reads OPENAI_API_KEY from env

/**
 * Retrieve the most relevant knowledge chunks for a given query.
 * Generates an embedding for the query, then calls the match_knowledge
 * Supabase RPC to perform vector similarity search.
 *
 * Used by the chat API route to inject context into agent prompts (RAG).
 */
export async function retrieveKnowledge(
  query: string,
  profileId: string,
  matchCount: number = 5
): Promise<KnowledgeMatch[]> {
  // 1. Embed the query
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;

  // 2. Vector similarity search via Supabase RPC
  const { data, error } = await supabaseAdmin.rpc("match_knowledge", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    p_profile_id: profileId,
  });

  if (error) {
    console.error("[retrieveKnowledge] RPC error:", error.message);
    return [];
  }

  return (data ?? []) as KnowledgeMatch[];
}
