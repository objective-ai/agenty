# AGENTY — Phase 2.5: The Intelligence Core

## Strategy
Ship Claude + RAG as fast as possible to unblock Phase 3 (Quests).
Three sub-phases, executed sequentially. No Gemini, no Mission Ledger, no image gen.

---

## Phase 2.5a: The Provider Swap
**Goal:** "I can talk to Claude."

### Tasks
- [ ] Install `ai` + `@ai-sdk/anthropic`
- [ ] Configure Claude 3.5 Sonnet as the primary model
- [ ] Create `/api/chat` route (or Server Action) wired to Vercel AI SDK + Anthropic provider
- [ ] Inject Cooper's system prompt from AGENTS.md (tactical tone, 1st-person, no "Coach" title)
- [ ] Wire a minimal chat UI in the Bridge shell to verify dialogue

### Acceptance Test
Cooper responds in 1st person with his "Logic/Tactical" personality:
> "Stats are looking good. Ready to secure some Gold today?"

### Key Decision
| Decision | Rationale |
|----------|-----------|
| Claude 3.5 Sonnet via `@ai-sdk/anthropic` | Precision, personality, code quality. Vercel AI SDK keeps provider-swap easy if we add Gemini later. |

---

## Phase 2.5b: The Vector Foundation
**Goal:** "The database can read vectors."

### Tasks
- [ ] Supabase migration: `create extension vector`
- [ ] Create `knowledge_base` table:
  - `id` (uuid, PK)
  - `content` (text) — the chunk text
  - `metadata` (jsonb) — source file, page number, upload timestamp
  - `embedding` (vector(1536)) — OpenAI text-embedding-3-small dimensions
  - `profile_id` (uuid, FK → profiles) — who uploaded it
  - `created_at` (timestamptz)
- [ ] RLS: players can SELECT own knowledge rows; writes via service_role only
- [ ] Create index: `ivfflat` or `hnsw` on `embedding` column for similarity search
- [ ] Create RPC `match_knowledge(query_embedding vector(1536), match_count int)` for top-k retrieval

### Key Decision
| Decision | Rationale |
|----------|-----------|
| OpenAI `text-embedding-3-small` (1536 dims) | Cheap, fast, battle-tested. Avoids adding Anthropic embedding dependency (they don't have one). |
| HNSW index over IVFFlat | Better recall at small-to-medium scale; no retraining needed as rows grow. |

### Deferred
- Gemini 1.5 Flash for long-context ingestion — not needed until textbook-scale documents arrive.

---

## Phase 2.5c: The Knowledge Dropzone
**Goal:** "I can upload a PDF and Cooper learns from it."

### Tasks
- [ ] Build "Knowledge Dropzone" component in the Lab shell
  - Drag-and-drop zone with Adventure Navy styling
  - PDF file validation (type check, size limit ~10MB)
  - Upload progress indicator with agent-colored glow
- [ ] Install PDF parsing library (`pdf-parse` or similar)
- [ ] Create `uploadIntel` Server Action (Loot Guard pattern):
  1. Validate auth (session check)
  2. Parse PDF → extract text
  3. Chunk text (~500 tokens per chunk, with overlap)
  4. Call OpenAI embeddings API for each chunk
  5. Insert chunks + embeddings into `knowledge_base` via supabaseAdmin
- [ ] After successful upload, Cooper acknowledges in-character:
  > "Intel integrated, Agent. Knowledge Vault updated."
- [ ] Wire `match_knowledge` RPC into the chat flow so Cooper can retrieve relevant chunks

### Acceptance Test
1. Upload a PDF about the Dragon Bridge of Da Nang.
2. Ask Cooper: "What do you know about the Dragon Bridge?"
3. Cooper responds using the uploaded knowledge, in his tactical voice.

### Deferred
- Mission Ledger / Curriculum structure — belongs in Phase 3 (Quest generation).
- Image generation (agent portraits) — static assets are sufficient.
- Gemini long-context processing — add when document scale demands it.

---

## Phase Status: COMPLETE (2026-03-12)

All three sub-phases implemented:
- [x] **Phase 2.5a** — Claude Sonnet 4 via AI SDK v6 + `@ai-sdk/anthropic`. `/api/chat` route with streaming, agent system prompts.
- [x] **Phase 2.5b** — pgvector extension, `knowledge_base` table, HNSW index, `match_knowledge` RPC.
- [x] **Phase 2.5c** — Intel upload via IntelDrawer, PDF parsing + chunking, OpenAI embeddings, RAG retrieval in chat.
- [x] **Phase 2.5d (Mission Mode)** — `/bridge/lab` with Holographic Briefing Board, `MissionRegistry`, `missionReducer`, `updateStat` tool, BlueprintDiagram SVG. Board activates client-side on mount (no AI dependency).

**Next Up:** Phase 3 — Reward Loop
