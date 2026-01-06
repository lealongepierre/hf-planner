import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FavoritesPage } from './FavoritesPage';
import { UserProvider } from '../contexts/UserContext';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:8000/api/v1';

// Mock auth utils to return authenticated state
vi.mock('../utils/auth', () => ({
  authUtils: {
    isAuthenticated: () => true,
    getToken: () => 'mock_token',
  },
}));

// Helper to render with UserProvider
const renderWithUserProvider = (ui: React.ReactElement) => {
  return render(
    <UserProvider>
      {ui}
    </UserProvider>
  );
};

describe('FavoritesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test_favorites_page_shows_loading_state_initially', () => {
    renderWithUserProvider(<FavoritesPage />);
    expect(screen.getByText('Loading favorites...')).toBeInTheDocument();
  });

  it('test_favorites_page_renders_favorites_list_when_loaded', async () => {
    renderWithUserProvider(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading favorites...')).not.toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Band')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Stage')).toBeInTheDocument();

    // Check favorite concert data
    expect(screen.getByText('Metallica')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();
    expect(screen.getByText('20:00 - 22:00')).toBeInTheDocument();
    expect(screen.getByText('Mainstage')).toBeInTheDocument();
  });

  it('test_favorites_page_shows_empty_state_when_no_favorites', async () => {
    // Mock empty favorites response
    server.use(
      http.get(`${API_URL}/favorites`, async () => {
        return HttpResponse.json([]);
      })
    );

    renderWithUserProvider(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading favorites...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('No favorites yet')).toBeInTheDocument();
    expect(screen.getByText('Browse concerts and add some to your favorites!')).toBeInTheDocument();
  });

  it('test_favorites_page_displays_error_when_fetch_fails', async () => {
    // Mock failed fetch
    server.use(
      http.get(`${API_URL}/favorites`, async () => {
        return HttpResponse.json(
          { detail: 'Failed to fetch favorites' },
          { status: 500 }
        );
      })
    );

    renderWithUserProvider(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading favorites...')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/failed to fetch favorites/i)).toBeInTheDocument();
  });

  it('test_remove_favorite_button_removes_concert_from_list', async () => {
    const user = userEvent.setup();

    renderWithUserProvider(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('Metallica')).toBeInTheDocument();
    });

    // Click remove button
    const removeButton = screen.getByRole('button', { name: 'Remove' });
    await user.click(removeButton);

    // Concert should be removed from the list
    await waitFor(() => {
      expect(screen.queryByText('Metallica')).not.toBeInTheDocument();
    });

    // Should show empty state
    expect(screen.getByText('No favorites yet')).toBeInTheDocument();
  });

  it('test_visibility_toggle_button_shows_current_state', async () => {
    renderWithUserProvider(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading favorites...')).not.toBeInTheDocument();
    });

    // Check initial state (private by default from mock)
    const toggleButton = screen.getByRole('button', { name: /🔒 Private/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('test_visibility_toggle_changes_button_state', async () => {
    const user = userEvent.setup();

    renderWithUserProvider(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading favorites...')).not.toBeInTheDocument();
    });

    // Click toggle button
    const toggleButton = screen.getByRole('button', { name: /🔒 Private/i });
    await user.click(toggleButton);

    // Button should change to public
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /🔓 Public/i })).toBeInTheDocument();
    });
  });

  it('test_page_title_and_description_are_displayed', async () => {
    renderWithUserProvider(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading favorites...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('My Favorites')).toBeInTheDocument();
    expect(screen.getByText('Your favorite concerts for the festival')).toBeInTheDocument();
  });
});
