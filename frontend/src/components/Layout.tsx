import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authUtils } from '../utils/auth';
import { useUser } from '../contexts/UserContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authUtils.isAuthenticated();
  const { username, isPublic, toggleVisibility } = useUser();

  const handleLogout = () => {
    authUtils.clearToken();
    navigate('/login');
  };

  const navLinks = [
    { to: '/concerts', label: 'Concerts', icon: '🎸' },
    { to: '/calendar', label: 'Calendar', icon: '📅' },
    { to: '/favorites', label: 'My Favorites', icon: '⭐️' },
    { to: '/users', label: 'Friends', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center text-xl font-bold text-gray-900">
                🔥 Hellfest Planner 🔥
              </Link>
              {/* Desktop nav links — hidden on mobile */}
              {isAuthenticated && (
                <div className="hidden sm:ml-10 sm:flex sm:items-center sm:space-x-4">
                  {navLinks.map(({ to, label, icon }) => (
                    <Link
                      key={to}
                      to={to}
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      {icon} {label}
                    </Link>
                  ))}
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

      {/* Main Content — add bottom padding on mobile to avoid overlap with bottom nav */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pb-20 sm:pb-6">
        {children}
      </main>

      {/* Bottom Navigation — mobile only */}
      {isAuthenticated && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex justify-around">
            {navLinks.map(({ to, label, icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col items-center py-2 px-3 text-xs font-medium flex-1 ${
                    isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
