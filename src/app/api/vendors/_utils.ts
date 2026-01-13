import { NextResponse } from 'next/server';

import type { createClient } from '@/lib/supabase/server';
import type { Vendor } from '@/types';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type VendorRow = {
  id: string;
  name: string;
  category: string;
  contact_person: string;
  email: string | null;
  phone: string;
  address: string;
  gst_number: string | null;
  pan_number: string | null;
  bank_account: string | null;
  ifsc_code: string | null;
  payment_terms: string | null;
  total_paid: number | string | null;
  pending_amount: number | string | null;
  status: string;
  registration_date: string | null;
  notes: string | null;
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

export function mapRowToVendor(row: VendorRow): Vendor {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Vendor['category'],
    contactPerson: row.contact_person,
    email: row.email ?? '',
    phone: row.phone,
    address: row.address,
    gstNumber: row.gst_number ?? undefined,
    panNumber: row.pan_number ?? undefined,
    bankAccount: row.bank_account ?? undefined,
    ifscCode: row.ifsc_code ?? undefined,
    paymentTerms: row.payment_terms ?? undefined,
    totalPaid:
      row.total_paid !== null && row.total_paid !== undefined ? Number(row.total_paid) : undefined,
    pendingAmount:
      row.pending_amount !== null && row.pending_amount !== undefined
        ? Number(row.pending_amount)
        : undefined,
    status: row.status as Vendor['status'],
    registrationDate: row.registration_date ?? undefined,
    notes: row.notes ?? undefined,
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
