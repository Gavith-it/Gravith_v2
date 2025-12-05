/**
 * SWR Fetcher Utility
 * Handles API requests with proper error handling
 * Uses cache: 'no-store' to bypass Next.js/Vercel caching in production
 */

export const fetcher = async <T = unknown>(url: string): Promise<T> => {
  // Use cache: 'no-store' to bypass Next.js/Vercel caching
  // This ensures fresh data is always fetched, especially after mutations
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  if (!res.ok) {
    // Try to parse error message from response
    let errorMessage = 'Failed to fetch';
    try {
      const errorData = await res.json().catch(() => ({}));
      errorMessage =
        (errorData as { error?: string })?.error || `HTTP ${res.status}: ${res.statusText}`;
    } catch {
      errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    }

    const error = new Error(errorMessage) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return res.json() as Promise<T>;
};

/**
 * SWR Configuration
 * Default options for all SWR hooks
 */
export const swrConfig = {
  revalidateOnFocus: false, // Don't refetch on window focus
  revalidateOnReconnect: true, // Refetch when internet reconnects
  dedupingInterval: 30000, // Dedupe requests within 30 seconds
  keepPreviousData: true, // Show previous data while loading new
  errorRetryCount: 3, // Retry failed requests 3 times
  errorRetryInterval: 5000, // Wait 5 seconds between retries
} as const;
