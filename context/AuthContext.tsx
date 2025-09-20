import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type User, Role } from '../types';
import { useData } from './DataContext';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  // Fix: Add loading property to AuthContextType to make it available to consumers.
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { findUser, loading } = useData();

  useEffect(() => {
    if (!loading) {
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          // Re-validate user against our "DB"
          if (findUser(user.username)) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem('currentUser');
          }
        }
      } catch (error) {
        console.error("Failed to load user from localStorage", error);
        localStorage.removeItem('currentUser');
      }
    }
  }, [loading, findUser]);

  const login = useCallback((username: string, password: string): boolean => {
    const user = findUser(username, password);
    if (user) {
      const userToStore = { ...user };
      delete userToStore.password; // Don't store password in local storage
      setCurrentUser(userToStore);
      localStorage.setItem('currentUser', JSON.stringify(userToStore));
      return true;
    }
    return false;
  }, [findUser]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === Role.Admin;

  return (
    // Fix: Pass the 'loading' state from useData through the AuthContext.Provider.
    <AuthContext.Provider value={{ currentUser, isAuthenticated, isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
