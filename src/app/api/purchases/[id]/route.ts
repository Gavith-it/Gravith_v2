import { NextResponse, type NextRequest } from 'next/server';

import type { SharedMaterial } from '@/lib/contexts/materials-context';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering to prevent caching in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = {
  params: Promise<{ id: string }>;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type PurchaseRow = {
  id: string;
  material_id: string | null;
  material_name: string;
  site_id: string | null;
  site_name: string | null;
  quantity: number | string | null;
  unit: string;
  unit_rate: number | string | null;
  total_amount: number | string | null;
  vendor_invoice_number: string | null;
  vendor_name: string | null;
  purchase_date: string | null;
  receipt_number: string | null;
  filled_weight: number | string | null;
  empty_weight: number | string | null;
  net_weight: number | string | null;
  weight_unit: string | null;
  consumed_quantity: number | string | null;
  remaining_quantity: number | string | null;
  organization_id: string;
  created_at: string | null;
  updated_at: string | null;
  material_masters?: unknown;
};

function mapRowToSharedMaterial(row: PurchaseRow): SharedMaterial {
  const rawCategory = row.material_masters;
  let category: string | undefined;
  if (rawCategory && typeof rawCategory === 'object' && 'category' in rawCategory) {
    const value = (rawCategory as { category?: unknown }).category;
    category = typeof value === 'string' ? value : undefined;
  }

  return {
    id: row.id,
    materialId: row.material_id ?? undefined,
    materialName: row.material_name,
    site: row.site_name ?? '',
    quantity: Number(row.quantity ?? 0),
    unit: row.unit,
    unitRate: Number(row.unit_rate ?? 0),
    costPerUnit: Number(row.unit_rate ?? 0),
    totalAmount: Number(row.total_amount ?? 0),
    vendor: row.vendor_name ?? '',
    invoiceNumber: row.vendor_invoice_number ?? '',
    purchaseDate: row.purchase_date ?? '',
    receiptNumber: row.receipt_number ?? undefined,
    filledWeight: row.filled_weight ? Number(row.filled_weight) : undefined,
    emptyWeight: row.empty_weight ? Number(row.empty_weight) : undefined,
    netWeight: row.net_weight ? Number(row.net_weight) : undefined,
    weightUnit: row.weight_unit ?? undefined,
    consumedQuantity: row.consumed_quantity ? Number(row.consumed_quantity) : undefined,
    remainingQuantity: row.remaining_quantity ? Number(row.remaining_quantity) : undefined,
    category,
  };
}

async function resolveContext(supabase: SupabaseServerClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated.' as const };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('organization_id, organization_role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.organization_id) {
    return { error: 'Unable to resolve organization.' as const };
  }

  return {
    organizationId: profile.organization_id,
    role: profile.organization_role,
    userId: user.id,
  };
}

function mapUpdatePayload(body: Partial<SharedMaterial>) {
  const payload: Record<string, unknown> = {};

  if (body.materialId !== undefined) payload['material_id'] = body.materialId;
  if (body.materialName !== undefined) payload['material_name'] = body.materialName;
  if (body.site !== undefined) payload['site_name'] = body.site;
  if (body.quantity !== undefined) payload['quantity'] = body.quantity;
  if (body.unit !== undefined) payload['unit'] = body.unit;
  if (body.unitRate !== undefined) {
    payload['unit_rate'] = body.unitRate;
    payload['total_amount'] = body.totalAmount ?? body.unitRate * (body.quantity ?? 1);
  }
  if (body.totalAmount !== undefined) payload['total_amount'] = body.totalAmount;
  if (body.vendor !== undefined) payload['vendor_name'] = body.vendor;
  if (body.invoiceNumber !== undefined) payload['vendor_invoice_number'] = body.invoiceNumber;
  if (body.purchaseDate !== undefined) payload['purchase_date'] = body.purchaseDate;
  if (body.receiptNumber !== undefined) payload['receipt_number'] = body.receiptNumber ?? null;
  if (body.filledWeight !== undefined) payload['filled_weight'] = body.filledWeight;
  if (body.emptyWeight !== undefined) payload['empty_weight'] = body.emptyWeight;
  if (body.netWeight !== undefined) payload['net_weight'] = body.netWeight;
  if (body.weightUnit !== undefined) payload['weight_unit'] = body.weightUnit;
  if (body.consumedQuantity !== undefined) payload['consumed_quantity'] = body.consumedQuantity;
  if (body.remainingQuantity !== undefined) payload['remaining_quantity'] = body.remainingQuantity;

  return payload;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (
      !['owner', 'admin', 'manager', 'project-manager', 'materials-manager', 'user'].includes(
        ctx.role,
      )
    ) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('material_purchases')
      .select('id, organization_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching purchase', fetchError);
      return NextResponse.json({ error: 'Unable to update purchase.' }, { status: 500 });
    }

    if (!existing || existing.organization_id !== ctx.organizationId) {
      return NextResponse.json({ error: 'Purchase not found.' }, { status: 404 });
    }

    const body = (await request.json()) as Partial<SharedMaterial>;
    const updatePayload = mapUpdatePayload(body);

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No changes provided.' }, { status: 400 });
    }

    updatePayload['updated_by'] = ctx.userId;

    const { data, error: updateError } = await supabase
      .from('material_purchases')
      .update(updatePayload)
      .eq('id', id)
      .select(
        `
        id,
        material_id,
        material_name,
        site_id,
        site_name,
        quantity,
        unit,
        unit_rate,
        total_amount,
        vendor_invoice_number,
        vendor_name,
        purchase_date,
        receipt_number,
        filled_weight,
        empty_weight,
        net_weight,
        weight_unit,
        consumed_quantity,
        remaining_quantity,
        organization_id,
        created_at,
        updated_at,
        material_masters:material_masters(category)
      `,
      )
      .single();

    if (updateError || !data) {
      console.error('Error updating purchase', updateError);
      return NextResponse.json({ error: 'Failed to update purchase.' }, { status: 500 });
    }

    const response = NextResponse.json({ purchase: mapRowToSharedMaterial(data as PurchaseRow) });

    // Invalidate cache to ensure fresh data is fetched on next request
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error updating purchase', error);
    return NextResponse.json({ error: 'Unexpected error updating purchase.' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (
      !['owner', 'admin', 'manager', 'project-manager', 'materials-manager', 'user'].includes(
        ctx.role,
      )
    ) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('material_purchases')
      .select('id, organization_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error loading purchase before delete', fetchError);
      return NextResponse.json({ error: 'Unable to delete purchase.' }, { status: 500 });
    }

    if (!existing || existing.organization_id !== ctx.organizationId) {
      return NextResponse.json({ error: 'Purchase not found.' }, { status: 404 });
    }

    const { error: deleteError } = await supabase.from('material_purchases').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting purchase', deleteError);
      return NextResponse.json({ error: 'Failed to delete purchase.' }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });

    // Invalidate cache to ensure fresh data is fetched on next request
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error deleting purchase', error);
    return NextResponse.json({ error: 'Unexpected error deleting purchase.' }, { status: 500 });
  }
}
