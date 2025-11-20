import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ProtectedRoute } from './components';
import { LoginPage, ConcertsPage, FavoritesPage, UsersPage, UserFavoritesPage, CalendarPage } from './pages';
import { authUtils } from './utils/auth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Navigate to="/concerts" replace />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/concerts"
          element={
            <ProtectedRoute>
              <Layout>
                <ConcertsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <CalendarPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Layout>
                <FavoritesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <UsersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:username/favorites"
          element={
            <ProtectedRoute>
              <Layout>
                <UserFavoritesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to concerts if logged in, login otherwise */}
        <Route
          path="*"
          element={
            authUtils.isAuthenticated() ? (
              <Navigate to="/concerts" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
