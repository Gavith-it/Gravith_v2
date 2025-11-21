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

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    const body = (await request.json()) as {
      username?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
    };

    const adminClient = createAdminClient();
    const updates: Record<string, unknown> = {};

    if (body.email !== undefined) {
      updates['email'] = body.email;
      // Also update auth email if provided
      const { error: emailError } = await adminClient.auth.admin.updateUserById(user.id, {
        email: body.email,
      });
      if (emailError) {
        console.error('Failed to update auth email:', emailError);
      }
    }
    if (body.firstName !== undefined) updates['first_name'] = body.firstName || null;
    if (body.lastName !== undefined) updates['last_name'] = body.lastName || null;
    if (body.username !== undefined) updates['username'] = body.username;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates['updated_at'] = new Date().toISOString();

    const { data: updatedProfile, error: updateError } = await adminClient
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
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
      .single();

    if (updateError || !updatedProfile) {
      console.error('Failed to update user profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return NextResponse.json({ error: 'Unexpected error updating profile' }, { status: 500 });
  }
}
