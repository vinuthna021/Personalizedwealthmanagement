import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api_client';
import { Recommendation, RebalanceResult } from '../../types';

export const useRecommendations = () => {
  const queryClient = useQueryClient();

  const useGetRecommendations = (options = {}) =>
    useQuery<{ recommendations: Recommendation[] }>({
      queryKey: ['recommendations'],
      queryFn: async () => {
        const response = await apiClient.get('/recommendations');
        return response.data;
      },
      ...options,
    });

  const useGenerateRecommendation = () =>
    useMutation({
      mutationFn: async () => {
        const response = await apiClient.post('/recommendations/generate');
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      },
    });

  const useMarkAsRead = () =>
    useMutation({
      mutationFn: async (id: number) => {
        const response = await apiClient.patch(`/recommendations/${id}/read`);
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      },
    });

  const useGetRebalance = (options = {}) =>
    useQuery<RebalanceResult>({
      queryKey: ['rebalance'],
      queryFn: async () => {
        const response = await apiClient.get('/recommendations/rebalance');
        return response.data;
      },
      ...options,
    });

  return {
    useGetRecommendations,
    useGenerateRecommendation,
    useMarkAsRead,
    useGetRebalance,
  };
};
