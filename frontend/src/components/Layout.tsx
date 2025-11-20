import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authUtils } from '../utils/auth';
import { usersApi } from '../api';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const isAuthenticated = authUtils.isAuthenticated();
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (isAuthenticated) {
        try {
          const user = await usersApi.getCurrentUser();
          setUsername(user.username);
        } catch (err) {
          console.error('Failed to fetch current user:', err);
        }
      }
    };

    fetchCurrentUser();
  }, [isAuthenticated]);

  const handleLogout = () => {
    authUtils.clearToken();
    setUsername('');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center text-xl font-bold text-gray-900">
                🔥 Hellfest Planner 🔥
              </Link>
              {isAuthenticated && (
                <div className="ml-10 flex items-center space-x-4">
                  <Link to="/concerts" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    🎸 Concerts
                  </Link>
                  <Link to="/calendar" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    📅 Calendar
                  </Link>
                  <Link to="/favorites" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    ⭐️ My Favorites
                  </Link>
                  <Link to="/users" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    👥 Friends
                  </Link>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-gray-700 text-sm font-medium">
                    👤 {username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
