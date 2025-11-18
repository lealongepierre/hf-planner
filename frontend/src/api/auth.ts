import { apiClient } from './client';
import type { SignupRequest, SigninRequest, TokenResponse, UserResponse } from '../types';

export const authApi = {
  async signup(data: SignupRequest): Promise<UserResponse> {
    const response = await apiClient.post<UserResponse>('/auth/signup', data);
    return response.data;
  },

  async signin(data: SigninRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/signin', data);
    return response.data;
  },
};
