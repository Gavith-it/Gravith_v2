import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import type { Database } from './types';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  try {
    const supabase = createServerClient<Database>(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    // Use getSession instead of getUser to avoid throwing errors
    // This just updates the session without throwing on invalid tokens
    await supabase.auth.getSession();
  } catch (error) {
    // Silently handle errors in middleware - don't break the request
    // API routes will handle authentication themselves
    console.error('Middleware session update error (non-fatal):', error);
  }

  return response;
}
