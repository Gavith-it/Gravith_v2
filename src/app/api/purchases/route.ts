import { NextResponse } from 'next/server';

import { buildPurchaseUsageMap } from '@/app/api/_utils/work-progress-usage';
import { formatDateOnly } from '@/lib/utils/date';
import type { SharedMaterial } from '@/lib/contexts/materials-context';
import { createClient } from '@/lib/supabase/server';
import type { MaterialMaster } from '@/types/entities';

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
    receiptNumber: row.receipt_number ?? undefined,
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

type SiteResolution =
  | { ok: true; siteId: string | null; siteName: string | null }
  | { ok: false; status: number; message: string };

type SiteRow = {
  id: string;
  name: string;
  organization_id: string;
};

async function resolveSiteByName(
  supabase: SupabaseServerClient,
  siteName: string | null | undefined,
  organizationId: string,
): Promise<SiteResolution> {
  if (!siteName || siteName.trim() === '') {
    return { ok: true, siteId: null, siteName: null };
  }

  const { data, error } = await supabase
    .from('sites')
    .select('id, name, organization_id')
    .eq('name', siteName.trim())
    .eq('organization_id', organizationId)
    .maybeSingle();

  const site = (data as SiteRow | null) ?? null;

  if (error) {
    console.error('Error resolving site by name', error);
    return { ok: false, status: 500, message: 'Unable to resolve site.' };
  }

  if (!site) {
    // Site not found by name - return null (material can exist without site)
    return { ok: true, siteId: null, siteName: null };
  }

  return { ok: true, siteId: site.id, siteName: site.name };
}

type MaterialMasterRow = {
  id: string;
  name: string;
  category: MaterialMaster['category'];
  unit: string;
  quantity: number | string | null;
  consumed_quantity: number | string | null;
  standard_rate: number | string | null;
  site_id: string | null;
  site_name: string | null;
};

/**
 * Find or create Material Master from purchase data
 * Returns the material master ID
 */
async function findOrCreateMaterialMaster(
  supabase: SupabaseServerClient,
  materialName: string,
  unit: string,
  unitRate: number,
  siteId: string | null,
  siteName: string | null,
  purchasedQuantity: number,
  category: MaterialMaster['category'],
  organizationId: string,
  userId: string,
): Promise<{ materialId: string; created: boolean }> {
  // First, try to find existing material by name (case-insensitive)
  const { data: existingMaterials, error: searchError } = await supabase
    .from('material_masters')
    .select('id, name, quantity, unit, standard_rate, site_id, site_name')
    .eq('organization_id', organizationId)
    .ilike('name', materialName.trim());

  if (searchError) {
    console.error('Error searching for material master', searchError);
    throw new Error('Failed to search for material master');
  }

  const existingMaterial = (existingMaterials ?? [] as MaterialMasterRow[]).find(
    (m) => typeof m.name === 'string' && m.name.toLowerCase().trim() === materialName.toLowerCase().trim(),
  ) as MaterialMasterRow | undefined;

  if (existingMaterial) {
    // Material exists - update quantity
    const currentQuantity = Number(existingMaterial.quantity ?? 0);
    const newQuantity = currentQuantity + purchasedQuantity;
    
    // Update standard_rate if the new rate is higher (or use average)
    const currentRate = Number(existingMaterial.standard_rate ?? 0);
    const newRate = currentRate > 0 ? Math.max(currentRate, unitRate) : unitRate;

    const { error: updateError } = await supabase
      .from('material_masters')
      .update({
        quantity: newQuantity,
        standard_rate: newRate,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMaterial.id);

    if (updateError) {
      console.error('Error updating material master quantity', updateError);
      throw new Error('Failed to update material master');
    }

    return { materialId: existingMaterial.id, created: false };
  }

  // Material doesn't exist - create new one
  const newMaterialPayload = {
    name: materialName.trim(),
    category: category, // Use category from purchase form
    unit: unit.trim() || 'units',
    quantity: purchasedQuantity,
    consumed_quantity: 0,
    standard_rate: unitRate,
    is_active: true,
    hsn: '',
    tax_rate: 18, // Default tax rate
    site_id: siteId,
    site_name: siteName,
    organization_id: organizationId,
    created_by: userId,
    updated_by: userId,
  };

  const { data: newMaterial, error: createError } = await supabase
    .from('material_masters')
    .insert(newMaterialPayload)
    .select('id')
    .single();

  if (createError || !newMaterial) {
    console.error('Error creating material master', createError);
    throw new Error('Failed to create material master');
  }

  return { materialId: (newMaterial as { id: string }).id, created: true };
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { organizationId } = ctx;

    // Get pagination params from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' },
        { status: 400 },
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('material_purchases')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (countError) {
      console.error('Error counting purchases', countError);
      return NextResponse.json({ error: 'Failed to load purchases.' }, { status: 500 });
    }

    // Fetch paginated data
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
      .order('purchase_date', { ascending: false })
      .range(offset, offset + limit - 1);

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

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const response = NextResponse.json({
      purchases: purchasesWithUsage,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });

    // Add cache headers: cache for 60 seconds, revalidate in background
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=120',
    );

    return response;
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

    const body = (await request.json()) as Partial<SharedMaterial> & {
      category?: MaterialMaster['category'];
    };
    const {
      materialId,
      materialName,
      site,
      category,
      quantity,
      unit,
      unitRate,
      totalAmount,
      vendor,
      invoiceNumber,
      purchaseDate,
      receiptNumber,
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

    // Resolve site by name to get site_id
    const siteResolution = await resolveSiteByName(supabase, site, ctx.organizationId);
    if (!siteResolution.ok) {
      return NextResponse.json({ error: siteResolution.message }, { status: siteResolution.status });
    }

    // Find or create Material Master automatically
    let resolvedMaterialId = materialId ?? null;
    try {
      const { materialId: masterId } = await findOrCreateMaterialMaster(
        supabase,
        materialName,
        unit ?? 'units',
        unitRate,
        siteResolution.siteId,
        siteResolution.siteName,
        quantity,
        category ?? 'Other',
        ctx.organizationId,
        ctx.userId,
      );
      resolvedMaterialId = masterId;
    } catch (masterError) {
      console.error('Error in findOrCreateMaterialMaster', masterError);
      return NextResponse.json(
        { error: masterError instanceof Error ? masterError.message : 'Failed to process material master.' },
        { status: 500 },
      );
    }

    const payload = {
      material_id: resolvedMaterialId,
      material_name: materialName,
      site_id: siteResolution.siteId,
      site_name: siteResolution.siteName ?? site,
      quantity,
      unit: unit ?? 'units',
      unit_rate: unitRate,
      total_amount: totalAmount ?? quantity * unitRate,
      vendor_invoice_number: invoiceNumber ?? '',
      vendor_name: vendor ?? '',
      purchase_date: purchaseDate ?? formatDateOnly(new Date()),
      receipt_number: receiptNumber ?? null,
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
