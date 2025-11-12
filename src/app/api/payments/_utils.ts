import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { Payment } from '@/types';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type PaymentRow = {
  id: string;
  client_name: string;
  amount: number | string;
  status: string;
  due_date: string | null;
  paid_date: string | null;
  site_id: string | null;
  site_name: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
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

export function mapRowToPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    clientName: row.client_name,
    amount: Number(row.amount ?? 0),
    status: row.status as Payment['status'],
    dueDate: row.due_date ?? undefined,
    paidDate: row.paid_date ?? undefined,
    siteId: row.site_id ?? undefined,
    siteName: row.site_name ?? undefined,
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

