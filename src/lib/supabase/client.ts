'use client';

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from './types';

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (!supabaseClient) {
    if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
      throw new Error('Supabase client env vars are not set');
    }

    // createBrowserClient automatically handles cookies in the browser
    // Note: Token refresh happens automatically, which requires CORS to be configured
    // in Supabase dashboard for localhost:3000
    supabaseClient = createBrowserClient<Database>(
      process.env['NEXT_PUBLIC_SUPABASE_URL'],
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
      {
        auth: {
          // Auto-refresh is enabled by default, but we rely on server-side refresh via middleware
          // The client will still try to refresh if tokens expire, which requires CORS config
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      },
    );
  }

  return supabaseClient;
}
