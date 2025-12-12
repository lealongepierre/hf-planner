import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { authUtils } from '../utils/auth';

// Mock authUtils
vi.mock('../utils/auth', () => ({
  authUtils: {
    isAuthenticated: vi.fn(),
  },
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test_protected_route_renders_children_when_authenticated', () => {
    vi.mocked(authUtils.isAuthenticated).mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('test_protected_route_redirects_to_login_when_not_authenticated', () => {
    vi.mocked(authUtils.isAuthenticated).mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('test_protected_route_calls_is_authenticated_check', () => {
    vi.mocked(authUtils.isAuthenticated).mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(authUtils.isAuthenticated).toHaveBeenCalledTimes(1);
  });
});
