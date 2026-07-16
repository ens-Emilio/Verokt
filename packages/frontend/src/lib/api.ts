import type {
  CreateResearchInput,
  ResearchResponse,
  ResearchStatus,
} from '@verokt/shared';

const TOKEN_KEY = 'verokt-token';
const USER_KEY = 'verokt-user';

export function setAuth(token: string, userId: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, userId);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUserId(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function ensureGuestSession(userId?: string): Promise<string> {
  const existing = getToken();
  if (existing) return existing;

  const id = userId?.trim() || `guest-${Date.now()}`;

  const response = await fetch('/api/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: id }),
  });

  if (!response.ok) {
    throw new Error('Failed to create guest session');
  }

  const data = await response.json();
  setAuth(data.token, data.userId);
  return data.token;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await ensureGuestSession();

  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error ?? `API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  ensureGuestSession,
  getUserId,
  clearAuth,

  createResearch: (data: CreateResearchInput) =>
    apiFetch<ResearchResponse>('/api/research', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getResearch: (id: string) =>
    apiFetch<ResearchResponse & { report: unknown }>(`/api/research/${id}`),

  getResearchStatus: (id: string) =>
    apiFetch<{ id: string; status: ResearchStatus }>(`/api/research/${id}/status`),
};
