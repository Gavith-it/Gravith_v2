import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Failed to retrieve authenticated user:', authError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select(
        `
          id,
          username,
          email,
          first_name,
          last_name,
          role,
          organization_id,
          organization_role,
          is_active,
          created_at,
          updated_at,
          organization:organizations (
            id,
            name,
            is_active,
            subscription,
            created_at,
            updated_at,
            created_by
          )
        `,
      )
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('Failed to load user profile via admin client:', profileError);
      return NextResponse.json({ error: 'Unable to load user profile' }, { status: 500 });
    }

    if (!profile.is_active) {
      const { error: activateError } = await adminClient
        .from('user_profiles')
        .update({ is_active: true })
        .eq('id', user.id);

      if (activateError) {
        console.error('Failed to activate user profile after authentication:', activateError);
      } else {
        profile.is_active = true;
      }
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Unexpected error fetching authenticated profile:', error);
    return NextResponse.json({ error: 'Unexpected error fetching profile' }, { status: 500 });
  }
}
