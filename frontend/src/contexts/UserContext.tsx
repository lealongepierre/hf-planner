import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { usersApi } from '../api';
import { authUtils } from '../utils/auth';
import type { AxiosError } from 'axios';

interface UserContextType {
  username: string;
  isPublic: boolean;
  setIsPublic: (value: boolean) => void;
  refreshUser: () => Promise<void>;
  toggleVisibility: () => Promise<void>;
}

interface ApiErrorResponse {
  detail?: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string>('');
  const [isPublic, setIsPublic] = useState(false);
  const isAuthenticated = authUtils.isAuthenticated();

  const refreshUser = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const user = await usersApi.getCurrentUser();
        setUsername(user.username);
        setIsPublic(user.favorites_public);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    }
  }, [isAuthenticated]);

  const toggleVisibility = async () => {
    try {
      await usersApi.updateFavoritesVisibility({ public: !isPublic });
      setIsPublic(!isPublic);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError?.response?.data?.detail || 'Failed to update visibility');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ username, isPublic, setIsPublic, refreshUser, toggleVisibility }}>
      {children}
    </UserContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
