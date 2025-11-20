import { apiClient } from './client';
import type {
  UserListResponse,
  FavoritesVisibilityUpdate,
  FavoritesVisibilityResponse,
  Concert
} from '../types';

export const usersApi = {
  async getCurrentUser(): Promise<UserListResponse> {
    const response = await apiClient.get<UserListResponse>('/users/me');
    return response.data;
  },

  async getUsers(): Promise<UserListResponse[]> {
    const response = await apiClient.get<UserListResponse[]>('/users');
    return response.data;
  },

  async updateFavoritesVisibility(data: FavoritesVisibilityUpdate): Promise<FavoritesVisibilityResponse> {
    const response = await apiClient.patch<FavoritesVisibilityResponse>('/users/me/favorites-visibility', data);
    return response.data;
  },

  async getUserFavorites(username: string): Promise<Concert[]> {
    const response = await apiClient.get<Concert[]>(`/users/${username}/favorites`);
    return response.data;
  },
};
