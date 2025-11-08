import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from './types';

export async function createClient() {
  const cookieStore = await cookies();

  if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
    throw new Error('Supabase server env vars are not set');
  }

  return createServerClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL'],
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method is sometimes triggered from Server Components,
            // which do not allow mutating cookies. This is safe to ignore.
          }
        },
      },
    },
  );
}
