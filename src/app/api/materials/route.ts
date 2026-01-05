import { NextResponse } from 'next/server';

import { buildPurchaseUsageMap } from '@/app/api/_utils/work-progress-usage';
import { createClient } from '@/lib/supabase/server';
import type { MaterialMaster } from '@/types/entities';
import type { MaterialMasterInput } from '@/types/materials';

// Force dynamic rendering to prevent caching in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type MaterialRow = {
  id: string;
  name: string;
  category: MaterialMaster['category'];
  unit: string;
  site_id: string | null;
  site_name: string | null;
  quantity: number | string | null;
  consumed_quantity: number | string | null;
  standard_rate: number | string | null;
  is_active: boolean | null;
  hsn: string | null;
  tax_rate: number | string | null;
  tax_rate_id?: string | null;
  opening_balance: number | string | null;
  organization_id: string;
  created_at: string | null;
  updated_at: string | null;
  created_by?: string | null;
  updated_by?: string | null;
};

type SiteAllocationRow = {
  id: string;
  material_id: string;
  site_id: string;
  opening_balance: number | string | null;
  inward_qty: number | string | null;
  utilization_qty: number | string | null;
  available_qty: number | string | null;
  organization_id: string;
  created_at: string | null;
  updated_at: string | null;
};

type SiteAllocationResponse = {
  siteId: string;
  siteName: string;
  openingBalance?: number;
  quantity?: number; // Backward compatibility
  inwardQty: number;
  utilizationQty: number;
  availableQty: number;
};

function mapRowToMaterial(
  row: MaterialRow,
  aggregates?: Map<string, { remaining: number; consumed: number }>,
): MaterialMaster & {
  createdDate: string;
  lastUpdated: string;
} {
  const createdAt = row.created_at ?? new Date().toISOString();
  const updatedAt = row.updated_at ?? createdAt;
  const aggregate = aggregates?.get(row.id);
  // Use opening_balance as quantity if available, otherwise fall back to quantity
  const quantityAvailable =
    aggregate?.remaining ??
    (row.opening_balance ? Number(row.opening_balance) : Number(row.quantity ?? 0));
  const quantityConsumed = aggregate?.consumed ?? Number(row.consumed_quantity ?? 0);

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    siteId: row.site_id ?? null,
    siteName: row.site_name ?? null,
    quantity: quantityAvailable,
    consumedQuantity: quantityConsumed,
    standardRate: Number(row.standard_rate ?? 0),
    isActive: Boolean(row.is_active ?? true),
    hsn: row.hsn ?? '',
    taxRate: Number(row.tax_rate ?? 0),
    taxRateId: row.tax_rate_id ?? null,
    organizationId: row.organization_id,
    createdAt,
    updatedAt,
    createdDate: createdAt.split('T')[0] ?? createdAt,
    lastUpdated: updatedAt.split('T')[0] ?? updatedAt,
    openingBalance: row.opening_balance ? Number(row.opening_balance) : null,
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

async function resolveSiteSelection(
  supabase: SupabaseServerClient,
  siteId: string | null | undefined,
  organizationId: string,
): Promise<SiteResolution> {
  if (!siteId) {
    return { ok: true, siteId: null, siteName: null };
  }

  const { data, error } = await supabase
    .from('sites')
    .select('id, name, organization_id')
    .eq('id', siteId)
    .maybeSingle();

  const site = (data as SiteRow | null) ?? null;

  if (error) {
    console.error('Error validating site for material master', error);
    return { ok: false, status: 500, message: 'Unable to validate site selection.' };
  }

  if (!site || site.organization_id !== organizationId) {
    return { ok: false, status: 400, message: 'Invalid site selection.' };
  }

  return { ok: true, siteId: site.id, siteName: site.name };
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
        {
          error:
            'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.',
        },
        { status: 400 },
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('material_masters')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (countError) {
      console.error('Error counting materials', countError);
      return NextResponse.json({ error: 'Failed to load materials.' }, { status: 500 });
    }

    // Fetch paginated data
    const { data, error } = await supabase
      .from('material_masters')
      .select(
        'id, name, category, unit, site_id, site_name, quantity, consumed_quantity, standard_rate, is_active, hsn, tax_rate, tax_rate_id, opening_balance, organization_id, created_at, updated_at',
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching materials', error);
      return NextResponse.json({ error: 'Failed to load materials.' }, { status: 500 });
    }

    const { data: purchaseRowsRaw } = await supabase
      .from('material_purchases')
      .select('id, material_id, quantity, consumed_quantity, remaining_quantity')
      .eq('organization_id', organizationId);

    const purchaseRows =
      (purchaseRowsRaw as Array<{
        id: string;
        material_id: string | null;
        quantity: number | string | null;
        consumed_quantity: number | string | null;
        remaining_quantity: number | string | null;
      }> | null) ?? [];

    let purchaseUsageMap = new Map<string, number>();
    if (purchaseRows && purchaseRows.length > 0) {
      const { data: usageRowsRaw, error: usageError } = await supabase
        .from('work_progress_materials')
        .select('purchase_id, material_id, quantity')
        .eq('organization_id', organizationId);

      if (usageError) {
        console.error('Error loading work progress consumption for materials', usageError);
      } else {
        const usageRows =
          (usageRowsRaw as Array<{
            purchase_id: string | null;
            material_id: string | null;
            quantity: number | string | null;
          }> | null) ?? [];
        purchaseUsageMap = buildPurchaseUsageMap(purchaseRows, usageRows);
      }
    }

    const materialAggregates = new Map<string, { remaining: number; consumed: number }>();
    purchaseRows.forEach((row) => {
      const masterId = row.material_id ?? undefined;
      if (!masterId) return;
      const purchaseId = row.id;
      const baseQuantity = Number(row.quantity ?? 0);
      const consumedFromUsage =
        purchaseUsageMap.get(purchaseId) ??
        Number(
          row.consumed_quantity !== null && row.consumed_quantity !== undefined
            ? row.consumed_quantity
            : 0,
        );
      const remainingFromUsage =
        row.remaining_quantity !== null && row.remaining_quantity !== undefined
          ? Number(row.remaining_quantity)
          : Math.max(0, baseQuantity - consumedFromUsage);

      const current = materialAggregates.get(masterId) ?? { remaining: 0, consumed: 0 };
      current.remaining += remainingFromUsage;
      current.consumed += consumedFromUsage;
      materialAggregates.set(masterId, current);
    });

    // Fetch site allocations for all materials
    const materialIds = (data ?? []).map((row) => row.id);
    const siteAllocationsMap = new Map<string, Array<SiteAllocationResponse>>();

    if (materialIds.length > 0) {
      const { data: allocationsData, error: allocationsError } = await supabase
        .from('material_site_allocations')
        .select('material_id, site_id, opening_balance, inward_qty, utilization_qty, available_qty')
        .in('material_id', materialIds)
        .eq('organization_id', organizationId);

      if (!allocationsError && allocationsData) {
        // Fetch site names for allocations
        const siteIds = [
          ...new Set((allocationsData as SiteAllocationRow[]).map((a) => a.site_id)),
        ];
        const { data: sitesData } = await supabase
          .from('sites')
          .select('id, name')
          .in('id', siteIds)
          .eq('organization_id', organizationId);

        const siteNameMap = new Map<string, string>();
        ((sitesData || []) as Array<{ id: string; name: string }>).forEach((site) => {
          siteNameMap.set(site.id, site.name);
        });

        // Build allocations map
        (allocationsData as SiteAllocationRow[]).forEach((allocation) => {
          const materialId = allocation.material_id;
          const siteId = allocation.site_id;
          const openingBalance = Number(allocation.opening_balance ?? 0);
          const inwardQty = Number(allocation.inward_qty ?? 0);
          const utilizationQty = Number(allocation.utilization_qty ?? 0);
          // Calculate available quantity: Opening Balance + Inward - Utilization
          const availableQty = Number(
            allocation.available_qty ?? Math.max(0, openingBalance + inwardQty - utilizationQty),
          );
          const siteName = siteNameMap.get(siteId) || '';

          if (!siteAllocationsMap.has(materialId)) {
            siteAllocationsMap.set(materialId, []);
          }
          siteAllocationsMap.get(materialId)!.push({
            siteId,
            siteName,
            openingBalance,
            quantity: inwardQty, // Backward compatibility
            inwardQty,
            utilizationQty,
            availableQty,
          });
        });
      }
    }

    const materials = (data ?? []).map((row) => {
      const material = mapRowToMaterial(row as MaterialRow, materialAggregates);
      const allocations = siteAllocationsMap.get((row as MaterialRow).id) || [];

      // Calculate aggregate quantities across all sites
      const totalOpeningBalance = allocations.reduce(
        (sum, alloc) => sum + (alloc.openingBalance ?? 0),
        0,
      );
      const totalInwardQty = allocations.reduce((sum, alloc) => sum + (alloc.inwardQty ?? 0), 0);
      const totalUtilizedQty = allocations.reduce(
        (sum, alloc) => sum + (alloc.utilizationQty ?? 0),
        0,
      );
      const totalAvailableQty = allocations.reduce(
        (sum, alloc) => sum + (alloc.availableQty ?? 0),
        0,
      );

      return {
        ...material,
        openingBalance: row.opening_balance
          ? Number(row.opening_balance)
          : totalOpeningBalance || null,
        inwardQty: totalInwardQty || undefined,
        utilizedQty: totalUtilizedQty || undefined,
        availableQty: totalAvailableQty || undefined,
        siteAllocations: allocations.length > 0 ? allocations : undefined,
      };
    });

    const response = NextResponse.json({
      materials,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

    // Disable caching to ensure fresh data in production
    // This prevents Vercel edge cache from serving stale data after mutations
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error fetching materials', error);
    return NextResponse.json({ error: 'Unexpected error loading materials.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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

    const body = (await request.json()) as Partial<MaterialMasterInput>;
    const {
      name,
      category,
      unit,
      siteId,
      standardRate,
      isActive,
      hsn,
      taxRateId,
      openingBalance,
      siteAllocations,
    } = body;

    if (!name || !category || !unit || typeof standardRate !== 'number' || !taxRateId) {
      return NextResponse.json({ error: 'Missing required material fields.' }, { status: 400 });
    }

    // Validate tax rate ID exists in masters (basic validation)
    // Note: In a real system, you might want to check against a tax_rates table
    const validTaxRateIds = [
      'GST0',
      'GST5',
      'GST12',
      'GST18',
      'GST28',
      'CGST9',
      'SGST9',
      'IGST18',
      'TDS2',
    ];
    if (!validTaxRateIds.includes(taxRateId)) {
      return NextResponse.json({ error: 'Invalid tax rate ID.' }, { status: 400 });
    }

    // Validate site allocations if provided
    if (siteAllocations && siteAllocations.length > 0) {
      for (const allocation of siteAllocations) {
        if (!allocation.siteId) {
          return NextResponse.json(
            { error: 'Each site allocation must have a valid site.' },
            { status: 400 },
          );
        }

        // Validate quantities - openingBalance is required, inwardQty and utilizationQty are read-only
        const openingBalance = allocation.openingBalance ?? allocation.quantity ?? 0;
        const inwardQty = allocation.inwardQty ?? 0;
        const utilizationQty = allocation.utilizationQty ?? 0;

        if (openingBalance <= 0) {
          return NextResponse.json(
            { error: 'Opening balance must be greater than zero.' },
            { status: 400 },
          );
        }

        if (inwardQty < 0) {
          return NextResponse.json(
            { error: 'Inward quantity must be greater than or equal to zero.' },
            { status: 400 },
          );
        }

        if (utilizationQty < 0) {
          return NextResponse.json(
            { error: 'Utilization quantity must be greater than or equal to zero.' },
            { status: 400 },
          );
        }

        // Validate utilization doesn't exceed available (Opening Balance + Inward)
        if (utilizationQty > openingBalance + inwardQty) {
          return NextResponse.json(
            {
              error:
                'Utilization quantity cannot exceed available quantity (Opening Balance + Inward).',
            },
            { status: 400 },
          );
        }

        // Validate site belongs to organization
        const siteRes = await resolveSiteSelection(supabase, allocation.siteId, ctx.organizationId);
        if (!siteRes.ok) {
          return NextResponse.json(
            { error: `Invalid site in allocation: ${siteRes.message}` },
            { status: siteRes.status },
          );
        }
      }
    }

    const siteResolution = await resolveSiteSelection(supabase, siteId ?? null, ctx.organizationId);
    if (!siteResolution.ok) {
      return NextResponse.json(
        { error: siteResolution.message },
        { status: siteResolution.status },
      );
    }

    // Calculate opening balance from site allocations if provided (sum of opening balances)
    const calculatedOpeningBalance =
      siteAllocations && siteAllocations.length > 0
        ? siteAllocations.reduce(
            (sum, alloc) => sum + (alloc.openingBalance ?? alloc.quantity ?? 0),
            0,
          )
        : (openingBalance ?? null);

    // Get tax rate percentage from tax rate ID for backward compatibility
    // Map tax rate codes to percentages
    const taxRateMap: Record<string, number> = {
      GST0: 0,
      GST5: 5,
      GST12: 12,
      GST18: 18,
      GST28: 28,
      CGST9: 9,
      SGST9: 9,
      IGST18: 18,
      TDS2: 2,
    };
    const taxRatePercentage = taxRateMap[taxRateId] ?? 18;

    // Use OB as quantity for backward compatibility
    const finalQuantity = calculatedOpeningBalance ?? 0;

    const payload = {
      name,
      category,
      unit,
      site_id: siteResolution.siteId,
      site_name: siteResolution.siteName,
      quantity: finalQuantity,
      consumed_quantity: 0, // Always 0 - consumed quantity is tracked via work progress
      standard_rate: standardRate,
      is_active: isActive ?? true,
      hsn: hsn ?? '',
      tax_rate: taxRatePercentage,
      tax_rate_id: taxRateId,
      opening_balance: calculatedOpeningBalance,
      organization_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('material_masters')
      .insert(payload)
      .select(
        'id, name, category, unit, site_id, site_name, quantity, standard_rate, is_active, hsn, tax_rate, tax_rate_id, opening_balance, organization_id, created_at, updated_at',
      )
      .single();

    if (error || !data) {
      const message =
        error?.code === '23505'
          ? 'A material with this name already exists.'
          : 'Failed to create material.';
      console.error('Error creating material', error);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const materialId = data.id;

    // Insert site allocations if provided
    if (siteAllocations && siteAllocations.length > 0) {
      const allocationPayloads = siteAllocations.map((allocation) => {
        // Use openingBalance from form, fallback to quantity for backward compatibility
        const openingBalance = allocation.openingBalance ?? allocation.quantity ?? 0;
        const inwardQty = allocation.inwardQty ?? 0; // Read-only, from receipts
        const utilizationQty = allocation.utilizationQty ?? 0; // Read-only, from work progress
        // Available qty = Opening Balance + Inward - Utilization
        const availableQty =
          allocation.availableQty ?? Math.max(0, openingBalance + inwardQty - utilizationQty);

        return {
          material_id: materialId,
          site_id: allocation.siteId,
          opening_balance: openingBalance,
          inward_qty: inwardQty,
          utilization_qty: utilizationQty,
          available_qty: availableQty,
          organization_id: ctx.organizationId,
          created_by: ctx.userId,
          updated_by: ctx.userId,
        };
      });

      const { error: allocationsError } = await supabase
        .from('material_site_allocations')
        .insert(allocationPayloads);

      if (allocationsError) {
        console.error('Error creating site allocations', allocationsError);
        // Clean up material if allocations fail
        await supabase
          .from('material_masters')
          .delete()
          .eq('id', materialId as string);
        return NextResponse.json({ error: 'Failed to create site allocations.' }, { status: 500 });
      }
    }

    // Fetch material with allocations
    const { data: materialData, error: fetchError } = await supabase
      .from('material_masters')
      .select(
        'id, name, category, unit, site_id, site_name, quantity, consumed_quantity, standard_rate, is_active, hsn, tax_rate, tax_rate_id, opening_balance, organization_id, created_at, updated_at',
      )
      .eq('id', materialId as string)
      .single();

    if (fetchError || !materialData) {
      return NextResponse.json({ error: 'Failed to fetch created material.' }, { status: 500 });
    }

    // Fetch site allocations
    const { data: allocationsData } = await supabase
      .from('material_site_allocations')
      .select('material_id, site_id, opening_balance, inward_qty, utilization_qty, available_qty')
      .eq('material_id', materialId as string)
      .eq('organization_id', ctx.organizationId);

    let siteAllocationsResponse: Array<SiteAllocationResponse> = [];
    if (allocationsData && allocationsData.length > 0) {
      const siteIds = [...new Set((allocationsData as SiteAllocationRow[]).map((a) => a.site_id))];
      const { data: sitesData } = await supabase
        .from('sites')
        .select('id, name')
        .in('id', siteIds)
        .eq('organization_id', ctx.organizationId);

      const siteNameMap = new Map<string, string>();
      ((sitesData || []) as Array<{ id: string; name: string }>).forEach((site) => {
        siteNameMap.set(site.id, site.name);
      });

      siteAllocationsResponse = (allocationsData as SiteAllocationRow[]).map((allocation) => {
        const openingBalance = Number(allocation.opening_balance ?? 0);
        const inwardQty = Number(allocation.inward_qty ?? allocation.opening_balance ?? 0);
        const utilizationQty = Number(allocation.utilization_qty ?? 0);
        const availableQty = Number(allocation.available_qty ?? inwardQty - utilizationQty);

        return {
          siteId: allocation.site_id,
          siteName: siteNameMap.get(allocation.site_id) || '',
          openingBalance,
          quantity: inwardQty, // Backward compatibility
          inwardQty,
          utilizationQty,
          availableQty,
        };
      });
    }

    const material = mapRowToMaterial(materialData as MaterialRow);
    const response = NextResponse.json(
      {
        material: {
          ...material,
          siteAllocations: siteAllocationsResponse.length > 0 ? siteAllocationsResponse : undefined,
        },
      },
      { status: 201 },
    );

    // Invalidate cache to ensure fresh data is fetched on next request
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error creating material', error);
    return NextResponse.json({ error: 'Unexpected error creating material.' }, { status: 500 });
  }
}
