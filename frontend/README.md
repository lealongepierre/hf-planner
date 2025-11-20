# Hellfest Planner - Frontend

React frontend for the Hellfest Planner application.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

## Prerequisites

- Node.js 18+ (installed via Homebrew)
- npm 9+ (comes with Node.js)

## Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**

   The `.env.local` file is already created with:
   ```
   VITE_API_URL=http://localhost:8000
   ```

   Adjust if your backend runs on a different port.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── api/           # API client and endpoint functions
│   ├── client.ts  # Axios instance with auth interceptor
│   ├── auth.ts    # Authentication endpoints
│   ├── concerts.ts
│   ├── favorites.ts
│   └── users.ts
├── components/    # Reusable React components
│   ├── Layout.tsx
│   └── ProtectedRoute.tsx
├── pages/         # Page components
│   ├── LoginPage.tsx
│   ├── ConcertsPage.tsx
│   ├── FavoritesPage.tsx
│   ├── UsersPage.tsx
│   └── UserFavoritesPage.tsx
├── types/         # TypeScript type definitions
│   ├── concert.ts
│   ├── user.ts
│   ├── favorite.ts
│   └── auth.ts
├── utils/         # Utility functions
│   └── auth.ts    # Token management
├── App.tsx        # Main app with routing
└── main.tsx       # App entry point
```

## Features

- **Authentication** - JWT-based login/signup
- **Concert Browsing** - Filter by day and stage
- **Favorites Management** - Add/remove favorite concerts
- **Privacy Controls** - Toggle favorites visibility
- **Friends** - View other users' public favorites
- **Protected Routes** - Automatic redirect to login

## API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000/api/v1`.

All API calls:
- Use TypeScript types matching backend Pydantic schemas
- Include JWT token in Authorization header (if logged in)
- Auto-redirect to login on 401/403 errors

## Development Workflow

1. **Backend must be running** on port 8000
2. **Start frontend dev server** with `npm run dev`
3. **Changes auto-reload** via Vite HMR
4. **Type errors** show in terminal and browser

## Building for Production

```bash
npm run build
```

Output in `dist/` directory, ready to deploy to:
- Vercel (recommended)
- Netlify
- Any static hosting service

## Deployment

### Quick Deploy to Vercel

1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set environment variable: `VITE_API_URL=<your-backend-url>`
4. Deploy!

Vercel automatically detects Vite and configures build settings.

## Troubleshooting

**Port 5173 already in use:**
```bash
# Kill the process using port 5173
lsof -ti:5173 | xargs kill -9
npm run dev
```

**API connection errors:**
- Check backend is running: `curl http://localhost:8000/api/v1/concerts`
- Verify `.env.local` has correct `VITE_API_URL`
- Check browser console for CORS errors

**Build errors:**
- Delete `node_modules/` and `package-lock.json`
- Run `npm install` again
- Clear Vite cache: `rm -rf node_modules/.vite`
