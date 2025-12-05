import type { NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/signup', '/home', '/invite'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes - they handle auth themselves
  if (pathname.startsWith('/api')) {
    return updateSession(request);
  }

  // Skip for static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
    return updateSession(request);
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return updateSession(request);
  }

  return updateSession(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
