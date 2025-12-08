import * as React from 'react';

const MOBILE_BREAKPOINT = 768; // md breakpoint (tablets and below)
const SMALL_SCREEN_BREAKPOINT = 640; // sm breakpoint (small screens)

/**
 * Hook to detect if screen is mobile size (below 768px)
 * Uses matchMedia for reactive updates on resize/rotation
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(mql.matches);
    };

    // Set initial value
    setIsMobile(mql.matches);

    // Listen for changes
    mql.addEventListener('change', onChange);

    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}

/**
 * Hook to detect if screen is small (below 640px - sm breakpoint)
 * Uses matchMedia for reactive updates on resize/rotation
 * Useful for components that need to match Tailwind's sm: breakpoint behavior
 */
export function useIsSmallScreen() {
  const [isSmallScreen, setIsSmallScreen] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${SMALL_SCREEN_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsSmallScreen(mql.matches);
    };

    // Set initial value
    setIsSmallScreen(mql.matches);

    // Listen for changes
    mql.addEventListener('change', onChange);

    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isSmallScreen;
}
