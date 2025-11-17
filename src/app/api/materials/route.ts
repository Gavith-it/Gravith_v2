import { NextResponse } from 'next/server';

import { buildPurchaseUsageMap } from '@/app/api/_utils/work-progress-usage';
import { createClient } from '@/lib/supabase/server';
import type { MaterialMaster } from '@/types/entities';
import type { MaterialMasterInput } from '@/types/materials';

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
  organization_id: string;
  created_at: string | null;
  updated_at: string | null;
  created_by?: string | null;
  updated_by?: string | null;
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
  const quantityAvailable =
    aggregate?.remaining ?? Number(row.quantity ?? 0);
  const quantityConsumed =
    aggregate?.consumed ?? Number(row.consumed_quantity ?? 0);

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
    organizationId: row.organization_id,
    createdAt,
    updatedAt,
    createdDate: createdAt.split('T')[0] ?? createdAt,
    lastUpdated: updatedAt.split('T')[0] ?? updatedAt,
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

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { organizationId } = ctx;

    const { data, error } = await supabase
      .from('material_masters')
      .select(
        'id, name, category, unit, site_id, site_name, quantity, consumed_quantity, standard_rate, is_active, hsn, tax_rate, organization_id, created_at, updated_at',
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching materials', error);
      return NextResponse.json({ error: 'Failed to load materials.' }, { status: 500 });
    }

    const { data: purchaseRowsRaw, error: purchaseError } = await supabase
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
        Number(row.consumed_quantity !== null && row.consumed_quantity !== undefined ? row.consumed_quantity : 0);
      const remainingFromUsage =
        row.remaining_quantity !== null && row.remaining_quantity !== undefined
          ? Number(row.remaining_quantity)
          : Math.max(0, baseQuantity - consumedFromUsage);

      const current = materialAggregates.get(masterId) ?? { remaining: 0, consumed: 0 };
      current.remaining += remainingFromUsage;
      current.consumed += consumedFromUsage;
      materialAggregates.set(masterId, current);
    });

    const materials = (data ?? []).map((row) =>
      mapRowToMaterial(row as MaterialRow, materialAggregates),
    );
    return NextResponse.json({ materials });
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

    if (!['owner', 'admin', 'manager', 'project-manager', 'materials-manager', 'user'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const body = (await request.json()) as Partial<MaterialMasterInput>;
    const {
      name,
      category,
      unit,
      siteId,
      quantity,
      consumedQuantity,
      standardRate,
      isActive,
      hsn,
      taxRate,
    } = body;

    if (
      !name ||
      !category ||
      !unit ||
      typeof standardRate !== 'number' ||
      typeof quantity !== 'number'
    ) {
      return NextResponse.json({ error: 'Missing required material fields.' }, { status: 400 });
    }

    const normalizedConsumed =
      typeof consumedQuantity === 'number' && !Number.isNaN(consumedQuantity)
        ? Math.max(0, consumedQuantity)
        : 0;

    const siteResolution = await resolveSiteSelection(supabase, siteId ?? null, ctx.organizationId);
    if (!siteResolution.ok) {
      return NextResponse.json({ error: siteResolution.message }, { status: siteResolution.status });
    }

    const payload = {
      name,
      category,
      unit,
      site_id: siteResolution.siteId,
      site_name: siteResolution.siteName,
      quantity,
      consumed_quantity: normalizedConsumed,
      standard_rate: standardRate,
      is_active: isActive ?? true,
      hsn: hsn ?? '',
      tax_rate: taxRate ?? 0,
      organization_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('material_masters')
      .insert(payload)
      .select(
        'id, name, category, unit, site_id, site_name, quantity, standard_rate, is_active, hsn, tax_rate, organization_id, created_at, updated_at',
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

    return NextResponse.json({ material: mapRowToMaterial(data as MaterialRow) }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating material', error);
    return NextResponse.json({ error: 'Unexpected error creating material.' }, { status: 500 });
  }
}
