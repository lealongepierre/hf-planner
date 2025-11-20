import { apiClient } from './client';
import type { FavoriteCreate, Favorite, Concert } from '../types';

export const favoritesApi = {
  async getFavorites(): Promise<Concert[]> {
    const response = await apiClient.get<Concert[]>('/favorites');
    return response.data;
  },

  async addFavorite(data: FavoriteCreate): Promise<Favorite> {
    const response = await apiClient.post<Favorite>('/favorites', data);
    return response.data;
  },

  async removeFavorite(concertId: number): Promise<void> {
    await apiClient.delete(`/favorites/${concertId}`);
  },
};
