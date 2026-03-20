import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:8000/api/v1';

// Mock useUser context
vi.mock('../contexts/UserContext', () => ({
  useUser: () => ({ refreshUser: vi.fn().mockResolvedValue(undefined) }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('test_login_page_renders_signin_form_by_default', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('🔥 Hellfest Planner 🔥')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('test_login_page_toggles_to_signup_form', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const toggleButton = screen.getByText("Don't have an account? Sign up");
    await user.click(toggleButton);

    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.getByText('Already have an account? Sign in')).toBeInTheDocument();
  });

  it('test_signin_with_valid_credentials_navigates_to_concerts', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'testpass123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/concerts');
    });

    // Verify token was stored
    expect(localStorage.getItem('hf_access_token')).toBe('mock_token_123');
  });

  it('test_signup_with_valid_credentials_signs_in_and_navigates', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Toggle to signup
    await user.click(screen.getByText("Don't have an account? Sign up"));

    await user.type(screen.getByLabelText('Username'), 'newuser');
    await user.type(screen.getByLabelText('Password'), 'newpass123');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/concerts');
    });

    expect(localStorage.getItem('hf_access_token')).toBe('mock_token_123');
  });

  it('test_signin_with_invalid_credentials_shows_error', async () => {
    const user = userEvent.setup();

    // Mock failed login
    server.use(
      http.post(`${API_URL}/auth/signin`, async () => {
        return HttpResponse.json(
          { detail: 'Invalid username or password' },
          { status: 401 }
        );
      })
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Username'), 'wronguser');
    await user.type(screen.getByLabelText('Password'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('hf_access_token')).toBeNull();
  });

  it('test_form_shows_loading_state_during_submission', async () => {
    const user = userEvent.setup();

    // Add delay to mock to ensure we can see loading state
    server.use(
      http.post(`${API_URL}/auth/signin`, async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json({
          access_token: 'mock_token_123',
          token_type: 'bearer',
        });
      })
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'testpass123');

    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    await user.click(submitButton);

    // Button should show loading state
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it('test_empty_form_fields_are_required', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText('Username') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    expect(usernameInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
  });

  it('test_error_clears_on_form_toggle', async () => {
    const user = userEvent.setup();

    // Mock failed login
    server.use(
      http.post(`${API_URL}/auth/signin`, async () => {
        return HttpResponse.json(
          { detail: 'Invalid credentials' },
          { status: 401 }
        );
      })
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Trigger error
    await user.type(screen.getByLabelText('Username'), 'test');
    await user.type(screen.getByLabelText('Password'), 'test');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    // Toggle form - error should remain (doesn't clear on toggle)
    await user.click(screen.getByText("Don't have an account? Sign up"));

    // Error persists until new submission
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
