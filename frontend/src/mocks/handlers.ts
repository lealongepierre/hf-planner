import { http, HttpResponse } from 'msw';

// Use the same URL as .env.local for development/testing
const API_URL = 'http://localhost:8000/api/v1';

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/signup`, async () => {
    return HttpResponse.json({
      username: 'testuser',
      id: 1,
    });
  }),

  http.post(`${API_URL}/auth/signin`, async () => {
    return HttpResponse.json({
      access_token: 'mock_token_123',
      token_type: 'bearer',
    });
  }),

  // Users endpoints
  http.get(`${API_URL}/users/me`, async () => {
    return HttpResponse.json({
      id: 1,
      username: 'testuser',
      favorites_public: false,
    });
  }),

  http.get(`${API_URL}/users`, async () => {
    return HttpResponse.json([
      { id: 1, username: 'user1', favorites_public: true },
      { id: 2, username: 'user2', favorites_public: true },
    ]);
  }),

  http.patch(`${API_URL}/users/me/favorites-visibility`, async () => {
    return HttpResponse.json({
      id: 1,
      username: 'testuser',
      favorites_public: true,
    });
  }),

  // Concerts endpoints
  http.get(`${API_URL}/concerts/rater`, async () => {
    return HttpResponse.json('Wesker');
  }),

  http.get(`${API_URL}/concerts`, async () => {
    return HttpResponse.json([
      {
        id: 1,
        band_name: 'Metallica',
        day: 'Friday',
        festival_day: 'Friday',
        start_time: '20:00:00',
        end_time: '22:00:00',
        stage: 'Mainstage',
        rating: null,
      },
      {
        id: 2,
        band_name: 'Iron Maiden',
        day: 'Saturday',
        festival_day: 'Saturday',
        start_time: '21:00:00',
        end_time: '23:00:00',
        stage: 'Mainstage',
        rating: 17,
      },
    ]);
  }),

  http.patch(`${API_URL}/concerts/:concertId/rating`, async ({ request }) => {
    const body = await request.json() as { rating: number | null };
    return HttpResponse.json({
      id: 1,
      band_name: 'Metallica',
      day: 'Friday',
      festival_day: 'Friday',
      start_time: '20:00:00',
      end_time: '22:00:00',
      stage: 'Mainstage',
      rating: body.rating,
    });
  }),

  // Favorites endpoints
  http.get(`${API_URL}/favorites`, async () => {
    return HttpResponse.json([
      {
        id: 1,
        band_name: 'Metallica',
        day: 'Friday',
        festival_day: 'Friday',
        start_time: '20:00:00',
        end_time: '22:00:00',
        stage: 'Mainstage',
        rating: null,
      },
    ]);
  }),

  http.post(`${API_URL}/favorites/:concertId`, async () => {
    return HttpResponse.json({ message: 'Concert added to favorites' });
  }),

  http.delete(`${API_URL}/favorites/:concertId`, async () => {
    return HttpResponse.json({ message: 'Concert removed from favorites' });
  }),

  http.get(`${API_URL}/users/:username/favorites`, async () => {
    return HttpResponse.json([
      {
        id: 2,
        band_name: 'Iron Maiden',
        day: 'Saturday',
        festival_day: 'Saturday',
        start_time: '21:00:00',
        end_time: '23:00:00',
        stage: 'Mainstage',
        rating: 17,
      },
    ]);
  }),
];
