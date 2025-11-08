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
      const { error } = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Failed to load profile:', error);
      return null;
    }

    const { profile } = (await response.json()) as {
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
          subscription?: string | null;
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
        const {
          data: { session },
        } = await supabase.auth.getSession();

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
        console.error('Error checking authentication:', error);
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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { error };
        }

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
        return { error: error as Error };
      }
    },
    [supabase],
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
