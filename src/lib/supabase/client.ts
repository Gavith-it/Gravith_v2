'use client';

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from './types';

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (!supabaseClient) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase client env vars are not set');
    }

    supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }

  return supabaseClient;
}
