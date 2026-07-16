export const API_ROUTES = {
  RESEARCH: '/api/research',
  RESEARCH_BY_ID: (id: string) => `/api/research/${id}`,
  RESEARCH_STATUS: (id: string) => `/api/research/${id}/status`,
  RESEARCH_SSE: (id: string) => `/api/research/${id}/events`,
} as const;

export const EMBEDDING_DIMENSIONS = 1536;
export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const MIN_CONTENT_LENGTH_FOR_EMBEDDING = 50;
export const MAX_CONTEXT_DOCS = 10;

// Scraper config
export const MAX_CONTENT_LENGTH = 12000;
export const MAX_DOCS_PER_RESEARCH = 20;
export const DEFAULT_SEARCH_RESULTS = 3;

// Rate limiting
export const DEFAULT_RATE_LIMIT = 30;
export const DEFAULT_RATE_WINDOW_MS = 60_000;
