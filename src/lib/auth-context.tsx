'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { UserWithOrganization } from '@/types';

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserWithOrganization | null;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAuthContext: AuthContextType = {
  isLoggedIn: false,
  user: null,
  login: async () => ({ error: null }),
  logout: async () => {},
  isLoading: true,
};

async function fetchAuthenticatedProfile(): Promise<UserWithOrganization | null> {
  try {
    const response = await fetch('/api/auth/profile', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || 'Unknown error';
        } else {
          const text = await response.text();
          errorMessage = `Server error: ${text.substring(0, 100)}`;
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
      console.error('Failed to load profile:', errorMessage);
      return null;
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      return null;
    }

    const { profile } = responseData as {
      profile: {
        id: string;
        username: string;
        email: string;
        first_name?: string | null;
        last_name?: string | null;
        role: string;
        organization_id: string;
        organization_role: string;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        organization: {
          id: string;
          name: string;
          is_active: boolean;
          subscription?: 'free' | 'basic' | 'premium' | 'enterprise' | null;
          created_at: string;
          updated_at: string;
          created_by?: string | null;
        } | null;
      };
    };

    if (!profile || !profile.organization) {
      console.error('Profile response missing organization data');
      return null;
    }

    return {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      firstName: profile.first_name ?? undefined,
      lastName: profile.last_name ?? undefined,
      role: profile.role as 'admin' | 'user',
      organizationId: profile.organization_id,
      organizationRole: profile.organization_role as UserWithOrganization['organizationRole'],
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      organization: {
        id: profile.organization.id,
        name: profile.organization.name,
        isActive: profile.organization.is_active,
        subscription: profile.organization.subscription ?? undefined,
        createdAt: profile.organization.created_at,
        updatedAt: profile.organization.updated_at,
        createdBy: profile.organization.created_by ?? '',
      },
    };
  } catch (error) {
    console.error('Unexpected error fetching profile:', error);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserWithOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);

    const initialize = async () => {
      try {
        // Try to get session, but if CORS fails, fall back to server-side check
        let session = null;
        let sessionError = null;
        
        try {
          const result = await supabase.auth.getSession();
          session = result.data.session;
          sessionError = result.error;
        } catch (error) {
          // If getSession fails due to CORS, try to get session info from cookies/localStorage
          // The middleware should have refreshed the session server-side
          sessionError = error;
        }

        // Handle CORS or network errors gracefully
        if (sessionError) {
          // Check if it's a CORS error
          const errorMessage = sessionError instanceof Error ? sessionError.message : String(sessionError);
          if (
            errorMessage.includes('CORS') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('Access-Control-Allow-Origin')
          ) {
            console.warn(
              'CORS error detected. The middleware handles token refresh server-side, but client-side refresh requires CORS configuration.',
            );
            console.warn(
              'To fix: Add http://localhost:3000 to Supabase Dashboard > Authentication > URL Configuration > Redirect URLs',
            );
            // Fall back to checking via API route (server-side)
            const profile = await fetchAuthenticatedProfile();
            if (profile) {
              setIsLoggedIn(true);
              setUser(profile);
            } else {
              setIsLoggedIn(false);
              setUser(null);
            }
            setIsLoading(false);
            return;
          }
          throw sessionError;
        }

        if (session?.user) {
          const profile = await fetchAuthenticatedProfile();
          if (profile) {
            setIsLoggedIn(true);
            setUser(profile);
          } else {
            setIsLoggedIn(false);
            setUser(null);
          }
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Handle CORS errors specifically
        if (
          errorMessage.includes('CORS') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('Access-Control-Allow-Origin')
        ) {
          console.warn(
            'CORS error detected. Please add http://localhost:3000 to your Supabase project allowed origins in the Authentication > URL Configuration settings.',
          );
        } else {
          console.error('Error checking authentication:', error);
        }
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchAuthenticatedProfile();
        if (profile) {
          setIsLoggedIn(true);
          setUser(profile);
        }
      }

      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      try {
        // Use server-side login API route to avoid CORS issues
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          let errorMessage = 'Login failed';
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.error || 'Login failed';
            } else {
              const text = await response.text();
              errorMessage = text.substring(0, 100) || 'Login failed';
            }
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
          }

          return { error: new Error(errorMessage) };
        }

        // Login successful, now fetch profile
        const profile = await fetchAuthenticatedProfile();
        if (profile) {
          setIsLoggedIn(true);
          setUser(profile);
          return { error: null };
        }

        return {
          error: new Error('Unable to load user profile. Please try again later.'),
        };
      } catch (error) {
        console.error('Error during login:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Login failed';
        return { error: new Error(errorMessage) };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during logout:', error);
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    } finally {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, [supabase]);

  const value = useMemo<AuthContextType>(() => {
    return {
      isLoggedIn: isMounted ? isLoggedIn : false,
      user: isMounted ? user : null,
      login,
      logout,
      isLoading: !isMounted || isLoading,
    };
  }, [isMounted, isLoggedIn, user, login, logout, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth must be used within an AuthProvider');
    return defaultAuthContext;
  }
  return context;
}
