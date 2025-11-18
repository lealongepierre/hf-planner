export interface User {
  id: number;
  username: string;
  favorites_public: boolean;
}

export interface UserListResponse {
  id: number;
  username: string;
  favorites_public: boolean;
}

export interface FavoritesVisibilityUpdate {
  public: boolean;
}

export interface FavoritesVisibilityResponse {
  username: string;
  favorites_public: boolean;
}
