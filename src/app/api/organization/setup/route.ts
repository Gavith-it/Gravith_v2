import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/types';
import type { Organization, User } from '@/types/entities';

const SUPPORTED_PLANS = ['free', 'basic', 'premium'] as const;
type SupportedPlan = (typeof SUPPORTED_PLANS)[number];

interface SetupPayload {
  organizationName: string;
  adminName: string;
  adminEmail: string;
  plan?: SupportedPlan;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<SetupPayload>;

    const organizationName = body.organizationName?.trim();
    const adminName = body.adminName?.trim();
    const adminEmail = body.adminEmail?.trim().toLowerCase();
    const selectedPlan = SUPPORTED_PLANS.includes((body.plan as SupportedPlan) ?? 'free')
      ? (body.plan as SupportedPlan)
      : 'free';

    if (!organizationName || !adminName || !adminEmail) {
      return NextResponse.json(
        { error: 'Organization name, administrator name, and email are required.' },
        { status: 400 },
      );
    }

    const [firstName, ...rest] = adminName.split(/\s+/).filter(Boolean);
    const lastName = rest.join(' ');

    const adminClient = createAdminClient();

    const inviteRedirectUrl = getInviteRedirectUrl(request);
    const { data: invitedUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      adminEmail,
      {
        redirectTo: inviteRedirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    );

    if (inviteError || !invitedUser?.user) {
      if (inviteError?.message?.toLowerCase().includes('already registered')) {
        return NextResponse.json(
          { error: 'This email is already registered. Please sign in instead.' },
          { status: 409 },
        );
      }

      console.error('Failed to invite organization owner', inviteError);
      return NextResponse.json({ error: 'Unable to send invitation email.' }, { status: 500 });
    }

    const newUser = invitedUser.user;

    try {
      const { data: organizationRow, error: organizationError } = await adminClient.rpc(
        'create_organization_with_owner',
        {
          p_name: organizationName,
          p_user_id: newUser.id,
          p_user_email: adminEmail,
          p_user_first_name: firstName,
          p_user_last_name: lastName,
        },
      );

      const typedOrganization = organizationRow as
        | Database['public']['Tables']['organizations']['Row']
        | null;

      if (organizationError || !typedOrganization) {
        console.error('Failed to create organization record', organizationError);
        throw new Error('create_organization_with_owner failed');
      }

      if (typedOrganization.subscription !== selectedPlan) {
        const { error: subscriptionError } = await adminClient
          .from('organizations')
          .update({ subscription: selectedPlan })
          .eq('id', typedOrganization.id);

        if (subscriptionError) {
          console.error('Failed to persist subscription selection', subscriptionError);
        }
      }

      const { data: adminProfile, error: profileError } = await adminClient
        .from('user_profiles')
        .select(
          'id, username, email, first_name, last_name, role, organization_id, organization_role, is_active, created_at, updated_at',
        )
        .eq('id', newUser.id)
        .maybeSingle();

      if (profileError || !adminProfile) {
        console.error('Unable to load administrator profile after setup', profileError);
      }

      const responsePayload = {
        organization: mapOrganizationRow(typedOrganization, selectedPlan),
        adminUser: profileToUser(adminProfile, {
          id: newUser.id,
          email: adminEmail,
          firstName,
          lastName,
          organizationId: typedOrganization.id,
        }),
        inviteEmail: adminEmail,
      };

      return NextResponse.json(responsePayload, { status: 201 });
    } catch (innerError) {
      await adminClient.auth.admin.deleteUser(newUser.id);
      throw innerError;
    }
  } catch (error) {
    console.error('Unexpected error during organization setup:', error);
    return NextResponse.json(
      { error: 'Unable to complete organization setup right now. Please try again later.' },
      { status: 500 },
    );
  }
}

function mapOrganizationRow(
  row: Database['public']['Tables']['organizations']['Row'],
  plan: SupportedPlan,
): Organization {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    subscription: plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? 'system',
  };
}

function profileToUser(
  profile: Database['public']['Tables']['user_profiles']['Row'] | null,
  fallback: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    organizationId: string;
  },
): User {
  if (profile) {
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      firstName: profile.first_name ?? undefined,
      lastName: profile.last_name ?? undefined,
      role: profile.role,
      organizationId: profile.organization_id,
      organizationRole: profile.organization_role,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  return {
    id: fallback.id,
    username: fallback.email.split('@')[0] ?? fallback.id,
    email: fallback.email,
    firstName: fallback.firstName,
    lastName: fallback.lastName,
    role: 'admin',
    organizationId: fallback.organizationId,
    organizationRole: 'owner',
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getInviteRedirectUrl(request: Request): string {
  const configured =
    process.env['ORG_SETUP_REDIRECT_URL'] ||
    process.env['INVITE_REDIRECT_URL'] ||
    process.env['NEXT_PUBLIC_SITE_URL'] ||
    process.env['NEXTAUTH_URL'] ||
    process.env['SITE_URL'] ||
    null;

  const baseUrl = configured?.replace(/\/$/, '') || new URL(request.url).origin;

  return `${baseUrl}/invite`;
}

