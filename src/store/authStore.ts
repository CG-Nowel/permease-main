import { useState } from 'react';
import type { User, UserRole } from '../types/index.ts';

export const useAuthStore = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('permease_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading] = useState(false);

  const login = (token: string, userData: User) => {
    localStorage.setItem('permease_token', token);
    localStorage.setItem('permease_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('permease_token');
    localStorage.removeItem('permease_user');
    setUser(null);
  };

  return {
    user,
    role: user?.role ?? (null as UserRole | null),
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };
};
