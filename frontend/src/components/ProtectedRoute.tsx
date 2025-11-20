import { Navigate } from 'react-router-dom';
import { authUtils } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!authUtils.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
