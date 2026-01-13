import { NextResponse } from 'next/server';

import type { createClient } from '@/lib/supabase/server';
import type { Expense } from '@/types';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ExpenseRow = {
  id: string;
  description: string;
  amount: number | string;
  category: string;
  subcategory: string | null;
  date: string;
  vendor: string | null;
  vendor_id: string | null;
  site_id: string | null;
  site_name: string | null;
  receipt: string | null;
  status: string;
  paid: number | string | null;
  balance: number | string | null;
  approved_by: string | null;
  approved_by_name: string | null;
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

export function mapRowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount ?? 0),
    category: row.category as Expense['category'],
    subcategory: row.subcategory ?? undefined,
    date: row.date,
    vendor: row.vendor ?? undefined,
    siteId: row.site_id ?? undefined,
    siteName: row.site_name ?? undefined,
    receipt: row.receipt ?? undefined,
    status: row.status as Expense['status'],
    paid: row.paid !== null && row.paid !== undefined ? Number(row.paid) : 0,
    balance: row.balance !== null && row.balance !== undefined ? Number(row.balance) : 0,
    approvedBy: row.approved_by_name ?? row.approved_by ?? undefined,
    approvedByName: row.approved_by_name ?? undefined,
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
