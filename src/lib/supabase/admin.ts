import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from './types';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}
