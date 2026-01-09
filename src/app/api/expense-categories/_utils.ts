import { NextResponse } from 'next/server';

import type { ExpenseCategoryItem } from '@/components/shared/masterData';
import type { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ExpenseCategoryRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  org_id: string | null;
  created_by: string | null;
  updated_by: string | null;
};

const MUTATION_ROLES = [
  'owner',
  'admin',
  'manager',
  'project-manager',
  'site-supervisor',
  'materials-manager',
  'finance-manager',
  'executive',
  'user',
] as const;

type MutationRole = (typeof MUTATION_ROLES)[number];

export function mapRowToExpenseCategory(row: ExpenseCategoryRow): ExpenseCategoryItem {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? '',
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    orgId: row.org_id ?? undefined,
  };
}

export async function resolveContext(supabase: SupabaseServerClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated.' as const };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('organization_id, organization_role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.organization_id) {
    return { error: 'Unable to resolve organization.' as const };
  }

  if (profile.is_active === false) {
    return { error: 'Inactive user.' as const };
  }

  return {
    organizationId: profile.organization_id as string,
    role: profile.organization_role as MutationRole,
    userId: user.id,
  };
}

export function ensureMutationAccess(role: MutationRole) {
  if (!MUTATION_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
  }
  return null;
}
