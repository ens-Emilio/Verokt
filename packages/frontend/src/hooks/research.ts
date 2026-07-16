import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CreateResearchInput, ResearchResponse } from '@verokt/shared';

export function useCreateResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateResearchInput) => api.createResearch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['researches'] });
    },
  });
}

export function useResearch(id: string) {
  return useQuery({
    queryKey: ['research', id],
    queryFn: () => api.getResearch(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 3000;
    },
    enabled: !!id,
  });
}

export function useResearchStatus(id: string) {
  return useQuery({
    queryKey: ['research-status', id],
    queryFn: () => api.getResearchStatus(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 2000;
    },
    enabled: !!id,
  });
}

export type { ResearchResponse };
