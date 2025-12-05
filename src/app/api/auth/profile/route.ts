import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // Ensure we always return JSON, even on unexpected errors
  try {
    let supabase;
    try {
      supabase = await createClient();
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      const errorResponse = NextResponse.json(
        {
          error: 'Server configuration error',
          details:
            error instanceof Error ? error.message : 'Failed to initialize authentication service',
        },
        { status: 500 },
      );
      errorResponse.headers.set('Content-Type', 'application/json');
      errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return errorResponse;
    }

    // First check if we have a session - this is safer and won't throw on invalid tokens
    let sessionResult;
    try {
      sessionResult = await supabase.auth.getSession();
    } catch (sessionError) {
      console.error('Failed to get session:', sessionError);
      const errorResponse = NextResponse.json(
        {
          error: 'Session error',
          details: 'Unable to retrieve session. Please try logging in again.',
          code: 'SESSION_ERROR',
        },
        { status: 401 },
      );
      errorResponse.headers.set('Content-Type', 'application/json');
      return errorResponse;
    }

    if (!sessionResult.data?.session) {
      const errorResponse = NextResponse.json(
        { error: 'No active session', details: 'Please log in again', code: 'NO_SESSION' },
        { status: 401 },
      );
      errorResponse.headers.set('Content-Type', 'application/json');
      errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return errorResponse;
    }

    // Use the user from the session directly - this avoids calling getUser()
    // which can throw JSON parsing errors if Supabase returns HTML
    const user = sessionResult.data.session.user ?? null;

    // If we still don't have a user, return error
    if (!user) {
      const errorResponse = NextResponse.json(
        {
          error: 'User not authenticated',
          details: 'Unable to retrieve user information',
          code: 'NO_USER',
        },
        { status: 401 },
      );
      errorResponse.headers.set('Content-Type', 'application/json');
      return errorResponse;
    }

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (error) {
      console.error('Failed to create admin client:', error);
      const errorResponse = NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      );
      errorResponse.headers.set('Content-Type', 'application/json');
      return errorResponse;
    }

    let profile, profileError;
    try {
      const result = await adminClient
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
      profile = result.data;
      profileError = result.error;
    } catch (error) {
      console.error('Failed to load user profile - exception:', error);
      const errorResponse = NextResponse.json({ error: 'Database service error' }, { status: 500 });
      errorResponse.headers.set('Content-Type', 'application/json');
      return errorResponse;
    }

    if (profileError || !profile) {
      console.error('Failed to load user profile via admin client:', profileError);
      const errorResponse = NextResponse.json(
        { error: 'Unable to load user profile', details: profileError?.message },
        { status: 500 },
      );
      errorResponse.headers.set('Content-Type', 'application/json');
      return errorResponse;
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

    const response = NextResponse.json({ profile });

    // Ensure proper headers to prevent HTML responses
    response.headers.set('Content-Type', 'application/json');
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );

    return response;
  } catch (error) {
    console.error('Unexpected error fetching authenticated profile:', error);
    const errorResponse = NextResponse.json(
      { error: 'Unexpected error fetching profile' },
      { status: 500 },
    );
    errorResponse.headers.set('Content-Type', 'application/json');
    return errorResponse;
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    let user, authError;
    try {
      const result = await supabase.auth.getUser();
      user = result.data?.user ?? null;
      authError = result.error ?? null;
    } catch (error: unknown) {
      console.error('Failed to retrieve authenticated user in PATCH:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('JSON') || errorMessage.includes('Unexpected token')) {
        const errorResponse = NextResponse.json(
          {
            error: 'Authentication service unavailable',
            details: 'Session may be invalid. Please try logging in again.',
            code: 'SESSION_INVALID',
          },
          { status: 401 },
        );
        errorResponse.headers.set('Content-Type', 'application/json');
        return errorResponse;
      }

      const errorResponse = NextResponse.json(
        { error: 'Authentication service error', details: errorMessage },
        { status: 500 },
      );
      errorResponse.headers.set('Content-Type', 'application/json');
      return errorResponse;
    }

    if (authError || !user) {
      const errorResponse = NextResponse.json(
        { error: 'Authentication error', details: authError?.message || 'User not authenticated' },
        { status: 401 },
      );
      errorResponse.headers.set('Content-Type', 'application/json');
      return errorResponse;
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

    const response = NextResponse.json({ profile: updatedProfile });
    response.headers.set('Content-Type', 'application/json');
    return response;
  } catch (error: unknown) {
    console.error('Unexpected error updating profile:', error);
    const errorResponse = NextResponse.json(
      {
        error: 'Unexpected error updating profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
    errorResponse.headers.set('Content-Type', 'application/json');
    return errorResponse;
  }
}
