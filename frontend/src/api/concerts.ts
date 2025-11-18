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
};
