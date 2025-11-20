import type { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import type { MaterialReceipt } from '@/types/entities';

export const MUTATION_ROLES = [
  'owner',
  'admin',
  'manager',
  'project-manager',
  'materials-manager',
  'site-supervisor',
  'finance-manager',
  'executive',
  'user',
] as const;

export type MutationRole = (typeof MUTATION_ROLES)[number];

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type ReceiptRow = {
  id: string;
  date: string | null;
  receipt_number: string | null;
  vehicle_number: string | null;
  material_id: string | null;
  material_name: string | null;
  filled_weight: number | string | null;
  empty_weight: number | string | null;
  net_weight: number | string | null;
  quantity: number | string | null;
  vendor_id: string | null;
  vendor_name: string | null;
  linked_purchase_id: string | null;
  site_id: string | null;
  site_name: string | null;
  organization_id: string;
  created_at: string | null;
  updated_at: string | null;
};

export function mapRowToReceipt(row: ReceiptRow): MaterialReceipt {
  return {
    id: row.id,
    date: row.date ?? '',
    receiptNumber: row.receipt_number,
    vehicleNumber: row.vehicle_number ?? '',
    materialId: row.material_id ?? '',
    materialName: row.material_name ?? '',
    filledWeight: Number(row.filled_weight ?? 0),
    emptyWeight: Number(row.empty_weight ?? 0),
    netWeight: Number(row.net_weight ?? 0),
    quantity: Number(row.quantity ?? 0),
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    linkedPurchaseId: row.linked_purchase_id,
    siteId: row.site_id ?? undefined,
    siteName: row.site_name,
    organizationId: row.organization_id,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
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

