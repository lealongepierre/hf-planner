import { Link, useNavigate } from 'react-router-dom';
import { authUtils } from '../utils/auth';
import { useUser } from '../contexts/UserContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const isAuthenticated = authUtils.isAuthenticated();
  const { username, isPublic, toggleVisibility } = useUser();

  const handleLogout = () => {
    authUtils.clearToken();
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
                  <button
                    onClick={toggleVisibility}
                    className={`inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      isPublic ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    title={isPublic ? 'Your favorites are public' : 'Your favorites are private'}
                  >
                    {isPublic ? '🔓 Public' : '🔒 Private'}
                  </button>
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
