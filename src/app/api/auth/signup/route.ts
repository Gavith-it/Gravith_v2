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

    const { data: organization, error: organizationError } = await adminClient.rpc(
      'create_organization_with_owner',
      {
        p_name: company,
        p_user_id: authUserId,
        p_user_email: email,
        p_user_first_name: firstName,
        p_user_last_name: lastName,
      },
    );

    if (organizationError || !organization) {
      console.error('Error creating organization:', organizationError);
      await adminClient.auth.admin.deleteUser(authUserId);
      return NextResponse.json(
        { error: 'Failed to create organization. Please try again later.' },
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
