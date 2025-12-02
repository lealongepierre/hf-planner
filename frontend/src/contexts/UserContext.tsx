import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usersApi } from '../api';
import { authUtils } from '../utils/auth';

interface UserContextType {
  username: string;
  isPublic: boolean;
  setIsPublic: (value: boolean) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string>('');
  const [isPublic, setIsPublic] = useState(false);
  const isAuthenticated = authUtils.isAuthenticated();

  const refreshUser = async () => {
    if (isAuthenticated) {
      try {
        const user = await usersApi.getCurrentUser();
        setUsername(user.username);
        setIsPublic(user.favorites_public);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    }
  };

  useEffect(() => {
    refreshUser();
  }, [isAuthenticated]);

  return (
    <UserContext.Provider value={{ username, isPublic, setIsPublic, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
