'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { type Theme, getStoredTheme, saveTheme, detectSystemTheme, getEffectiveTheme, applyTheme } from '@/lib/theme';

type ThemeContextType = {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Initialize from localStorage or default to 'system'
    if (typeof window !== 'undefined') {
      return getStoredTheme() || 'system';
    }
    return 'system';
  });

  const [mounted, setMounted] = useState(false);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return getEffectiveTheme(theme);
    }
    return 'light';
  });

  // Handle hydration - prevent flash of wrong theme
  useEffect(() => {
    setMounted(true);
    
    // Initialize theme on mount
    const stored = getStoredTheme() || 'system';
    const effective = getEffectiveTheme(stored);
    
    setThemeState(stored);
    setEffectiveTheme(effective);
    applyTheme(effective);
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (!mounted) return;
    
    const effective = getEffectiveTheme(theme);
    setEffectiveTheme(effective);
    applyTheme(effective);
    saveTheme(theme);
  }, [theme, mounted]);

  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (!mounted || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const newEffectiveTheme = e.matches ? 'dark' : 'light';
      setEffectiveTheme(newEffectiveTheme);
      applyTheme(newEffectiveTheme);
    };

    // Set initial value
    handleChange(mediaQuery);

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      if (current === 'light') {
        return 'dark';
      } else if (current === 'dark') {
        return 'system';
      } else {
        // system -> light
        return 'light';
      }
    });
  }, []);

  // Prevent flash of wrong theme during SSR
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

