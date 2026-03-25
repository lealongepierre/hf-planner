import { apiClient } from './client';
import type { Concert } from '../types';

export const concertsApi = {
  async getConcerts(params?: { day?: string; stage?: string }): Promise<Concert[]> {
    const response = await apiClient.get<Concert[]>('/concerts', { params });
    return response.data;
  },

  async getConcertById(id: number): Promise<Concert> {
    const response = await apiClient.get<Concert>(`/concerts/${id}`);
    return response.data;
  },

  async updateRating(id: number, rating: number | null): Promise<Concert> {
    const response = await apiClient.patch<Concert>(`/concerts/${id}/rating`, { rating });
    return response.data;
  },
};
