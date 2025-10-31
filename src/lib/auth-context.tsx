'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import type { UserWithOrganization } from '@/types';

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserWithOrganization | null;
  login: (userData: UserWithOrganization) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a default context value to prevent undefined issues
const defaultAuthContext: AuthContextType = {
  isLoggedIn: false,
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserWithOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted to prevent hydration issues
    setIsMounted(true);

    // Check for existing authentication on mount
    const checkAuth = () => {
      try {
        // In a real app, you would check localStorage, cookies, or make an API call
        const storedAuth = localStorage.getItem('auth');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          if (authData && authData.user) {
            setIsLoggedIn(true);
            setUser(authData.user);
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Clear any corrupted auth data
        try {
          localStorage.removeItem('auth');
        } catch {
          // Ignore localStorage errors in SSR
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback((userData: UserWithOrganization) => {
    try {
      if (!userData) {
        console.error('Invalid user data provided to login');
        return;
      }
      setIsLoggedIn(true);
      setUser(userData);
      localStorage.setItem('auth', JSON.stringify({ user: userData }));
    } catch (error) {
      console.error('Error during login:', error);
      // Reset state on error
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      setIsLoggedIn(false);
      setUser(null);
      localStorage.removeItem('auth');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force reset state even if localStorage fails
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  const value = React.useMemo(() => {
    const authValue = {
      isLoggedIn: isMounted ? isLoggedIn : false,
      user: isMounted ? user : null,
      login,
      logout,
      isLoading: !isMounted || isLoading,
    };

    // Debug logging to help identify issues
    if (typeof window !== 'undefined') {
      console.log('Auth Context Value:', authValue);
    }

    return authValue;
  }, [isMounted, isLoggedIn, user, login, logout, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth must be used within an AuthProvider');
    // Return the default context instead of throwing
    return defaultAuthContext;
  }
  return context;
}
