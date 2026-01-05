import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { WorkProgressEntry, WorkProgressMaterial } from '@/types/entities';

// Force dynamic rendering to prevent caching in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type MutationRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'project-manager'
  | 'site-supervisor'
  | 'materials-manager'
  | 'finance-manager'
  | 'executive'
  | 'user';

interface WorkProgressPayload {
  siteId?: string | null;
  siteName: string;
  workType: string;
  description?: string | null;
  workDate: string;
  unit: string;
  length?: number | null;
  breadth?: number | null;
  thickness?: number | null;
  totalQuantity: number;
  laborHours?: number | null;
  progressPercentage?: number | null;
  status: 'in_progress' | 'completed' | 'on_hold';
  notes?: string | null;
  photos?: string[];
  materials?: Array<{
    materialId?: string | null;
    purchaseId?: string | null;
    materialName: string;
    unit: string;
    quantity: number;
    balanceQuantity?: number | null;
  }>;
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

type WorkProgressMaterialRow = {
  id: string;
  work_progress_id: string;
  organization_id: string;
  material_id: string | null;
  purchase_id: string | null;
  material_name: string;
  unit: string;
  quantity: number | string | null;
  balance_quantity: number | string | null;
  created_at: string | null;
  updated_at: string | null;
};

type WorkProgressRow = {
  id: string;
  organization_id: string;
  site_id: string | null;
  site_name: string;
  work_type: string;
  description: string | null;
  work_date: string;
  unit: string;
  length: number | string | null;
  breadth: number | string | null;
  thickness: number | string | null;
  total_quantity: number | string;
  labor_hours: number | string | null;
  progress_percentage: number | string | null;
  status: WorkProgressEntry['status'];
  notes: string | null;
  photos: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  materials?: WorkProgressMaterialRow[] | null;
};

function mapRowToWorkProgress(row: WorkProgressRow): WorkProgressEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    siteId: row.site_id ?? null,
    siteName: row.site_name,
    workType: row.work_type,
    description: row.description ?? undefined,
    workDate: row.work_date,
    unit: row.unit,
    length: row.length !== null ? Number(row.length) : null,
    breadth: row.breadth !== null ? Number(row.breadth) : null,
    thickness: row.thickness !== null ? Number(row.thickness) : null,
    totalQuantity: Number(row.total_quantity),
    laborHours: Number(row.labor_hours ?? 0),
    progressPercentage: Number(row.progress_percentage ?? 0),
    status: row.status,
    notes: row.notes ?? undefined,
    photos: Array.isArray(row.photos) ? row.photos : [],
    materials: (row.materials ?? []).map(
      (material: WorkProgressMaterialRow): WorkProgressMaterial => ({
        id: material.id,
        workProgressId: material.work_progress_id,
        materialId: material.material_id,
        purchaseId: material.purchase_id,
        materialName: material.material_name,
        unit: material.unit,
        quantity: Number(material.quantity ?? 0),
        balanceQuantity:
          material.balance_quantity !== null && material.balance_quantity !== undefined
            ? Number(material.balance_quantity)
            : null,
        organizationId: material.organization_id,
        createdAt: material.created_at ?? '',
        updatedAt: material.updated_at ?? '',
      }),
    ),
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
  };
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

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

    // Get total count for pagination (optimized: use 'id' instead of '*' for faster counting)
    const { count, error: countError } = await supabase
      .from('work_progress_entries')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId);

    if (countError) {
      console.error('Error counting work progress entries', countError);
      return NextResponse.json({ error: 'Failed to load work progress data.' }, { status: 500 });
    }

    // Fetch paginated data
    const { data, error } = await supabase
      .from('work_progress_entries')
      .select(
        `
        id,
        organization_id,
        site_id,
        site_name,
        work_type,
        description,
        work_date,
        unit,
        length,
        breadth,
        thickness,
        total_quantity,
        labor_hours,
        progress_percentage,
        status,
        notes,
        photos,
        created_at,
        updated_at,
        created_by,
        updated_by,
        materials:work_progress_materials(
          id,
          work_progress_id,
          organization_id,
          material_id,
          purchase_id,
          material_name,
          unit,
          quantity,
          balance_quantity,
          created_at,
          updated_at
        )
      `,
      )
      .eq('organization_id', ctx.organizationId)
      .order('work_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching work progress entries', error);
      return NextResponse.json({ error: 'Failed to load work progress data.' }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const entries = (data ?? []).map((row) =>
      mapRowToWorkProgress(row as unknown as WorkProgressRow),
    );

    const response = NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages,
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
    console.error('Unexpected error fetching work progress entries', error);
    return NextResponse.json({ error: 'Unexpected error loading work progress.' }, { status: 500 });
  }
}

// Helper function to recalculate utilization_qty from all work progress entries for a material+site combination
async function recalculateUtilizationQty(
  supabase: SupabaseServerClient,
  ctx: { organizationId: string; userId: string },
  materialId: string,
  siteId: string | null | undefined,
) {
  try {
    if (!siteId) {
      // For unallocated work progress, we don't update site allocations
      return;
    }

    let totalUtilizationQty = 0;

    // First, get all work progress entry IDs for this site
    const { data: workProgressEntries, error: entriesError } = await supabase
      .from('work_progress_entries')
      .select('id')
      .eq('site_id', siteId)
      .eq('organization_id', ctx.organizationId);

    if (entriesError) {
      console.error(
        'Error fetching work progress entries for utilization_qty calculation',
        entriesError,
      );
      return;
    }

    const entryIds = (workProgressEntries ?? []).map((entry) => entry.id);

    if (entryIds.length === 0) {
      // No work progress entries for this site, utilization is 0
      totalUtilizationQty = 0;
    } else {
      // Sum all material quantities consumed in work progress entries for this material+site combination
      const { data: materialsData, error: materialsError } = await supabase
        .from('work_progress_materials')
        .select('quantity')
        .eq('material_id', materialId)
        .eq('organization_id', ctx.organizationId)
        .in('work_progress_id', entryIds);

      if (materialsError) {
        console.error(
          'Error fetching work progress materials for utilization_qty calculation',
          materialsError,
        );
        return;
      }

      // Calculate total utilization from materials data
      totalUtilizationQty = (materialsData ?? []).reduce(
        (sum, material) =>
          sum + Number((material as { quantity: number | string | null }).quantity ?? 0),
        0,
      );
    }

    // Check if allocation exists
    const { data: existingAllocation, error: allocationError } = await supabase
      .from('material_site_allocations')
      .select('id')
      .eq('material_id', materialId)
      .eq('site_id', siteId)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    if (allocationError && allocationError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      console.error('Error checking site allocation', allocationError);
      return;
    }

    if (existingAllocation) {
      // Update existing allocation with new utilization_qty
      // The database trigger will auto-calculate available_qty
      const { error: updateError } = await supabase
        .from('material_site_allocations')
        .update({ utilization_qty: totalUtilizationQty, updated_by: ctx.userId })
        .eq('id', String(existingAllocation.id));

      if (updateError) {
        console.error('Error updating site allocation utilization_qty', updateError);
      }
    } else if (totalUtilizationQty > 0) {
      // Create new allocation if we have utilization but no allocation
      // This shouldn't normally happen, but handle it gracefully
      const { error: insertError } = await supabase.from('material_site_allocations').insert({
        material_id: materialId,
        site_id: siteId,
        opening_balance: 0,
        inward_qty: 0,
        utilization_qty: totalUtilizationQty,
        available_qty: 0, // Will be recalculated by trigger (0 - totalUtilizationQty = 0)
        organization_id: ctx.organizationId,
        created_by: ctx.userId,
        updated_by: ctx.userId,
      });

      if (insertError) {
        console.error('Error creating site allocation for utilization', insertError);
      }
    }
  } catch (error) {
    console.error('Error recalculating utilization_qty', error);
    // Don't fail the work progress operation if utilization_qty update fails
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
      ![
        'owner',
        'admin',
        'manager',
        'project-manager',
        'site-supervisor',
        'materials-manager',
        'finance-manager',
        'executive',
        'user',
      ].includes(ctx.role)
    ) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const body = (await request.json()) as WorkProgressPayload;

    if (!body.siteName || !body.workType || !body.workDate || !body.unit) {
      return NextResponse.json(
        { error: 'Missing required work progress fields.' },
        { status: 400 },
      );
    }

    if (typeof body.totalQuantity !== 'number' || Number.isNaN(body.totalQuantity)) {
      return NextResponse.json({ error: 'Invalid total quantity.' }, { status: 400 });
    }

    const entryPayload = {
      organization_id: ctx.organizationId,
      site_id: body.siteId ?? null,
      site_name: body.siteName,
      work_type: body.workType,
      description: body.description ?? null,
      work_date: body.workDate,
      unit: body.unit,
      length: body.length ?? null,
      breadth: body.breadth ?? null,
      thickness: body.thickness ?? null,
      total_quantity: body.totalQuantity,
      labor_hours: body.laborHours ?? 0,
      progress_percentage: body.progressPercentage ?? 0,
      status: body.status,
      notes: body.notes ?? null,
      photos: body.photos ?? [],
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data: insertedEntry, error: insertError } = await supabase
      .from('work_progress_entries')
      .insert(entryPayload)
      .select(
        `
        id,
        organization_id,
        site_id,
        site_name,
        work_type,
        description,
        work_date,
        unit,
        length,
        breadth,
        thickness,
        total_quantity,
        labor_hours,
        progress_percentage,
        status,
        notes,
        photos,
        created_at,
        updated_at,
        created_by,
        updated_by
      `,
      )
      .single();

    if (insertError || !insertedEntry) {
      console.error('Error inserting work progress entry', insertError);
      return NextResponse.json({ error: 'Failed to create work progress entry.' }, { status: 500 });
    }

    const insertedRow = insertedEntry as WorkProgressRow;

    const materialsPayload = (body.materials ?? []).map((material) => ({
      work_progress_id: insertedRow.id,
      organization_id: ctx.organizationId,
      material_id: material.materialId ?? null,
      purchase_id: material.purchaseId ?? null,
      material_name: material.materialName,
      unit: material.unit,
      quantity: material.quantity,
      balance_quantity: material.balanceQuantity ?? null,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    }));

    if (materialsPayload.length > 0) {
      const { error: materialsError } = await supabase
        .from('work_progress_materials')
        .insert(materialsPayload);

      if (materialsError) {
        console.error('Error inserting work progress materials', materialsError);
        // Attempt to clean up orphan entry
        await supabase.from('work_progress_entries').delete().eq('id', insertedRow.id);
        return NextResponse.json(
          { error: 'Failed to create work progress entry materials.' },
          { status: 500 },
        );
      }
    }

    const { data: entryWithMaterials, error: fetchError } = await supabase
      .from('work_progress_entries')
      .select(
        `
        id,
        organization_id,
        site_id,
        site_name,
        work_type,
        description,
        work_date,
        unit,
        length,
        breadth,
        thickness,
        total_quantity,
        labor_hours,
        progress_percentage,
        status,
        notes,
        photos,
        created_at,
        updated_at,
        created_by,
        updated_by,
        materials:work_progress_materials(
          id,
          work_progress_id,
          organization_id,
          material_id,
          purchase_id,
          material_name,
          unit,
          quantity,
          balance_quantity,
          created_at,
          updated_at
        )
      `,
      )
      .eq('id', insertedRow.id)
      .maybeSingle();

    if (fetchError || !entryWithMaterials) {
      console.error('Error fetching inserted work progress entry', fetchError);
      return NextResponse.json(
        { error: 'Failed to load created work progress entry.' },
        { status: 500 },
      );
    }

    // Recalculate utilization_qty for each material+site combination
    if (body.materials && body.materials.length > 0 && body.siteId) {
      try {
        for (const material of body.materials) {
          if (material.materialId) {
            await recalculateUtilizationQty(supabase, ctx, material.materialId, body.siteId);
          }
        }
      } catch (error) {
        console.error('Error recalculating utilization_qty', error);
        // Don't fail the work progress creation if utilization_qty update fails
      }
    }

    const response = NextResponse.json(
      {
        entry: mapRowToWorkProgress(entryWithMaterials as unknown as WorkProgressRow),
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
    console.error('Unexpected error creating work progress entry', error);
    return NextResponse.json(
      { error: 'Unexpected error creating work progress entry.' },
      { status: 500 },
    );
  }
}
