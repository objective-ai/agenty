"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";

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
  // DEV BYPASS: matches /api/chat dev bypass
  if (process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true") {
    const { DEV_USER_ID } = await import("@/lib/supabase/server");
    return DEV_USER_ID;
  }

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
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    rawText = result.text;
  } catch (err) {
    console.error("[uploadIntel] PDF parse error:", err);
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
    // pgvector expects "[0.1,0.2,...]" format — bracket notation, not JSON-stringified array
    embedding: `[${embeddings[idx].join(",")}]`,
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
    console.error("[uploadIntel] DB insert error:", insertError.message);
    return { success: false, error: "Failed to store intel in knowledge base" };
  }

  return {
    success: true,
    data: { chunkCount: chunks.length, fileName: file.name },
  };
}

// ── List uploaded files ───────────────────────────────────────────────────────

export interface IntelFile {
  source: string;
  uploadedAt: string;
  chunkCount: number;
}

/**
 * Returns one entry per unique source file the user has uploaded,
 * with the chunk count and upload timestamp.
 */
export async function listIntelFiles(): Promise<ActionResult<IntelFile[]>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabaseAdmin
    .from("knowledge_base")
    .select("metadata")
    .eq("profile_id", userId);

  if (error) {
    console.error("[listIntelFiles] error:", error.message);
    return { success: false, error: "Failed to fetch intel files" };
  }

  // Aggregate by source filename
  const map = new Map<string, { uploadedAt: string; chunkCount: number }>();
  for (const row of data ?? []) {
    const { source, uploadedAt } = row.metadata as { source: string; uploadedAt: string };
    const existing = map.get(source);
    if (!existing) {
      map.set(source, { uploadedAt, chunkCount: 1 });
    } else {
      existing.chunkCount += 1;
    }
  }

  const files: IntelFile[] = Array.from(map.entries())
    .map(([source, { uploadedAt, chunkCount }]) => ({ source, uploadedAt, chunkCount }))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  return { success: true, data: files };
}

// ── Delete a file's chunks ────────────────────────────────────────────────────

/**
 * Deletes ALL knowledge_base chunks for a given source filename.
 * Used to remove duplicate uploads.
 */
export async function deleteIntelFile(
  source: string
): Promise<ActionResult<{ deleted: number }>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabaseAdmin
    .from("knowledge_base")
    .delete()
    .eq("profile_id", userId)
    .filter("metadata->>source", "eq", source)
    .select("id");

  if (error) {
    console.error("[deleteIntelFile] error:", error.message);
    return { success: false, error: "Failed to delete intel file" };
  }

  return { success: true, data: { deleted: (data ?? []).length } };
}
