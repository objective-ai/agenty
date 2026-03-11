-- ============================================================
-- AGENTY: Vector Knowledge Base — "The Vector Foundation"
-- Phase 2.5b — RAG infrastructure for per-user knowledge retrieval
-- Tables: knowledge_base
-- Security: RLS enabled, kid can READ own rows only,
--           all WRITES go through service_role (Server Actions)
-- ============================================================

-- =========================
-- 1. PGVECTOR EXTENSION
-- =========================
-- Enables vector similarity search (cosine, L2, inner product).
-- Installed in the extensions schema per Supabase convention.
create extension if not exists vector with schema extensions;

-- =========================
-- 2. KNOWLEDGE BASE
-- =========================
-- Stores chunked text from PDFs/lessons with their embeddings.
-- One row per chunk — embedding is a 1536-dim OpenAI vector.
-- profile_id scopes all knowledge strictly to a single player.
create table public.knowledge_base (
  id          uuid        primary key default gen_random_uuid(),
  content     text        not null,
  metadata    jsonb       not null default '{}',
  embedding   extensions.vector(1536) not null,
  profile_id  uuid        not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

comment on table public.knowledge_base is 'RAG knowledge store — PDF chunks with embeddings for per-user retrieval';

-- =========================
-- 3. HNSW INDEX
-- =========================
-- HNSW (Hierarchical Navigable Small World) index for sub-linear
-- approximate nearest-neighbour search using cosine distance.
-- m = 16: number of bi-directional links per node (memory vs recall trade-off)
-- ef_construction = 64: search width during index build (quality vs build time)
create index knowledge_base_embedding_idx on public.knowledge_base
  using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Supplementary index for fast per-profile row lookups
create index idx_knowledge_base_profile on public.knowledge_base(profile_id, created_at desc);

-- ============================================================
-- 4. ROW LEVEL SECURITY — "The Loot Guard"
-- ============================================================
-- Design principle:
--   Kids can SEE their own knowledge (SELECT).
--   Kids can NEVER directly INSERT/UPDATE/DELETE.
--   All writes happen via Server Actions using service_role key,
--   which bypasses RLS entirely.
-- ============================================================

alter table public.knowledge_base enable row level security;

-- Kids can read their own knowledge base entries
create policy "Users can view own knowledge"
  on public.knowledge_base for select
  using (auth.uid() = profile_id);

-- No INSERT/UPDATE/DELETE policies for anon/authenticated.
-- Service role bypasses RLS, so Server Actions can write freely.

-- ============================================================
-- 5. MATCH KNOWLEDGE RPC
-- ============================================================
-- Top-k cosine similarity search scoped to user's own knowledge base.
-- query_embedding: the vectorised user query (1536 dims)
-- match_count:     maximum number of chunks to return (default 5)
-- p_profile_id:    defaults to the calling user via auth.uid()
--
-- Returns rows ordered by ascending cosine distance (most similar first).
-- similarity = 1 − cosine_distance, so 1.0 is a perfect match.
-- ============================================================
create or replace function match_knowledge(
  query_embedding extensions.vector(1536),
  match_count     int     default 5,
  p_profile_id    uuid    default auth.uid()
)
returns table (
  id          uuid,
  content     text,
  metadata    jsonb,
  similarity  float
)
language plpgsql
security definer
as $$
begin
  return query
  select
    kb.id,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) as similarity
  from public.knowledge_base kb
  where kb.profile_id = p_profile_id
  order by kb.embedding <=> query_embedding
  limit match_count;
end;
$$;

comment on function match_knowledge is 'Top-k cosine similarity search scoped to user''s own knowledge base';
