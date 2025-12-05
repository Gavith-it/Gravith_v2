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
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || 'Unknown error';
        } else {
          // If we get HTML instead of JSON, it's likely a server error
          const text = await response.text();
          // Don't log the full HTML, just indicate it's an HTML response
          if (text.trim().startsWith('<')) {
            errorMessage = 'Server returned HTML instead of JSON. Please check server logs.';
            console.error('Server returned HTML response. Status:', response.status);
          } else {
            errorMessage = `Server error: ${text.substring(0, 100)}`;
          }
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
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

  // Session expiration: 24 hours (1 day) in milliseconds
  const SESSION_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
  // Check session validity every 5 minutes
  const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

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
      // Clear any stored session timestamp
      if (typeof window !== 'undefined') {
        localStorage.removeItem('session_start_time');
      }
    }
  }, [supabase]);

  // Check if session has expired
  const checkSessionExpiry = useCallback(async () => {
    if (typeof window === 'undefined') return true;

    const sessionStartTime = localStorage.getItem('session_start_time');
    if (!sessionStartTime) {
      // No session timestamp, check if we have a valid session
      const result = await supabase.auth.getSession();
      if (!result.data.session) {
        // No session, logout
        await logout();
        return false;
      }
      // Valid session, store timestamp
      localStorage.setItem('session_start_time', Date.now().toString());
      return true;
    }

    const sessionAge = Date.now() - parseInt(sessionStartTime, 10);
    if (sessionAge > SESSION_EXPIRY_TIME) {
      // Session expired, logout
      console.log('Session expired, logging out...');
      await logout();
      return false;
    }

    // Check if session is still valid with Supabase
    const result = await supabase.auth.getSession();
    if (!result.data.session || result.error) {
      // Session invalid, logout
      console.log('Session invalid, logging out...');
      await logout();
      return false;
    }

    return true;
  }, [supabase, logout, SESSION_EXPIRY_TIME]);

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
          const errorMessage =
            sessionError instanceof Error ? sessionError.message : String(sessionError);
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
              // Store session start time for expiration tracking
              if (typeof window !== 'undefined') {
                localStorage.setItem('session_start_time', Date.now().toString());
              }
            } else {
              setIsLoggedIn(false);
              setUser(null);
              if (typeof window !== 'undefined') {
                localStorage.removeItem('session_start_time');
              }
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
            // Store session start time for expiration tracking
            if (typeof window !== 'undefined') {
              localStorage.setItem('session_start_time', Date.now().toString());
            }
          } else {
            setIsLoggedIn(false);
            setUser(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('session_start_time');
            }
          }
        } else {
          setIsLoggedIn(false);
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('session_start_time');
          }
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
          // Store session start time for expiration tracking
          if (typeof window !== 'undefined') {
            localStorage.setItem('session_start_time', Date.now().toString());
          }
        }
      }

      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('session_start_time');
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refreshed, update session start time
          if (typeof window !== 'undefined') {
            localStorage.setItem('session_start_time', Date.now().toString());
          }
        }
      }

      setIsLoading(false);
    });

    // Periodic session validation
    const sessionCheckInterval = setInterval(async () => {
      if (isLoggedIn) {
        const isValid = await checkSessionExpiry();
        if (!isValid) {
          // Session expired, logout will be handled by checkSessionExpiry
          clearInterval(sessionCheckInterval);
        }
      }
    }, SESSION_CHECK_INTERVAL);

    // Check session on window focus (user returns to tab)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isLoggedIn) {
        await checkSessionExpiry();
      }
    };

    // Check session on window focus
    const handleFocus = async () => {
      if (isLoggedIn) {
        await checkSessionExpiry();
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, [supabase, isLoggedIn, checkSessionExpiry, SESSION_CHECK_INTERVAL]);

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
          // Store session start time for expiration tracking
          if (typeof window !== 'undefined') {
            localStorage.setItem('session_start_time', Date.now().toString());
          }
          return { error: null };
        }

        return {
          error: new Error('Unable to load user profile. Please try again later.'),
        };
      } catch (error) {
        console.error('Error during login:', error);
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        return { error: new Error(errorMessage) };
      }
    },
    [],
  );

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
