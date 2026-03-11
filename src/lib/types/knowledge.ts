export interface KnowledgeChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    page?: number;
    uploadedAt: string;
    chunkIndex: number;
  };
  embedding?: number[];
  profileId: string;
  createdAt: string;
}

export interface KnowledgeMatch {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}
