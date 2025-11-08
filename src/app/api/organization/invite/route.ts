import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_ROLES = [
  'owner',
  'admin',
  'manager',
  'user',
  'project-manager',
  'site-supervisor',
  'materials-manager',
  'finance-manager',
  'executive',
] as const;

type InviteRole = (typeof ALLOWED_ROLES)[number];

interface InvitePayload {
  email: string;
  role: InviteRole;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<InvitePayload>;
    const email = body.email?.trim().toLowerCase();
    const role = body.role || 'user';

    if (!email || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid invite request. Provide a valid email and role.' },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { data: requesterProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization_id, organization_role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !requesterProfile) {
      console.error('Unable to fetch requester profile', profileError);
      return NextResponse.json(
        { error: 'Unable to verify organization membership.' },
        { status: 403 },
      );
    }

    if (!['owner', 'admin'].includes(requesterProfile.organization_role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to invite members.' },
        { status: 403 },
      );
    }

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, organization_id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      if (existingProfile.organization_id === requesterProfile.organization_id) {
        return NextResponse.json(
          { error: 'This email already belongs to your organization.' },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: 'This email is associated with a different organization.' },
        { status: 409 },
      );
    }

    const adminClient = createAdminClient();

    const { data: invitedUser, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email);

    if (inviteError || !invitedUser?.user) {
      if (inviteError?.message?.toLowerCase().includes('already registered')) {
        return NextResponse.json(
          { error: 'This email is already registered. Ask them to sign in instead.' },
          { status: 409 },
        );
      }

      console.error('Error inviting user', inviteError);
      return NextResponse.json({ error: 'Failed to send invitation.' }, { status: 500 });
    }

    const newUser = invitedUser.user;
    const username = newUser.email?.split('@')[0] ?? newUser.id;

    const { error: upsertError } = await adminClient.from('user_profiles').upsert(
      {
        id: newUser.id,
        username,
        email,
        first_name: newUser.user_metadata?.['first_name'] ?? null,
        last_name: newUser.user_metadata?.['last_name'] ?? null,
        role: 'user',
        organization_id: requesterProfile.organization_id,
        organization_role: role,
        is_active: false,
      },
      { onConflict: 'id' },
    );

    if (upsertError) {
      console.error('Error upserting user profile for invite', upsertError);
      return NextResponse.json({ error: 'Failed to finalize invitation.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error while inviting member:', error);
    return NextResponse.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
