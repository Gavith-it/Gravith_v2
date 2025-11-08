import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';

interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SignupPayload>;
    const { firstName, lastName, email, password, company } = body;

    if (!firstName || !lastName || !email || !password || !company) {
      return NextResponse.json(
        { error: 'All fields are required. Please complete the form.' },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();

    const { data: authUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError || !authUser?.user) {
      if (
        createUserError &&
        createUserError.message?.toLowerCase().includes('already registered')
      ) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 },
        );
      }

      console.error('Error creating auth user:', createUserError);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again later.' },
        { status: 500 },
      );
    }

    const authUserId = authUser.user.id;

    const { data: organization, error: organizationError } = await adminClient
      .from('organizations')
      .insert({
        name: company,
        is_active: true,
        created_by: authUserId,
      })
      .select('id')
      .single();

    if (organizationError || !organization) {
      console.error('Error creating organization:', organizationError);
      await adminClient.auth.admin.deleteUser(authUserId);
      return NextResponse.json(
        { error: 'Failed to create organization. Please try again later.' },
        { status: 500 },
      );
    }

    const username = email.split('@')[0];

    const { error: profileError } = await adminClient.from('user_profiles').insert({
      id: authUserId,
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      role: 'admin',
      organization_id: organization.id,
      organization_role: 'owner',
      is_active: true,
    });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      await adminClient.auth.admin.deleteUser(authUserId);
      await adminClient.from('organizations').delete().eq('id', organization.id);
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again later.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: 'Account created successfully. You can now sign in.',
        email,
        organizationId: organization.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Unexpected error during signup:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 },
    );
  }
}
