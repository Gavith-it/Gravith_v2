import { NextResponse } from 'next/server';

import { buildPurchaseUsageMap } from '@/app/api/_utils/work-progress-usage';
import type { SharedMaterial } from '@/lib/contexts/materials-context';
import { createClient } from '@/lib/supabase/server';
import type { MaterialMaster } from '@/types/entities';
import type { MaterialMasterInput } from '@/types/materials';
import { formatDateOnly } from '@/lib/utils/date';

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

function mapRowToSharedMaterial(row: PurchaseRow, usageOverrides?: Map<string, number>): SharedMaterial {
  const rawCategory = row.material_masters;
  let category: MaterialMaster['category'] | undefined;
  if (rawCategory && typeof rawCategory === 'object' && 'category' in rawCategory) {
    const value = (rawCategory as { category?: unknown }).category;
    category = (typeof value === 'string' ? value : undefined) as
      | MaterialMaster['category']
      | undefined;
  }

  const baseQuantity = Number(row.quantity ?? 0);
  const overrideConsumed = usageOverrides?.get(row.id);
  const consumedFromUsage =
    overrideConsumed ??
    Number(
      row.consumed_quantity !== null && row.consumed_quantity !== undefined
        ? row.consumed_quantity
        : 0,
    );
  const remainingFromUsage =
    overrideConsumed !== undefined
      ? Math.max(0, baseQuantity - overrideConsumed)
      :
    (row.remaining_quantity !== null && row.remaining_quantity !== undefined
      ? Number(row.remaining_quantity)
      : Math.max(0, baseQuantity - consumedFromUsage));

  return {
    id: row.id,
    materialId: row.material_id ?? undefined,
    materialName: row.material_name,
    site: row.site_name ?? '',
    quantity: baseQuantity,
    unit: row.unit,
    unitRate: Number(row.unit_rate ?? 0),
    costPerUnit: Number(row.unit_rate ?? 0),
    totalAmount: Number(row.total_amount ?? 0),
    vendor: row.vendor_name ?? '',
    invoiceNumber: row.vendor_invoice_number ?? '',
    purchaseDate: row.purchase_date ?? '',
    addedBy: '',
    filledWeight:
      row.filled_weight !== null && row.filled_weight !== undefined
        ? Number(row.filled_weight)
        : undefined,
    emptyWeight:
      row.empty_weight !== null && row.empty_weight !== undefined
        ? Number(row.empty_weight)
        : undefined,
    netWeight:
      row.net_weight !== null && row.net_weight !== undefined
        ? Number(row.net_weight)
        : undefined,
    weightUnit: row.weight_unit ?? undefined,
    consumedQuantity: consumedFromUsage,
    remainingQuantity: remainingFromUsage,
    category,
    linkedReceiptId: undefined,
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

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { organizationId } = ctx;

    const { data, error } = await supabase
      .from('material_purchases')
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
      .eq('organization_id', organizationId)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error fetching material purchases', error);
      return NextResponse.json({ error: 'Failed to load purchases.' }, { status: 500 });
    }

    const purchaseRowsForUsage =
      (data as Array<{
        id: string;
        material_id: string | null;
        quantity: number | string | null;
      }> | null) ?? [];
    let usageMap = new Map<string, number>();

    if (purchaseRowsForUsage.length > 0) {
      const { data: usageRowsRaw, error: usageError } = await supabase
        .from('work_progress_materials')
        .select('purchase_id, material_id, quantity')
        .eq('organization_id', organizationId);

      if (usageError) {
        console.error('Error fetching material consumption data', usageError);
      } else {
        const usageRows =
          (usageRowsRaw as Array<{
            purchase_id: string | null;
            material_id: string | null;
            quantity: number | string | null;
          }> | null) ?? [];
        usageMap = buildPurchaseUsageMap(purchaseRowsForUsage, usageRows);
      }
    }

    const purchases = (data ?? []).map((row) => mapRowToSharedMaterial(row as PurchaseRow));
    const purchasesWithUsage = purchases.map((purchase) => {
      const consumed = usageMap.get(purchase.id);
      if (consumed === undefined) {
        return purchase;
      }
      return {
        ...purchase,
        consumedQuantity: consumed,
        remainingQuantity: Math.max(0, (purchase.quantity ?? 0) - consumed),
      };
    });

    return NextResponse.json({ purchases: purchasesWithUsage });
  } catch (error) {
    console.error('Unexpected error fetching purchases', error);
    return NextResponse.json({ error: 'Unexpected error loading purchases.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (!['owner', 'admin', 'manager', 'project-manager', 'materials-manager', 'user'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const body = (await request.json()) as Partial<SharedMaterial>;
    const {
      materialId,
      materialName,
      site,
      quantity,
      unit,
      unitRate,
      totalAmount,
      vendor,
      invoiceNumber,
      purchaseDate,
      filledWeight,
      emptyWeight,
      netWeight,
      weightUnit,
      consumedQuantity,
      remainingQuantity,
    } = body;

    if (!materialName || !site || typeof quantity !== 'number' || typeof unitRate !== 'number') {
      return NextResponse.json({ error: 'Missing required purchase fields.' }, { status: 400 });
    }

    const payload = {
      material_id: materialId ?? null,
      material_name: materialName,
      site_id: null,
      site_name: site,
      quantity,
      unit: unit ?? '',
      unit_rate: unitRate,
      total_amount: totalAmount ?? quantity * unitRate,
      vendor_invoice_number: invoiceNumber ?? '',
      vendor_name: vendor ?? '',
      purchase_date: purchaseDate ?? formatDateOnly(new Date()),
      filled_weight: filledWeight ?? null,
      empty_weight: emptyWeight ?? null,
      net_weight: netWeight ?? null,
      weight_unit: weightUnit ?? null,
      consumed_quantity: consumedQuantity ?? 0,
      remaining_quantity: remainingQuantity ?? quantity,
      organization_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('material_purchases')
      .insert(payload)
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

    if (error || !data) {
      console.error('Error creating purchase', error);
      return NextResponse.json({ error: 'Failed to create purchase.' }, { status: 500 });
    }

    return NextResponse.json(
      { purchase: mapRowToSharedMaterial(data as PurchaseRow) },
      { status: 201 },
    );
  } catch (error) {
    console.error('Unexpected error creating purchase', error);
    return NextResponse.json({ error: 'Unexpected error creating purchase.' }, { status: 500 });
  }
}
