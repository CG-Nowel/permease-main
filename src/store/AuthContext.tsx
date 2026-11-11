import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultStaffUser: User = {
  id: 1,
  name: 'Registrar Office',
  email: 'registrar@permease.local',
  role: 'REGISTRAR',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(defaultStaffUser);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('permease_user');
    const token = localStorage.getItem('permease_token');

    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        delete parsed.rfid_uid;
        delete parsed.rfid_card;
        setUser(parsed);
      } catch {
        setUser(defaultStaffUser);
        localStorage.removeItem('permease_user');
        localStorage.removeItem('permease_token');
      }
    }
    setIsLoading(false);
  }, []);

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

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
