-- Custom migration: enable pgvector extension and create HNSW index for document embeddings
CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX IF NOT EXISTS documents_embedding_idx
  ON documents
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
