# Frontend Testing Guide

This document describes the testing setup and conventions for the Hellfest Planner frontend application.

## Test Stack

- **Vitest**: Fast Vite-native test runner with Jest-compatible API
- **React Testing Library**: Component testing utilities focused on user behavior
- **@testing-library/user-event**: Realistic user interaction simulation
- **MSW (Mock Service Worker)**: API mocking for integration tests
- **jsdom**: DOM environment for Node-based tests

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Using Just

```bash
# Run all tests
just test

# Run tests in UI mode
just test-ui

# Run tests with coverage
just test-coverage

# Run tests in watch mode
just test-watch

# Run a specific test file
just test-file src/pages/LoginPage.test.tsx
```

## Test File Structure

```
src/
├── utils/
│   ├── auth.ts
│   └── auth.test.ts
├── components/
│   ├── ProtectedRoute.tsx
│   └── ProtectedRoute.test.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── LoginPage.test.tsx
│   ├── FavoritesPage.tsx
│   └── FavoritesPage.test.tsx
└── mocks/
    ├── server.ts
    ├── browser.ts
    └── handlers.ts
```

## Test Naming Convention

Following backend pytest patterns, test names use the format:
```
test_<feature>_<scenario>
```

Examples:
- `test_login_page_renders_signin_form_by_default`
- `test_signin_with_valid_credentials_navigates_to_concerts`
- `test_remove_favorite_button_removes_concert_from_list`

## Writing Tests

### Utility Tests

Test pure functions and utilities without React:

```typescript
import { describe, it, expect } from 'vitest';
import { authUtils } from './auth';

describe('authUtils', () => {
  it('test_get_token_when_not_set_returns_null', () => {
    expect(authUtils.getToken()).toBeNull();
  });
});
```

### Component Tests

Test React components with mocked dependencies:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';

// Mock dependencies
vi.mock('../utils/auth', () => ({
  authUtils: {
    isAuthenticated: vi.fn(),
  },
}));

describe('ProtectedRoute', () => {
  it('test_protected_route_renders_children_when_authenticated', () => {
    vi.mocked(authUtils.isAuthenticated).mockReturnValue(true);

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
```

### Integration Tests with MSW

Test components that make API calls using MSW handlers:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:8000/api/v1';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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
  });

  it('test_signin_with_invalid_credentials_shows_error', async () => {
    const user = userEvent.setup();

    // Override default handler for this test
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
  });
});
```

## MSW (Mock Service Worker)

### Default Handlers

MSW handlers are defined in [src/mocks/handlers.ts](../src/mocks/handlers.ts) and automatically intercept API calls during tests.

Default handlers include:
- `POST /api/v1/auth/signup` - Returns mock user response
- `POST /api/v1/auth/signin` - Returns mock token
- `GET /api/v1/users/me` - Returns current user
- `GET /api/v1/favorites` - Returns favorites list
- `DELETE /api/v1/favorites/:id` - Removes favorite
- And more...

### Overriding Handlers

Use `server.use()` to override default handlers for specific tests:

```typescript
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

it('test_api_error_handling', async () => {
  server.use(
    http.get(`${API_URL}/favorites`, async () => {
      return HttpResponse.json(
        { detail: 'Server error' },
        { status: 500 }
      );
    })
  );

  // Test error handling...
});
```

## Testing Context Providers

When testing components that use React Context, wrap them with the provider:

```typescript
import { UserProvider } from '../contexts/UserContext';

const renderWithUserProvider = (ui: React.ReactElement) => {
  return render(
    <UserProvider>
      {ui}
    </UserProvider>
  );
};

it('test_component_with_context', () => {
  renderWithUserProvider(<FavoritesPage />);

  // Test component behavior...
});
```

## Common Testing Patterns

### Waiting for Async Operations

Use `waitFor` for async state changes:

```typescript
await waitFor(() => {
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
});
```

### Testing User Interactions

Use `userEvent` for realistic interactions:

```typescript
const user = userEvent.setup();

await user.type(screen.getByLabelText('Username'), 'testuser');
await user.click(screen.getByRole('button', { name: 'Submit' }));
```

### Testing Loading States

Add delays to MSW handlers to test loading states:

```typescript
server.use(
  http.post(`${API_URL}/auth/signin`, async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return HttpResponse.json({ access_token: 'token' });
  })
);

await user.click(submitButton);

// Check loading state exists
expect(screen.getByText('Loading...')).toBeInTheDocument();

// Wait for completion
await waitFor(() => {
  expect(mockNavigate).toHaveBeenCalled();
});
```

### Mocking React Router

Mock `useNavigate` for navigation testing:

```typescript
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// In test
await waitFor(() => {
  expect(mockNavigate).toHaveBeenCalledWith('/concerts');
});
```

## Test Coverage

Current test coverage:

| File Type | Tests | Coverage |
|-----------|-------|----------|
| Utils | 9 | auth utilities |
| Components | 3 | ProtectedRoute |
| Pages | 16 | LoginPage, FavoritesPage |
| **Total** | **28** | Core functionality |

### Running Coverage Reports

```bash
npm run test:coverage
```

Coverage reports are generated in:
- Terminal: Summary output
- HTML: `coverage/index.html`
- JSON: `coverage/coverage-final.json`

## Debugging Tests

### VS Code

Use Vitest UI for interactive debugging:

```bash
npm run test:ui
```

### Console Logs

Use `screen.debug()` to see current DOM state:

```typescript
it('test_example', () => {
  render(<MyComponent />);
  screen.debug(); // Prints current DOM
});
```

### Specific Element

```typescript
const element = screen.getByText('Hello');
screen.debug(element); // Prints specific element
```

## Best Practices

1. **Test user behavior, not implementation** - Focus on what users see and do
2. **Use semantic queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Mock at the network level** - Use MSW instead of mocking functions
4. **Clear state between tests** - Use `beforeEach` to reset localStorage, mocks, etc.
5. **Test error states** - Don't just test happy paths
6. **Keep tests isolated** - Each test should be independent
7. **Follow naming conventions** - Use `test_<feature>_<scenario>` format
8. **Verify async completion** - Always use `waitFor` for async operations

## Troubleshooting

### Tests timing out

Increase timeout in vitest.config.ts:
```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds
  }
});
```

### MSW handler not matching

Check that:
- URL matches exactly (including `/api/v1` prefix)
- HTTP method is correct (GET/POST/PATCH/DELETE)
- Handler is defined in `handlers.ts` or overridden with `server.use()`

### localStorage errors

Ensure `vitest.setup.ts` includes localStorage mock (already configured).

### React Router errors

Wrap components using routing in `<MemoryRouter>`:
```typescript
render(
  <MemoryRouter>
    <MyComponent />
  </MemoryRouter>
);
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
