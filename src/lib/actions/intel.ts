"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import OpenAI from "openai";

// ── Result Types ────────────────────────────────────────────────────────────
export interface ActionSuccess<T> {
  success: true;
  data: T;
}

export interface ActionError {
  success: false;
  error: string;
}

export type ActionResult<T> = ActionSuccess<T> | ActionError;

// ── Domain Types ─────────────────────────────────────────────────────────────
export interface UploadIntelResult {
  chunkCount: number;
  fileName: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const CHUNK_SIZE_CHARS = 2000; // ~500 tokens (1 token ≈ 4 chars)
const OVERLAP_CHARS = 200; // ~50 tokens overlap

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Chunk text into ~500-token pieces with ~50-token overlap.
 * Splits on paragraph boundaries (\n\n) where possible,
 * accumulates until ~CHUNK_SIZE_CHARS, then slices with overlap.
 */
function chunkText(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const candidate = current ? `${current}\n\n${para}` : para;

    if (candidate.length > CHUNK_SIZE_CHARS && current.length > 0) {
      chunks.push(current.trim());
      // Start next chunk with overlap from the end of current
      const overlap = current.slice(-OVERLAP_CHARS);
      current = `${overlap}\n\n${para}`;
    } else {
      current = candidate;
    }
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }

  // If no paragraph breaks produced reasonable chunks, fall back to hard split
  if (chunks.length === 0 && text.length > 0) {
    let i = 0;
    while (i < text.length) {
      chunks.push(text.slice(i, i + CHUNK_SIZE_CHARS));
      i += CHUNK_SIZE_CHARS - OVERLAP_CHARS;
    }
  }

  return chunks;
}

// ── Server Action ─────────────────────────────────────────────────────────────

/**
 * Accepts a PDF file via FormData, extracts text, generates embeddings,
 * and stores all chunks in the knowledge_base table via supabaseAdmin.
 */
export async function uploadIntel(
  formData: FormData
): Promise<ActionResult<UploadIntelResult>> {
  // 1. Auth check
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  // 2. Extract file from FormData
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No file provided" };
  }

  // 3. Validate: PDF only, max 10 MB
  if (file.type !== "application/pdf") {
    return { success: false, error: "File must be a PDF" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File exceeds 10 MB limit" };
  }

  // 4. Parse PDF → raw text
  let rawText: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // pdf-parse v2: ESM named export; pass buffer via the 'data' option field
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    rawText = result.text;
  } catch {
    return { success: false, error: "Failed to parse PDF" };
  }

  if (!rawText || rawText.trim().length === 0) {
    return { success: false, error: "PDF contains no extractable text" };
  }

  // 5. Chunk text
  const chunks = chunkText(rawText);
  if (chunks.length === 0) {
    return { success: false, error: "No content chunks extracted from PDF" };
  }

  // 6. Generate embeddings via OpenAI (batch all chunks)
  const openai = new OpenAI(); // reads OPENAI_API_KEY from env
  let embeddings: number[][];
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
    });
    // Response data is ordered to match input array
    embeddings = response.data.map((item) => item.embedding);
  } catch {
    return { success: false, error: "Failed to generate embeddings" };
  }

  // 7. Build rows for bulk insert
  const uploadedAt = new Date().toISOString();
  const rows = chunks.map((content, idx) => ({
    profile_id: userId,
    content,
    embedding: JSON.stringify(embeddings[idx]),
    metadata: {
      source: file.name,
      uploadedAt,
      chunkIndex: idx,
    },
  }));

  // 8. Insert into knowledge_base
  const { error: insertError } = await supabaseAdmin
    .from("knowledge_base")
    .insert(rows);

  if (insertError) {
    return { success: false, error: "Failed to store intel in knowledge base" };
  }

  return {
    success: true,
    data: { chunkCount: chunks.length, fileName: file.name },
  };
}
