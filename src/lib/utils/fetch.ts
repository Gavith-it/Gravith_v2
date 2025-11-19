/**
 * Fetch utility with proper caching strategy
 * - GET requests: Use stale-while-revalidate pattern
 * - POST/PUT/DELETE: Never cached, always fresh
 */

const CACHE_DURATION = 30; // 30 seconds

interface FetchOptions extends RequestInit {
  cache?: RequestCache;
  revalidate?: number;
}

/**
 * Fetch with optimized caching strategy
 * GET requests use stale-while-revalidate
 * POST/PUT/DELETE requests are never cached
 */
export async function fetchWithCache(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { method = 'GET', cache, revalidate, ...fetchOptions } = options;

  // POST/PUT/DELETE requests should never be cached
  if (method !== 'GET') {
    return fetch(url, {
      ...fetchOptions,
      method,
      cache: 'no-store',
    });
  }

  // For GET requests, use Next.js revalidation
  // This allows showing cached data immediately while fetching fresh data in background
  const headers = new Headers(fetchOptions.headers);
  
  // Use Next.js fetch with revalidation
  return fetch(url, {
    ...fetchOptions,
    method: 'GET',
    cache: cache ?? 'default',
    next: {
      revalidate: revalidate ?? CACHE_DURATION,
    },
  });
}

/**
 * Fetch JSON with caching
 */
export async function fetchJson<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const response = await fetchWithCache(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || `Failed to fetch ${url}: ${response.statusText}`);
  }

  return data as T;
}

