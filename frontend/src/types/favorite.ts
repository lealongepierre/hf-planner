import type { Concert } from './concert';

export interface Favorite {
  id: number;
  user_id: number;
  concert_id: number;
}

export interface FavoriteCreate {
  concert_id: number;
}

export interface FavoriteWithConcert {
  id: number;
  concert: Concert;
}
